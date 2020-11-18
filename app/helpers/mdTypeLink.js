const {
  analyzeTypeSchema,
} = require('../spectaql/type-helpers')
const mdLink = require('./mdLink')
const schemaReferenceHref = require('./schemaReferenceHref')
const schemaSubschemaName = require('./schemaSubschemaName')
const schemaDatatype = require('./schemaDatatype')

// Creates a markdown link for the provided Type. Options are passed along to mdLink
module.exports = function mdTypeLink (thing, options) {
  const {
    isRequired,
    isArray,
    itemsRequired,
    ref,
  } = analyzeTypeSchema(thing)

  if (!ref) {
    console.warn(JSON.stringify({
      msg: 'no ref found',
      name: thing.name,
    }))

    return schemaDatatype(thing)
  }

  const url = schemaReferenceHref(ref)
  const texts = [schemaSubschemaName(ref)]

  if (isArray) {
    if (itemsRequired) {
      texts.push('!')
    }
    texts.unshift('[')
    texts.push(']')
  }

  if (isRequired) {
    texts.push('!')
  }

  const text = texts.join('')

  return mdLink(text, url, options)
}
