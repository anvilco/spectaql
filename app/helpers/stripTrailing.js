const { get } = require('lodash')
// Strip off a trailer that's found at the end of a string
module.exports = function(string, trailer, options) {
  if (!(string && trailer)) {
    return string
  }

  if (get(options, 'hash.isRegex')) {
    return string.replace(new RegExp(`${trailer}$`), '')
  } else if (string.endsWith(trailer)) {
    return string.slice(0, trailer.length * -1)
  }

  return string
}
