// Determine if a value is a JSON-schema version of a Unioin
module.exports = (value) => {
  return !!value && typeof value.type === 'undefined' && Array.isArray(value.oneOf) && value.oneOf.length && value.oneOf.every((schema) => !!schema.$ref)
}
