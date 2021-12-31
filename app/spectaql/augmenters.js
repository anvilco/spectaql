const _ = require('lodash')

const IntrospectionManipulator = require('../lib/Introspection')

const {
  getTypeFromIntrospectionResponse,
  removeTypeFromIntrospectionResponse,
  getFieldFromIntrospectionResponseType,
  getArgFromIntrospectionResponseField,
  returnTypeExistsForJsonSchemaField,
  analyzeJsonSchemaFieldDefinition,
  analyzeJsonSchemaInputFieldDefinition,
  analyzeJsonSchemaArgDefinition,
} = require('./type-helpers')

const {
  addSpecialTags,
  replaceQuotesWithTags,
} = require('../lib/common')

const isEnum = require('../helpers/isEnum')
const isScalar = require('../helpers/isScalar')
const stripTrailing = require('../helpers/stripTrailing')

const METADATA_OUTPUT_PATH = 'metadata'

const calculateShouldDocument = ({ undocumented, documented, def }) => {
  return undocumented !== true && (documented === true || def === true)
}

function augmentData (args) {
  const introspectionManipulator = new IntrospectionManipulator(args.introspectionResponse)
  args = {
    ...args,
    introspectionManipulator,
  }
  hideThingsBasedOnMetadata(args)
  // addExamplesFromMetadata(args)
  // addExamplesDynamically(args)
  // addDeprecationThings(args)

  return introspectionManipulator.getResponse()
}

const isInputType = ({ name, introspectionResponse }) => {
  return !!getTypeFromIntrospectionResponse({ name, kind: 'INPUT_OBJECT', introspectionResponse })
}

// At this point, the metadata should have been added into the JSON Schema data, so everything
// we need is already there
function addExamplesFromMetadata (args = {}) {
  return _addExamplesToThings({
    ...args,
    fn: ({
      type,
      definition,
    }) => {
      let {
        example,
        examples,
      } = _.get(definition, 'metadata', {})

      if (examples && examples.length) {
        example = examples[Math.floor(Math.random() * examples.length)]
      }

      if (example) {
        switch (type) {
          case 'Field': {
            definition.properties.return.example = addSpecialTags(example, { placeholdQuotes: true })
            return
          }
          case 'Argument': {
            definition.example = addSpecialTags(example, { placeholdQuotes: true })
            return
          }
          case 'Scalar': {
            definition.example = replaceQuotesWithTags(example)
            return
          }
          case 'InputField': {
            definition.example = addSpecialTags(example, { placeholdQuotes: true })
            return
          }
        }
      }
    },
  })
}

function addExamplesDynamically (args = {}) {
  const dynamicExamplesProcessingModule = _.get(args, 'introspectionOptions.dynamicExamplesProcessingModule')

  if (!dynamicExamplesProcessingModule) {
    console.warn('\n\n\nNO EXAMPLE PROCESSOR PATH PROVIDED\n\n\n')
    return args
  }

  let processingModule
  try {
    processingModule = require(dynamicExamplesProcessingModule)
  } catch(e) {
    if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
      console.warn('\n\n\nCOULD NOT LOAD EXAMPLE PROCESSOR\n\n\n')
      return args
    }
    else {
      throw e
    }
  }

  let {
    fieldProcessor,
    inputFieldProcessor,
    argumentProcessor,
    scalarProcessor,
  } = processingModule

  // If no functions, then don't bother
  if (!(fieldProcessor || argumentProcessor || scalarProcessor)) {
    console.warn('\n\n\nNO EXAMPLE PROCESSORS FOUND\n\n\n')
    return args
  }

  fieldProcessor = fieldProcessor || (() => {})
  inputFieldProcessor = inputFieldProcessor || (() => {})
  argumentProcessor = argumentProcessor || (() => {})
  scalarProcessor = scalarProcessor || (() => {})

  function massageExample ({
    value,
    typeName,
  }) {
    if (typeof value === 'undefined') {
      return
    }

    const placeholdQuotes = ['String', 'Date'].includes(typeName)

    return Array.isArray(value)
      ? value.map((val) => addSpecialTags(val, { placeholdQuotes }))
      : addSpecialTags(value, { placeholdQuotes })
  }

  return _addExamplesToThings({
    ...args,
    fn: ({
      grandParentName,
      grandParentType,
      parentName,
      parentType,
      parentDefinition,
      type,
      name,
      definition,
    }) => {
      switch (type) {
        case 'Field': {
          const {
            returnType,
            isArray,
            itemsRequired,
          } = analyzeJsonSchemaFieldDefinition(definition)

          // TODO: provide isRequired here
          const example = fieldProcessor({
            parentName,
            name,
            definition,
            returnType,
            isArray,
            itemsRequired,
            // Give 'em all the args'
            args,
          })

          if (typeof example !== 'undefined') {
            definition.properties.return.example = massageExample({ value: example, typeName: returnType })
          }

          return
        }

        case 'Argument': {
          const {
            type,
            isArray,
            itemsRequired,
          } = analyzeJsonSchemaArgDefinition(definition)

          // TODO: provide isRequired here
          const example = argumentProcessor({
            grandParentName,
            grandParentType,
            parentName,
            parentType,
            parentDefinition,
            name,
            definition,
            type,
            isArray,
            itemsRequired,
            // Give 'em all the args'
            args,
          })

          if (typeof example !== 'undefined') {
            definition.example = massageExample({ value: example, typeName: type })
          }

          return
        }

        case 'Scalar': {
          const example = scalarProcessor({
            name,
            definition,
            type,
            // Give 'em all the args'
            args,
          })

          if (typeof example !== 'undefined') {
            definition.example = massageExample({ value: example, typeName: type })
          }

          return
        }

        case 'InputField': {
          const {
            type: inputFieldType,
            isArray,
            itemsRequired,
          } = analyzeJsonSchemaInputFieldDefinition(definition)

          const example = inputFieldProcessor({
            parentName,
            name,
            type: inputFieldType,
            definition,
            isArray,
            itemsRequired,
            // Give 'em all the args'
            args,
          })

          if (typeof example !== 'undefined') {
            definition.example = massageExample({ value: example, typeName: type })
          }

          return
        }

        default: {
          console.warn(`Unknown type passed: ${type}`)
          break
        }
      }
    },
  })
}

// A re-usable algorithm/processor for adding examples to things in various ways
function _addExamplesToThings (args = {}) {
  const {
    fn: addExampleToThingFn,
    introspectionResponse,
    ...otherArgs
  } = args

  _goThroughThings({
    ...otherArgs,
    fn: ({
      typeName,
      typeDefinition,
      // defaultShowHide,
      // things,
      typeOfThing,
    }) => {
      // If typeOfThing is Type, then parent is a Field, otherwise it's
      // a Query or a Mutation
      const whatDoWeCallAField = typeOfThing === 'Type' ? 'Field' : typeOfThing

      // Scalars get handled differently, then we're done
      if (isScalar(typeDefinition)) {
        addExampleToThingFn({
          name: typeName,
          type: 'Scalar',
          definition: typeDefinition
        })
        return
      }

      // Go through all the Type fields
      Object.entries(typeDefinition.properties || {}).forEach(
        ([fieldName, fieldDefinition]) => {
          // Add examples fields only if we are looking at a proper Type
          //
          // FYI: If this is not a Type, then "field"
          // here is really an individual Query or Mutation...
          if (typeOfThing === 'Type') {
            const fieldOrInputField = isInputType({ name: typeName, introspectionResponse }) ? 'InputField' : 'Field'

            addExampleToThingFn({
              parentName: typeName,
              name: fieldName,
              type: fieldOrInputField,
              definition: fieldDefinition
            })
          }

          // Add examples for arguments for fields on every typeOfThing (e.g. Type, Query, Mutation)
          Object.entries(
            _.get(fieldDefinition, 'properties.arguments.properties', {})
          ).forEach(
            ([argName, argDefinition]) => {

              addExampleToThingFn({

                grandParentName: typeName,
                grandParentType: typeOfThing,

                parentName: fieldName,
                parentType: whatDoWeCallAField,
                parentDefinition: fieldDefinition,

                name: argName,
                type: 'Argument',
                definition: argDefinition,
              })
            }
          )
        }
      )

      return
    }
  })

  return args
}


// TODO: Separate out the metadata copying into JSON Schema results into its own thing?
function hideThingsBasedOnMetadata ({
  introspectionManipulator,
  introspectionOptions,
}) {

  // Hide them Query/Mutation Properties
  hideQueriesAndMutations({
    introspectionManipulator,
    introspectionOptions,
  })

  // Hide the Type Definitions
  hideTypes({
    introspectionManipulator,
    introspectionOptions,
  })

  // This hides fields on Types as well as individual queries and mutations.
  //
  // ** Should be called after hideTypes so that fields can be hidden
  // if their return Type is also hidden - if the options say to do that **
  hideFields({
    introspectionManipulator,
    introspectionOptions,
  })


  // This hides arguments on Type Fields as well as on individual queries and mutationsa.
  //
  // ** Should be called after hideTypes so that arguments can be hidden
  // if their return Type is also hidden - if the options say to do that **
  //
  // Actually, the return Type based Arg hiding is not yet implemented, but this should still
  // run after hideTypes
  hideArguments({
    introspectionManipulator,
    introspectionOptions,
  })

  return {
    introspectionManipulator,
    introspectionOptions,
  }
}

function hideQueriesAndMutations ({
  introspectionManipulator,
  introspectionOptions,
}) {
  const {
    metadatasPath,
    queriesDocumentedDefault,
    mutationsDocumentedDefault,
  } = introspectionOptions

  const {
    queryType: {
      name: queryTypeName,
    },
    mutationType: {
      name: mutationTypeName,
    },
  } = introspectionManipulator.getResponse().__schema

  ;[
    [queryTypeName, queriesDocumentedDefault],
    [mutationTypeName, mutationsDocumentedDefault],
  ].forEach(([name, documentedDefault]) => {
    const type = introspectionManipulator.getType({ name })
    if (!type) {
      return
    }
    const metadata = _.get(type, metadatasPath, {})
    const shouldDocument = calculateShouldDocument({ ...metadata, def: documentedDefault })
    if (!shouldDocument) {
      introspectionManipulator.removeType({ name })
    }
  })
}

function hideTypes ({
  introspectionManipulator,
  introspectionOptions,
}) {
  const {
    metadatasPath,
    typesDocumented,
    typeDocumentedDefault: documentedDefault,
  } = introspectionOptions


  const types = introspectionManipulator.getResponse().__schema.types

  for (const type of types) {
    const metadata = _.get(type, metadatasPath, {})
    const shouldDocument = !!typesDocumented && calculateShouldDocument({ ...metadata, def: documentedDefault })

    if (!shouldDocument) {
      introspectionManipulator.removeType({ kind: type.kind, name: type.name, })
    }
  }
}

// This handles fields on Types, as well as individual queries
// and mutations.
//
// ** Should be called after hideTypes so that fields can be hidden
// if their return Type is also hidden - if the options say to do that **
function hideFields(args = {}) {
  const {
    introspectionManipulator,
    // jsonSchema,
    // introspectionResponse,
    introspectionOptions,
  } = args

  const {
    metadatasPath,

    hideFieldsWithUndocumentedReturnType,
    hideQueriesWithUndocumentedReturnType,
    hideMutationsWithUndocumentedReturnType,

    queryDocumentedDefault,
    mutationDocumentedDefault,
    fieldDocumentedDefault,
  } = introspectionOptions

  const thingTypeToHideIfReturnTypeUndocumentedMap = {
    'Type': hideFieldsWithUndocumentedReturnType,
    'Query': hideQueriesWithUndocumentedReturnType,
    'Mutation': hideMutationsWithUndocumentedReturnType,
  }

  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()

  const types = introspectionManipulator.getResponse().__schema.types

  for (const type of types) {
    let defaultShowHide = fieldDocumentedDefault
    if (queryType && type === queryType) {
      defaultShowHide = queryDocumentedDefault
    } else if (mutationType && type === mutationType) {
      defaultShowHide = mutationDocumentedDefault
    }

    for (const field of (type.fields || [])) {
      const metadata = _.get(field, metadatasPath, {})
      const shouldDocument = calculateShouldDocument({ ...metadata, def: defaultShowHide })
      if (!shouldDocument) {
        introspectionManipulator.removeField({ typeKind: type.kind, typeName: type.name, fieldName: field.name })
      }
    }
  }
}

function hideArguments(args = {}) {
  const {
    introspectionManipulator,
    introspectionOptions,
  } = args

  const {
    metadatasPath,
    queryArgDocumentedDefault,
    mutationArgDocumentedDefault,
    argDocumentedDefault,
  } = introspectionOptions


  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()

  const types = introspectionManipulator.getResponse().__schema.types

  for (const type of types) {
    let defaultShowHide = argDocumentedDefault
    if (queryType && type === queryType) {
      defaultShowHide = queryArgDocumentedDefault
    } else if (mutationType && type === mutationType) {
      defaultShowHide = mutationArgDocumentedDefault
    }

    for (const field of (type.fields || [])) {
      for (const arg of (field.args || [])) {
        const metadata = _.get(arg, metadatasPath, {})
        const shouldDocument = calculateShouldDocument({ ...metadata, def: defaultShowHide })
        if (!shouldDocument) {
          introspectionManipulator.removeArg({ typeKind: type.kind, typeName: type.name, fieldName: field.name, argName: arg.name })
        }
      }
    }
  }
}

function addDeprecationThings (args = {}) {
  const {
    introspectionResponse,
    // introspectionOptions,
  } = args

  _goThroughThings({
    ...args,
    fn: ({
      typeName,
      typeDefinition,
      typeOfThing,
    }) => {
      // Rest of code does not apply and will not work with the following:
      if (typeOfThing !== 'Type' || isScalar(typeDefinition)) {
        return
      }

      const type = getTypeFromIntrospectionResponse({ name: typeName, introspectionResponse })
      if (!type) {
        return
      }

      const thingsToIterate = isEnum(typeDefinition)
        ? typeDefinition.anyOf.map((schema) => [schema.enum[0], schema])
        : Object.entries(typeDefinition.properties)

      thingsToIterate.forEach(
        ([fieldName, fieldDefinition]) => {
          const field = getFieldFromIntrospectionResponseType({ name: fieldName, type })
          if (!field) {
            return
          }
          if (field.isDeprecated) {
            fieldDefinition.isDeprecated = field.isDeprecated
            fieldDefinition.deprecationReason = field.deprecationReason
          }
        }
      )
    }
  })
}

// Just a helper function to standardize some looping/processing that will happen
// a few times, but slightly different
function _goThroughThings ({
  jsonSchema,
  graphQLSchema,
  fn,
  queryDefault,
  mutationDefault,
  typeDefault
} = {}) {
  const queryTypeName = (graphQLSchema.getQueryType() || {}).name
  const mutationTypeName = (graphQLSchema.getMutationType() || {}).name

  ;[
    [
      // An object containing only the Query type
      _.pick(jsonSchema.properties, queryTypeName),
      queryDefault,
      'Query',
    ],
    [
      // An object containing only the Mutation type
      _.pick(jsonSchema.properties, mutationTypeName),
      mutationDefault,
      'Mutation',
    ],
    [
      // All the other types
      jsonSchema.definitions,
      typeDefault,
      'Type'
    ]
  ].forEach(([things, defaultShowHide, typeOfThing]) => {
    Object.entries(things).forEach(([typeName, typeDefinition]) => {
      // If it has no "properties" property, then it's a scalar or something
      // Actually, now most things are gonna make it through, and each
      // iterator needs to defend.
      if (!(Object.hasOwnProperty.call(typeDefinition, 'properties') || isEnum(typeDefinition) || isScalar(typeDefinition))) {
        return
      }

      fn({
        typeName,
        typeDefinition,
        defaultShowHide,
        things,
        typeOfThing,
      })
    })
  })
}


function iterateOverObject (obj, fn) {
  for (const key in obj) {
    const val = obj[key]

    if (typeof val !== 'undefined') {
      const newVal = fn({ key, val, parent: obj })
      if (typeof newVal !== 'undefined') {
        obj[key] = newVal
        continue
      } else if (typeof val === 'object') {
        iterateOverObject (val, fn)
        continue
      }
    }
  }
}

function removeTrailingPeriodsFromDescriptions (obj) {
  iterateOverObject(
    obj,
    ({ key, val }) => {
      if (key === 'description' && typeof val === 'string') {
        return stripTrailing(val, '.', {})
      }
    },
  )

  return obj
}


module.exports = {
  hideThingsBasedOnMetadata,
  addExamplesFromMetadata,
  addExamplesDynamically,
  calculateShouldDocument,
  augmentData,
  iterateOverObject,
  removeTrailingPeriodsFromDescriptions,
}
