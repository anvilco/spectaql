const {
  analyzeTypeIntrospection,
  introspectionTypeToString,
} = require('../spectaql/type-helpers')
const mdLink = require('./mdLink')
const schemaReferenceHref = require('./schemaReferenceHref')

// Creates a markdown link for the provided Type. Options are passed along to mdLink
module.exports = function mdTypeLink (thing, options) {
  const {
    underlyingType,
    // isRequired,
    // isArray,
    // itemsRequired,
  } = (thing.response || analyzeTypeIntrospection(thing.type))

  if (!underlyingType) {
    console.warn(JSON.stringify({
      msg: 'no underlyingType found',
      name: thing.name,
    }))

    return thing.name
  }

  const url = schemaReferenceHref(underlyingType.name)
  const text = introspectionTypeToString(thing.type)
  return mdLink(text, url, options)
}
