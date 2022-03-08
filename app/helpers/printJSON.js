var Handlebars = require('handlebars')
var common = require('../lib/common')

module.exports = function (json, _options) {
  if (!json) {
    return ''
  }
  const html = common.printSchema(json)
  return new Handlebars.SafeString(html)
}
