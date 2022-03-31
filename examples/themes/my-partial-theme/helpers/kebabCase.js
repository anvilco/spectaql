const kebabCase = require('lodash/kebabCase')

// Converts a string to kebab case
//
// helloWorld -> hello-world
//
// Options:
//   defaultValue (String) default = ''
module.exports = function (value, options) {
  const defaultValue =
    (options && options.hash && options.hash.defaultValue) || ''
  return value != null ? kebabCase(value) : defaultValue
}
