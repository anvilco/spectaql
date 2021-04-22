// Determine if a value is a JSON-schema version of an Enumerated Type
module.exports = (value) => {
  return value && value.type === 'string' && value.anyOf && value.anyOf.length && value.anyOf.every((schema) => Array.isArray(schema.enum))
}
