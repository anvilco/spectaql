import get from 'lodash/get'
import codify from './codify'

// Creates a markdown link. The text can be optionally rendered as code
module.exports = function (text, url, options) {
  if (get(options, 'hash.codify') === true) {
    text = codify(text)
  }

  return `[${text}](${url})`
}
