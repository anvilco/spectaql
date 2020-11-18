const {
  getReturnTypeNameFromJsonSchemaReturnSchema: fn
} = require('../spectaql/type-helpers')

module.exports = function getReturnTypeNameFromJsonSchemaReturnSchema (value, _options) {
  return fn(value)
}
