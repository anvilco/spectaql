import kebabCase from 'lodash/kebabCase'

// Converts a string to kebab case
//
// helloWorld -> hello-world
//
// Options:
//   defaultValue (String) default = ''
module.exports = function (value, options) {
  const defaultValue = options?.hash?.defaultValue || ''
  return value != null ? kebabCase(value) : defaultValue
}
