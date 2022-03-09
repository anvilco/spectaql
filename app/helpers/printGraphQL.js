var Handlebars = require('handlebars')
var common = require('../lib/common')

module.exports = function (value, _options) {
  if (!value) {
    return ''
  }
  const html = common.printSchema(value)
  return new Handlebars.SafeString(html)
}
