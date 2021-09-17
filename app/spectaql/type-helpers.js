const _ = require('lodash')
const {
  // GraphQLScalarType,
  GraphQLNonNull,
  GraphQLList
} = require("graphql")

const SCALARS = {
  Int: 'integer',
  Float: 'number',
  String: 'string',
  Boolean: 'boolean',
  ID: 'string',
};


function digNonNullTypeGraphQL(graphqlType) {
  while (graphqlType instanceof GraphQLNonNull || graphqlType instanceof GraphQLList) {
    graphqlType = graphqlType.ofType
  }

  return graphqlType
}

// Create a JSON Schema and provide metainfo from a GraphQL instance. This is usually
// from something parsing the Introspection Query results. Like in fetch-schema.js:
// const graphQLSchema = graphql.buildClientSchema(introspectionResponse, { assumeValid: true })
function convertGraphQLType(tipe) {
  const normalizedType = {}
  let currentNormalizedType = normalizedType

  // Let's normalize this thing into a JSON representation so that we can share
  // the same logic across flavors:
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (tipe instanceof GraphQLNonNull) {
      currentNormalizedType.kind = 'NON_NULL'
    } else if (tipe instanceof GraphQLList) {
      currentNormalizedType.kind = 'LIST'
    } else {
      currentNormalizedType.name = tipe.name
      break
    }
    // if (type instanceof GraphQLScalarType)
    //     return {
    //         type: SCALARS[type.name]
    //     };

    // If we didn't break yet, then we have to go deeper...via ofType
    tipe = tipe.ofType

    // Create an empty object in the next level down, and move to that level
    currentNormalizedType = currentNormalizedType.ofType = {}
  }

  const results = convertGraphQLJSONType(normalizedType)

  // HACK HACK HACK
  // Add 'required' boolean to schema b/c there is no other clean way for now
  results.schema.required = results.isRequired

  return results
}

// Create a JSON Schema and provide metainfo from a JSON GraphQL representation
function convertGraphQLJSONType(tipe) {
  let isArray = false
  let isRequired = false
  let itemsAreRequired = false

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (tipe.kind === 'NON_NULL') {
      // If we already know this is an array, then this NonNull means that the
      // "items" are required
      if (isArray) {
        itemsAreRequired = true
      } else {
        // Otherwise, we are just saying that the outer thing (which may
        // not be an array) is required
        isRequired = true
      }
    } else if (tipe.kind === 'LIST') {
      isArray = true
    } else {
      break
    }

    tipe = tipe.ofType
  }

  return {
    name: tipe.name,
    isArray,
    isRequired,
    itemsAreRequired,
    schema: generateSchema({
      isArray,
      isRequired,
      itemsAreRequired,
      ref: `#/definitions/${tipe.name}`,
      jsonType: SCALARS[tipe.name] || tipe.name || "object"
    }),
  }
}

// Take the parameters and generate a JSON Schema with it
function generateSchema ({
  isArray,
  // isRequired,
  itemsAreRequired,
  ref,
  jsonType,
} = {}) {
  const envelope = {}
  // Sometimes the juicy part is not top level, so we'll work on that separately
  let juice = {
    $ref: ref,
  }

  // The type starts out as a non-array string
  if (jsonType) {
    juice.type = jsonType
  }

  if (isArray) {
    // If NOT required, then the type should be an "anyOf" array that contains "null"
    if (!itemsAreRequired) {
      juice = {
        anyOf: [
          juice,
          { type: 'null' },
        ]
      }
    }

    // If this is an array, we need to nest the juice and update the envelope
    // type accordingly
    envelope.type = 'array'
    envelope.items = juice
  } else {
    Object.assign(envelope, juice)
  }

  return envelope
}

// It is required is the type is an array containing the string "null" as a value. This is
// standard JSON Schema notation.
function typeIsRequired(schema) {
  const {
    required,
    anyOf,
  } = schema

  // If the required boolean is there, it's from the HACK HACK in convertGraphQLType
  // above
  if (typeof required === 'boolean') {
    return required
  }

  // Otherwise, if it's a conforming JSON Schema object with an anyOf array
  if (Array.isArray(anyOf)) {
    // It is required if there is NOT a 'null' option
    return !anyOf.some((s) => s.type === 'null')
  }

  // Required, I guess
  return true
}

function typeIsArray(schema) {
  const { type, items } = schema

  return !!items && type === 'array'
}

function getNonNullType(schema) {
  const {
    anyOf
  } = schema

  // Array that may contain nullables - we'll take the first non-null type
  if (Array.isArray(anyOf)) {
    return anyOf.find((s) => s.type !== 'null')
  }

  return schema
}

function digNonNullType(schema) {
  if (typeIsArray(schema)) {
    return getNonNullType(schema.items)
  }

  return getNonNullType(schema)
}

function getTypeFromIntrospectionResponse ({
  name,
  kind,
  kinds = ['OBJECT', 'SCALAR', 'ENUM', 'INPUT_OBJECT', 'INTERFACE'],
  introspectionResponse,
} = {}) {
  kinds = kind ? [kind] : kinds
  return name && _.get(introspectionResponse, '__schema.types', []).find((type) => type.name === name && kinds.includes(type.kind))
}

function getFieldFromIntrospectionResponseType ({
  name,
  type: introspectionResponseTypeObject,
} = {}) {
  return name && (introspectionResponseTypeObject.fields || introspectionResponseTypeObject.inputFields || introspectionResponseTypeObject.enumValues || []).find((field) => field.name === name)
}

function getArgFromIntrospectionResponseField ({
  name,
  field: introspectionResponseFieldObject
} = {}) {
  return name && (introspectionResponseFieldObject.args || []).find((arg) => arg.name === name)
}

function returnTypeExistsForJsonSchemaField({
  jsonSchema,
  fieldDefinition,
} = {}) {

  // Fields on proper Types will have properties.return...but (at least) Input Types will have $ref right at the top
  // or nested in { type: 'array', items: { $ref: '...' } }
  const returnTypeName = getReturnTypeNameFromJsonSchemaFieldDefinition(fieldDefinition) || getReturnTypeNameFromJsonSchemaReturnSchema(fieldDefinition)
  return !!returnTypeName && _.has(jsonSchema, `definitions.${returnTypeName}`)
}

function getReturnTypeNameFromJsonSchemaFieldDefinition (fieldDefinition = {}) {
  const returnSchema = _.get(fieldDefinition, 'properties.return')
  return returnSchema && getReturnTypeNameFromJsonSchemaReturnSchema(returnSchema)
}

function getTypeNameFromJsonSchemaArgDefinition (argDefinition = {}) {
  return getReturnTypeNameFromJsonSchemaReturnSchema(argDefinition)
}

function getReturnTypeNameFromJsonSchemaReturnSchema(schema = {}) {
  const $ref = (digNonNullType(schema)).$ref
  if (!($ref && $ref.startsWith('#/definitions/'))) {
  return
  }

  return $ref.replace('#/definitions/', '')
}

// Provide some basic analysis of a type Field from JSON Schema
function analayzeJsonSchemaFieldDefinition (fieldDefinition = {}) {
  const returnSchema = _.get(fieldDefinition, 'properties.return')
  const returnType = getReturnTypeNameFromJsonSchemaReturnSchema(returnSchema)
  return {
    ..._analyzeJsonSchemaDefinition(returnSchema),
    returnType,
  }
}

// Provide some basic analysis of an Argument from JSON Schema
function analyzeJsonSchemaArgDefinition (argDefinition = {}) {
  const type = getTypeNameFromJsonSchemaArgDefinition(argDefinition)

  return {
    ..._analyzeJsonSchemaDefinition(argDefinition),
    type,
  }
}

// Common analyzer
function _analyzeJsonSchemaDefinition (definition = {}) {
  const isArray = typeIsArray(definition)
  return {
    isArray,
    itemsRequired: isArray && typeIsRequired(definition.items)
  }
}

// Handles some weirdness from HACK HACK stuff
function analyzeTypeSchema (thing) {
  const {
    name,
    schema,
    parent,
  } = thing

  let isRequired = false
  let getTypesFrom

  if (schema) {
    // This comes from composePaths -> convertTypeToSchema call?

    // It is a query/mutation path...this is how we do it:
    getTypesFrom = schema

    // This comes from HACK HACK in type-helpers convertGraphQLType
    isRequired = schema.required
  } else {
    // It is a Type...this is how we do it:
    getTypesFrom = thing

    // parent should have been added to the current context in the right place
    if (_.get(parent, 'required', []).includes(name)) {
       isRequired = true
    }
  }

  const isArray = typeIsArray(getTypesFrom)
  const itemsRequired = isArray && typeIsRequired(getTypesFrom.items)
  const type = digNonNullType(getTypesFrom)

  return {
    isRequired,
    isArray,
    itemsRequired,
    getTypesFrom,
    type,
    ref: type.$ref
  }
}

module.exports = {
  digNonNullTypeGraphQL,
  convertGraphQLType,
  convertGraphQLJSONType,
  typeIsRequired,
  typeIsArray,
  getNonNullType,
  digNonNullType,
  getTypeFromIntrospectionResponse,
  getFieldFromIntrospectionResponseType,
  getArgFromIntrospectionResponseField,
  returnTypeExistsForJsonSchemaField,
  getReturnTypeNameFromJsonSchemaFieldDefinition,
  getTypeNameFromJsonSchemaArgDefinition,
  getReturnTypeNameFromJsonSchemaReturnSchema,
  analayzeJsonSchemaFieldDefinition,
  analyzeJsonSchemaArgDefinition,
  analyzeTypeSchema,
}
