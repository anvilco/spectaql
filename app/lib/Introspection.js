const get = require('lodash.get')
// const set = require('lodash.set')
const unset = require('lodash/unset')
// const unset = require('lodash.unset')
const defaults = require('lodash/defaults')
// const defaults = require('lodash.defaults')


// Constructor Options
const ANALYZE_DEFAULT = true
const NORMALIZE_DEFAULT = true
const FIX_QUERY_MUTATION_TYPES_DEFAULT = true
const REMOVE_UNUSED_TYPES_DEFAULT = true

// Method options
const REMOVE_FIELDS_OF_TYPE_DEFAULT = true
const REMOVE_INPUT_FIELDS_OF_TYPE_DEFAULT = true
const REMOVE_POSSIBLE_TYPES_OF_TYPE_DEFAULT = true
const REMOVE_ARGS_OF_TYPE_DEFAULT = true
const CLEANUP_DEFAULT = true

// GraphQL constants
const KIND_SCALAR = 'SCALAR'
const KIND_OBJECT = 'OBJECT'
const KIND_INTERFACE = 'INTERFACE'
const KIND_UNION = 'UNION'
const KIND_ENUM = 'ENUM'
const KIND_INPUT_OBJECT = 'INPUT_OBJECT'
const KIND_LIST = 'LIST'
const KIND_NON_NULL = 'NON_NULL'

// TODO:
//
// interfaces
//
// optimize to only clean if "dirty" and when pulling schema out

const defaultOpts = Object.freeze({
  analyze: ANALYZE_DEFAULT,
  normalize: NORMALIZE_DEFAULT,
  fixQueryAndMutationTypes: FIX_QUERY_MUTATION_TYPES_DEFAULT,

  // Remove Types that are not referenced anywhere by anything
  removeUnusedTypes: REMOVE_UNUSED_TYPES_DEFAULT,

  // Remove things whose Types are not found due to being removed
  removeFieldsWithMissingTypes: true,
  removeArgsWithMissingTypes: true,
  removeInputFieldsWithMissingTypes: true,
  removePossibleTypesOfMissingTypes: true,
})

// Map some opts to their corresponding removeType params for proper defaulting
const optsToRemoveTypeParamsMap = Object.freeze({
  // removeFieldsOfType: 'removeFieldsWithMissingTypes',
  // removeArgsOfType: 'removeArgsWithMissingTypes',
  // removeInputFieldsOfType: 'removeInputFieldsWithMissingTypes',
  // removePossibleTypesOfType: 'removePossibleTypesOfMissingTypes',
  removeFieldsWithMissingTypes: 'removeFieldsOfType',
  removeArgsWithMissingTypes: 'removeArgsOfType',
  removeInputFieldsWithMissingTypes: 'removeInputFieldsOfType',
  removePossibleTypesOfMissingTypes: 'removePossibleTypesOfType'
})

class Introspection {

  constructor(response, opts = {}) {
    if (!response) {
      throw new Error('No response provided!')
    }

    opts = defaults({}, opts, defaultOpts)
    this.setOpts(opts)

    // The rest of the initialization can be handled by this public method
    this.setResponse(response)
  }

  setOpts(opts) {
    this.opts = opts || {}
  }

  // Set/change the response on the instance
  setResponse(responseIn) {
    const response = JSON.parse(JSON.stringify(responseIn))

    const normalizedResponse = Introspection.normalizeIntrospectionResponse(response)
    if (normalizedResponse !== response) {
      this._wasNormalized = true
    }
    this.schema = get(normalizedResponse, '__schema')

    if (this.opts.fixQueryAndMutationTypes) {
      this.fixQueryAndMutationTypes()
    }

    // OK, time to validate
    this.validate()

    if (this.opts.analyze) {
      this.analyze()
    }
  }

  static normalizeIntrospectionResponse(response) {
    if (response && response.data) {
      return response.data
    }

    return response
  }

  validate() {
    if (!this.schema) {
      throw new Error('No schema property detected!')
    }

    if (!this.schema.types) {
      throw new Error('No types detected!')
    }

    // Must have a Query type...but not necessarily a Mutation type
    if (!get(this.schema, `queryType.name`)) {
      throw new Error(`No queryType detected!`)
    }
  }

  analyze() {
    // Map the kind + name to the index in the types array
    this.typeToIndexMap = {}
    this.fieldsOfTypeMap = {}
    this.inputFieldsOfTypeMap = {}
    // AKA Unions
    this.possibleTypesOfTypeMap = {}
    this.argsOfTypeMap = {}

    // Need to keep track of these so that we never remove them for not being referenced
    this.queryTypeName = get(this.schema, 'queryType.name')
    this.mutationTypeName = get(this.schema, 'mutationType.name')

    for (let typesIdx = 0; typesIdx < this.schema.types.length; typesIdx++) {
      const type = this.schema.types[typesIdx]
      if (isUndef(type)) {
        continue
      }

      const {
        kind,
        name,
      } = type
      // These come in as null, not undefined
      const fields = type.fields || []
      const inputFields = type.inputFields || []
      const possibleTypes = type.possibleTypes || []

      const typesKey = buildKey({ kind, name })
      this.typeToIndexMap[typesKey] = typesIdx

      for (let fieldsIdx = 0; fieldsIdx < fields.length; fieldsIdx++) {
        const field = fields[fieldsIdx]
        if (isUndef(field)) {
          continue
        }

        const fieldType = digUnderlyingType(field.type)
        // This should always be arrays...maybe empty, never null
        const args = field.args || []

        const fieldsKey = buildKey(fieldType)
        if (!this.fieldsOfTypeMap[fieldsKey]) {
          this.fieldsOfTypeMap[fieldsKey] = []
        }

        const fieldPath = `types.${typesIdx}.fields.${fieldsIdx}`
        this.fieldsOfTypeMap[fieldsKey].push(fieldPath)

        for (let argsIdx = 0; argsIdx < args.length; argsIdx++) {
          const arg = args[argsIdx]
          if (isUndef(arg)) {
            continue
          }
          const argType = digUnderlyingType(arg.type)

          const argsKey = buildKey(argType)
          if (!this.argsOfTypeMap[argsKey]) {
            this.argsOfTypeMap[argsKey] = []
          }

          const argPath = `${fieldPath}.args.${argsIdx}`
          this.argsOfTypeMap[argsKey].push(argPath)
        }
      }

      for (let inputFieldsIdx = 0; inputFieldsIdx < inputFields.length; inputFieldsIdx++) {
        const inputField = inputFields[inputFieldsIdx]
        if (isUndef(inputField)) {
          continue
        }
        const inputFieldType = digUnderlyingType(inputField.type)
        const inputFieldsKey = buildKey(inputFieldType)
        if (!this.inputFieldsOfTypeMap[inputFieldsKey]) {
          this.inputFieldsOfTypeMap[inputFieldsKey] = []
        }
        const inputFieldPath = `types.${typesIdx}.inputFields.${inputFieldsIdx}`
        this.inputFieldsOfTypeMap[inputFieldsKey].push(inputFieldPath)
      }

      for (let possibleTypesIdx = 0; possibleTypesIdx < possibleTypes.length; possibleTypesIdx++) {
        const possibleType = possibleTypes[possibleTypesIdx]
        if (isUndef(possibleType)) {
          continue
        }

        const possibleTypeType = digUnderlyingType(possibleType)
        const possibleTypeKey = buildKey(possibleTypeType)
        if (!this.possibleTypesOfTypeMap[possibleTypeKey]) {
          this.possibleTypesOfTypeMap[possibleTypeKey] = []
        }
        const possibleTypePath = `types.${typesIdx}.possibleTypes.${possibleTypesIdx}`
        this.possibleTypesOfTypeMap[possibleTypeKey].push(possibleTypePath)
      }
    }
  }

  getResponse() {
    const clonedResponse = {
      __schema: this._cloneSchema()
    }

    if (this._wasNormalized) {
      return {
        data: clonedResponse,
      }
    }

    return clonedResponse
  }

  getType({ kind = KIND_OBJECT, name }) {
    return this.schema.types[this.getTypeIndex({ kind, name })]
  }

  getAllTypes({ includeReserved = false, includeQuery = false, includeMutation = false } = {}) {
    const queryType = this.getQueryType()
    const mutationType = this.getMutationType()

    return this.schema.types.filter((type) => {
      if (!includeReserved && isReservedType(type)) {
        return false
      }
      if (queryType && !includeQuery && typesAreSame(type, queryType)) {
        return false
      }
      if (mutationType && !includeMutation && typesAreSame(type, mutationType)) {
        return false
      }

      return true
    })
  }

  getTypeIndex({ kind, name }) {
    const key = buildKey({ kind, name })
    if (Object.prototype.hasOwnProperty.call(this.typeToIndexMap, key)) {
      return this.typeToIndexMap[key]
    }

    return false
  }

  getQueryType() {
    if (!this.queryTypeName) {
      return false
    }

    return this.getType({ kind: KIND_OBJECT, name: this.queryTypeName })
  }

  getQuery({ name }) {
    const queryType = this.getQueryType()
    if (!queryType) {
      return false
    }

    return this.getField({ typeKind: queryType.kind, typeName: queryType.name, fieldName: name })
  }

  getMutationType() {
    if (!this.mutationTypeName) {
      return false
    }

    return this.getType({ kind: KIND_OBJECT, name: this.mutationTypeName })
  }

  getMutation({ name }) {
    const mutationType = this.getMutationType()
    if (!mutationType) {
      return false
    }

    return this.getField({ typeKind: mutationType.kind, typeName: mutationType.name, fieldName: name })
  }

  getField({ typeKind = KIND_OBJECT, typeName, fieldName }) {
    const type = this.getType({ kind: typeKind, name: typeName })
    if (!(type && type.fields)) {
      return
    }

    return type.fields.find((field) => field.name === fieldName)
  }

  // TODO: add test
  getArg({ typeKind, typeName, fieldName, argName }) {
    const field = this.getField({ typeKind, typeName, fieldName })
    if (!(field && field.args.length)) {
      return
    }

    return field.args.find((arg) => arg.name === argName)
  }

  fixQueryAndMutationTypes(response) {
    for (const [key, defaultTypeName] of [['queryType', 'Query'], ['mutationType', 'Mutation']]) {
      const queryOrMutationTypeName = get(response, `__schema.${key}.name`)
      if (queryOrMutationTypeName && !this.getType({ kind: KIND_OBJECT, name: queryOrMutationTypeName })) {
        this.schema[key] = { name: defaultTypeName }
      }
    }
  }

  removeType({
    kind = KIND_OBJECT,
    name,
    removeFieldsOfType,
    removeInputFieldsOfType,
    removePossibleTypesOfType,
    removeArgsOfType,
    cleanup = CLEANUP_DEFAULT,
  }) {
    const typeKey = buildKey({ kind, name })
    if (!Object.prototype.hasOwnProperty.call(this.typeToIndexMap, typeKey)) {
      return false
    }
    const typeIndex = this.typeToIndexMap[typeKey]
    if (isUndef(typeIndex)) {
      return false
    }

    // Create an object of some of the opts, but mapped to keys that match the params
    // of this method. They will then be used as the default value for the params
    // so that constructor opts will be the default, but they can be overridden in
    // the call.
    const mappedOpts = mapProps({ props: this.opts, map: optsToRemoveTypeParamsMap })
    const mergedOpts = defaults(
      {
        removeFieldsOfType,
        removeInputFieldsOfType,
        removePossibleTypesOfType,
        removeArgsOfType,
      },
      mappedOpts,
    )

    // If we are going to clean up afterwards, then the others should not have to
    const shouldOthersClean = !cleanup

    const originalSchema = this._cloneSchema()

    try {
      delete this.schema.types[typeIndex]
      delete this.typeToIndexMap[typeKey]

      if (mergedOpts.removeArgsOfType) {
        this.removeArgumentsOfType({ kind, name, cleanup: shouldOthersClean })
      }

      if (mergedOpts.removeFieldsOfType) {
        this.removeFieldsOfType({ kind, name, cleanup: shouldOthersClean })
      }

      if (mergedOpts.removeInputFieldsOfType) {
        this.removeInputFieldsOfType({ kind, name, cleanup: shouldOthersClean })
      }

      // AKA Unions
      if (mergedOpts.removePossibleTypesOfType) {
        this.removePossibleTypesOfType({ kind, name, cleanup: shouldOthersClean })
      }

      if (cleanup) {
        this._cleanSchema()
      }

      return true
    } catch (err) {
      this.schema = originalSchema
      throw err
    }
  }

  removeField({ typeKind, typeName, fieldName, cleanup = CLEANUP_DEFAULT }) {
    const type = this.getType({ kind: typeKind, name: typeName })
    if (!(type && type.fields)) {
      return false
    }

    // TODO: build a map for the locations of fields on types?
    type.fields = type.fields.filter((field) => field.name !== fieldName)

    if (cleanup) {
      this._cleanSchema()
    }
  }

  removeArg({ typeKind, typeName, fieldName, argName, cleanup = CLEANUP_DEFAULT }) {
    const field = this.getField({ typeKind, typeName, fieldName })
    // field.args should alwys be an array, never null
    if (!field) {
      return false
    }

    // TODO: build a map for the locations of args on fields?
    field.args = field.args.filter((arg) => arg.name !== argName)

    if (cleanup) {
      this._cleanSchema()
    }
  }

  removeQuery({ name, cleanup = CLEANUP_DEFAULT }) {
    if (!this.queryTypeName) {
      return false
    }

    this.removeField({ typeKind: KIND_OBJECT, typeName: this.queryTypeName, fieldName: name, cleanup })
  }

  removeMutation({ name, cleanup = CLEANUP_DEFAULT }) {
    if (!this.mutationTypeName) {
      return false
    }

    this.removeField({ typeKind: KIND_OBJECT, typeName: this.mutationTypeName, fieldName: name, cleanup })
  }

  removeFieldsOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    return this._removeThingsOfType({ kind, name, map: this.fieldsOfTypeMap, cleanup })
  }

  removeInputFieldsOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    return this._removeThingsOfType({ kind, name, map: this.inputFieldsOfTypeMap, cleanup })
  }

  // AKA Unions
  removePossibleTypesOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    return this._removeThingsOfType({ kind, name, map: this.possibleTypesOfTypeMap, cleanup })
  }

  removeArgumentsOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    return this._removeThingsOfType({ kind, name, map: this.argsOfTypeMap, cleanup })
  }

  // Remove just a single possible value for an Enum, but not the whole Enum
  removeEnumValue({ name, value }) {
    const type = this.getType({ kind: KIND_ENUM, name })
    if (!(type && type.enumValues)) {
      return false
    }

    type.enumValues = type.enumValues.filter((enumValue) => enumValue.name !== value)
  }

  // private

  _removeThingsOfType({ kind, name, map, cleanup = CLEANUP_DEFAULT }) {
    const key = buildKey({ kind, name })
    for (const path of (map[key] || [])) {
      unset(this.schema, path)
    }

    delete map[key]

    if (cleanup) {
      this._cleanSchema()
    }

  }

  _cloneSchema() {
    return JSON.parse(JSON.stringify(this.schema))
  }

  // Removes all the undefined gaps created by various removals
  _cleanSchema() {
    const typesEncountered = new Set()
    const types = []

    // The Query and Mutation Types should never be removed due to not being referenced
    // by anything
    if (this.queryTypeName) {
      typesEncountered.add(buildKey({ kind: KIND_OBJECT, name: this.queryTypeName }))
    }
    if (this.mutationTypeName) {
      typesEncountered.add(buildKey({ kind: KIND_OBJECT, name: this.mutationTypeName }))
    }

    for (const type of this.schema.types) {
      if (!type) {
        continue
      }

      types.push(type)

      const fields = []
      for (const field of (type.fields || [])) {
        if (isUndef(field)) {
          continue
        }

        const fieldType = digUnderlyingType(field.type)
        // Don't add it if its return type does not exist
        if (!this._hasType(fieldType)) {
          continue
        }

        // Keep track of this so we know what we can remove
        typesEncountered.add(buildKey(fieldType))

        const args = []
        for (const arg of (field.args || [])) {
          if (isUndef(arg)) {
            continue
          }

          const argType = digUnderlyingType(arg.type)
          // Don't add it if its return type does not exist
          if (!this._hasType(argType)) {
            continue
          }

          // Keep track of this so we know what we can remove
          typesEncountered.add(buildKey(argType))

          args.push(arg)
        }

        // Args will always be an array. Possible empty, but never null
        field.args = args
        fields.push(field)
      }

      // Fields will be null rather than empty array if no fields
      type.fields = fields.length ? fields : null

      const inputFields = []
      // Don't add it in if it's undefined, or the type is gone
      for (const inputField of (type.inputFields || [])) {
        if (isUndef(inputField)) {
          continue
        }

        const inputFieldType = digUnderlyingType(inputField.type)
        // Don't add it if its return type does not exist
        if (!this._hasType(inputFieldType)) {
          continue
        }

        // Keep track of this so we know what we can remove
        typesEncountered.add(buildKey(inputFieldType))

        inputFields.push(inputField)
      }

      // InputFields will be null rather than empty array if no inputFields
      type.inputFields = inputFields.length ? inputFields : null

      const possibleTypes = []
      for (const possibleType of (type.possibleTypes || [])) {
        if (isUndef(possibleType)) {
          continue
        }

        // possibleTypes array entries have no envelope for the type
        // so do not do possibleType.type here
        const possibleTypeType = digUnderlyingType(possibleType)
        // Don't add it if its return type does not exist
        if (!this._hasType(possibleTypeType)) {
          continue
        }

        // Keep track of this so we know what we can remove
        typesEncountered.add(buildKey(possibleTypeType))

        possibleTypes.push(possibleType)
      }

      // PossibleTypes will be null rather than emptry array if no possibleTypes
      type.possibleTypes = possibleTypes.length ? possibleTypes : null
    }

    // Only include Types that we encountered - if the options say to do so
    const possiblyFilteredTypes = this.opts.removeUnusedTypes ? types.filter((type) => isReservedType(type) || typesEncountered.has(buildKey(type))) : types

    // Replace the Schema
    this.schema = {
      ...this.schema,
      types: possiblyFilteredTypes,
    }

    // Need to re-analyze it, too
    this.analyze()
  }

  _hasType({ kind, name }) {
    const key = buildKey({ kind, name })
    return Object.prototype.hasOwnProperty.call(this.typeToIndexMap, key)
  }
}

function digUnderlyingType(type) {
  while ([KIND_NON_NULL, KIND_LIST].includes(type.kind)) {
    type = type.ofType
  }
  return type
}

function isReservedType(type) {
  return type.name.startsWith('__')
}

function buildKey({ kind, name }) {
  return kind + ':' + name
}

function isUndef(item) {
  return typeof item === 'undefined'
}

function typesAreSame (typeA, typeB) {
  return typeA.kind === typeB.kind && typeA.name === typeB.name
}

function mapProps({ props, map }) {
  return Object.entries(map).reduce(
    (acc, [from, to]) => {
      if (Object.prototype.hasOwnProperty.call(props, from)) {
        acc[to] = props[to]
      }
      return acc
    },
    {},
  )
}

module.exports = Introspection
module.exports.digUnderlyingType = digUnderlyingType
module.exports.KIND_SCALAR = KIND_SCALAR
module.exports.KIND_OBJECT = KIND_OBJECT
module.exports.KIND_INTERFACE = KIND_INTERFACE
module.exports.KIND_UNION = KIND_UNION
module.exports.KIND_ENUM = KIND_ENUM
module.exports.KIND_INPUT_OBJECT = KIND_INPUT_OBJECT
module.exports.KIND_LIST = KIND_LIST
module.exports.KIND_NON_NULL = KIND_NON_NULL
