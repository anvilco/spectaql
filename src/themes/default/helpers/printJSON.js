import Handlebars from 'handlebars'
import { printSchema } from '../../../lib/common'

module.exports = function (json, _options) {
  if (!json) {
    return ''
  }
  const html = printSchema(json)
  return new Handlebars.SafeString(html)
}
