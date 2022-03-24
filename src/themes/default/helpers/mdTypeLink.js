import {
  analyzeTypeIntrospection,
  introspectionTypeToString,
} from '../../../spectaql/type-helpers'
import mdLink from './mdLink'
import schemaReferenceHref from './schemaReferenceHref'

// Creates a markdown link for the provided Type. Options are passed along to mdLink
module.exports = function mdTypeLink(thing, options) {
  thing = normalizeThing(thing)
  const {
    underlyingType,
    // isRequired,
    // isArray,
    // itemsRequired,
  } = thing.response || analyzeTypeIntrospection(thing.type)

  if (!underlyingType) {
    console.warn(
      JSON.stringify({
        msg: 'no underlyingType found',
        name: thing.name,
      })
    )

    return thing.name
  }

  const url = schemaReferenceHref(underlyingType.name)
  const text = introspectionTypeToString(thing.type)
  return mdLink(text, url, options)
}

// Some of the "things" passed to this will be full objects with a "type", and other things will
// be the "type" object itself...so we normalize this a bit
function normalizeThing(thing) {
  if (thing.type) {
    return thing
  }
  return {
    ...thing,
    type: thing,
  }
}
