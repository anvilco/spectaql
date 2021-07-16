// Determine if a value is a JSON-schema version of a Unioin
module.exports = (value) => {
  return value && typeof value.type === 'undefined' && Array.isArray(value.anyOf) && value.anyOf.length && value.anyOf.every((schema) => !!schema.$ref)
}
