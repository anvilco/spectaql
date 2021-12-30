const get = require('lodash.get')
const set = require('lodash.set')
const unset = require('lodash/unset')
// const unset = require('lodash.unset')
const defaults = require('lodash/defaults')
// const defaults = require('lodash.defaults')


const ANALYZE_DEFAULT = true
const NORMALIZE_DEFAULT = true
const FIX_QUERY_MUTATION_TYPES_DEFAULT = true
const REMOVE_FIELDS_OF_TYPE_DEFAULT = true
const REMOVE_INPUT_FIELDS_OF_TYPE_DEFAULT = true
const REMOVE_ARGUMENTS_OF_TYPE_DEFAULT = true
const CLEANUP_DEFAULT = true

const KIND_SCALAR = 'SCALAR'
const KIND_OBJECT = 'OBJECT'
const KIND_INTERFACE = 'INTERFACE'
const KIND_UNION = 'UNION'
const KIND_ENUM = 'ENUM'
const KIND_INPUT_OBJECT = 'INPUT_OBJECT'
const KIND_LIST = 'LIST'
const KIND_NON_NULL = 'NON_NULL'

class Introspection {

  constructor(responseIn, opts = {}) {
    if (!responseIn) {
      throw new Error('No response provided!')
    }

    this.opts = defaults(opts, {
      analyze: ANALYZE_DEFAULT,
      normalize: NORMALIZE_DEFAULT,
      fixQueryAndMutationTypes: FIX_QUERY_MUTATION_TYPES_DEFAULT,
    })

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
    this.argsOfTypeMap = {}

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

  getType({ kind, name }) {
    return this.schema.types[this.getTypeIndex({ kind, name })]
  }

  getTypeIndex({ kind, name }) {
    const key = buildKey({ kind, name })
    if (Object.prototype.hasOwnProperty.call(this.typeToIndexMap, key)) {
      return this.typeToIndexMap[key]
    }

    return false
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
    kind,
    name,
    removeFieldsOfType = REMOVE_FIELDS_OF_TYPE_DEFAULT,
    removeInputFieldsOfType = REMOVE_INPUT_FIELDS_OF_TYPE_DEFAULT,
    removeArgumentsOfType = REMOVE_ARGUMENTS_OF_TYPE_DEFAULT,
    cleanup = CLEANUP_DEFAULT,
  }) {
    const typeKey = buildKey({ kind, name })
    if (!Object.prototype.hasOwnProperty.call(this.typeToIndexMap, typeKey)) {
      return false
    }
    const typeIndex =  this.typeToIndexMap[typeKey]
    const originalSchema = this._cloneSchema()
    // If we are going to clean up afterwards, then the others should not have to
    const shouldOthersClean = !cleanup
    try {
      delete this.schema.types[typeIndex]
      delete this.typeToIndexMap[typeKey]

      if (removeArgumentsOfType) {
        this.removeArgumentsOfType({ kind, name, cleanup: shouldOthersClean })
      }

      if (removeFieldsOfType) {
        this.removeFieldsOfType({ kind, name, cleanup: shouldOthersClean })
      }

      if (removeInputFieldsOfType) {
        this.removeInputFieldsOfType({ kind, name, cleanup: shouldOthersClean })
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

  removeFieldsOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    const fieldKey = buildKey({ kind, name })
    for (const fieldPath of (this.fieldsOfTypeMap[fieldKey] || [])) {
      unset(this.schema, fieldPath)
    }

    delete this.fieldsOfTypeMap[fieldKey]
    if (cleanup) {
      this._cleanSchema()
    }
  }

  removeInputFieldsOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    const inputFieldKey = buildKey({ kind, name })
    for (const inputFieldPath of (this.inputFieldsOfTypeMap[inputFieldKey] || [])) {
      unset(this.schema, inputFieldPath)
    }

    delete this.inputFieldsOfTypeMap[inputFieldKey]
    if (cleanup) {
      this._cleanSchema()
    }
  }

  removeArgumentsOfType({ kind, name, cleanup = CLEANUP_DEFAULT }) {
    const argKey = buildKey({ kind, name })
    for (const argPath of (this.argsOfTypeMap[argKey] || [])) {
      unset(this.schema, argPath)
    }

    delete this.argsOfTypeMap[argKey]
    if (cleanup) {
      this._cleanSchema()
    }
  }

  // private
  _cloneSchema() {
    return JSON.parse(JSON.stringify(this.schema))
  }

  _cleanSchema() {
    const types = []
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

        const args = []
        for (const arg of (field.args || [])) {
          if (isUndef(arg)) {
            continue
          }
          args.push(arg)
        }

        // Args will always be an array. Possible empty, but never null
        field.args = args
        fields.push(field)
      }

      // Fields will be null rather than empty array if no fields
      type.fields = fields.length ? fields : null

      const inputFields = []
      for (const inputField of (type.inputFields || [])) {
        if (isUndef(inputField)) {
          continue
        }
        inputFields.push(inputField)
      }

      // InputFields will be null rather than empty array if no inputFields
      type.inputFields = inputFields.length ? inputFields : null
    }

    // Replace the Schema
    this.schema = {
      ...this.schema,
      types,
    }

    // Need to re-analyze it, too
    this.analyze()
  }
}

function digUnderlyingType(type) {
  while ([KIND_NON_NULL, KIND_LIST].includes(type.kind)) {
    type = type.ofType
  }
  return type
}

function buildKey({ kind, name }) {
  return kind + ':' + name
}

function isUndef(item) {
  return typeof item === 'undefined'
}

module.exports = Introspection
module.exports.KIND_SCALAR = KIND_SCALAR
module.exports.KIND_OBJECT = KIND_OBJECT
module.exports.KIND_INTERFACE = KIND_INTERFACE
module.exports.KIND_UNION = KIND_UNION
module.exports.KIND_ENUM = KIND_ENUM
module.exports.KIND_INPUT_OBJECT = KIND_INPUT_OBJECT
module.exports.KIND_LIST = KIND_LIST
module.exports.KIND_NON_NULL = KIND_NON_NULL
