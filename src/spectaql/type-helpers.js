import _ from 'lodash'
import { KINDS } from 'microfiber'

export function getTypeFromIntrospectionResponse({
  name,
  kind,
  kinds = [
    KINDS.OBJECT,
    KINDS.SCALAR,
    KINDS.ENUM,
    KINDS.INPUT_OBJECT,
    KINDS.INTERFACE,
  ],
  introspectionResponse,
} = {}) {
  kinds = kind ? [kind] : kinds
  return (
    name &&
    _.get(introspectionResponse, '__schema.types', []).find(
      (type) => type.name === name && kinds.includes(type.kind)
    )
  )
}

export function removeTypeFromIntrospectionResponse({
  name,
  kind,
  introspectionResponse,
} = {}) {
  const types = _.get(introspectionResponse, '__schema.types', [])
  const idx = types.findIndex((e) => e.name === name && e.type === kind)
  if (idx > -1) {
    types.splice(idx, 1)
  }
}

export function getFieldFromIntrospectionResponseType({
  name,
  type: introspectionResponseTypeObject,
} = {}) {
  return (
    name &&
    (
      introspectionResponseTypeObject.fields ||
      introspectionResponseTypeObject.inputFields ||
      introspectionResponseTypeObject.enumValues ||
      []
    ).find((field) => field.name === name)
  )
}

export function getArgFromIntrospectionResponseField({
  name,
  field: introspectionResponseFieldObject,
} = {}) {
  return (
    name &&
    (introspectionResponseFieldObject.args || []).find(
      (arg) => arg.name === name
    )
  )
}

// Analyze a Type that's part of an Introspection object
export function analyzeTypeIntrospection(type) {
  let isRequired = false
  let itemsRequired = false
  let isArray = false

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (type.kind === KINDS.NON_NULL) {
      // If we already know this is an array, then this NonNull means that the
      // "items" are required
      if (isArray) {
        itemsRequired = true
      } else {
        // Otherwise, we are just saying that the outer thing (which may
        // not be an array) is required
        isRequired = true
      }
    } else if (type.kind === KINDS.LIST) {
      isArray = true
    } else {
      break
    }

    type = type.ofType
  }

  return {
    underlyingType: type,
    isRequired,
    isArray,
    itemsRequired,
  }
}

export function introspectionTypeToString(type, { joiner = '' } = {}) {
  const { underlyingType, isRequired, isArray, itemsRequired } =
    analyzeTypeIntrospection(type)

  const pieces = [underlyingType.name]
  if (isArray) {
    if (itemsRequired) {
      pieces.push('!')
    }
    pieces.unshift('[')
    pieces.push(']')
  }
  if (isRequired) {
    pieces.push('!')
  }

  return pieces.join(joiner)
}

export function isReservedType(type) {
  return type.name.startsWith('__')
}

export function typesAreSame(typeA, typeB) {
  return typeA.kind === typeB.kind && typeA.name === typeB.name
}
