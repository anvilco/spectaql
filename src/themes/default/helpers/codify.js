import get from 'lodash/get'
// Wraps a string in `backticks` so when it's rendered in markdown it will look cool
//
// Options:
//   stringify (Boolean) default = false: If truthy, the value will be JSON.stringify'd before being returned
module.exports = function (value, options) {
  if (typeof value === 'undefined') {
    return value
  }

  const stringify = !!get(options, 'hash.stringify')
  if (stringify) {
    value = JSON.stringify(value)
  }

  return '`' + value + '`'
}
