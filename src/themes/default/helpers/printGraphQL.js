import Handlebars from 'handlebars'
import { printSchema } from '../../../lib/common'

module.exports = function (value, _options) {
  if (!value) {
    return ''
  }
  const html = printSchema(value)
  return new Handlebars.SafeString(html)
}
