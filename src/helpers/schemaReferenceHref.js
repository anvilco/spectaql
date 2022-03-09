const htmlId = require('./htmlId')

module.exports = function (reference, _options) {
  if (reference.startsWith('#definition-')) {
    return reference
  }

  reference = reference.split('#/definitions/').pop()

  return `#definition-${htmlId(reference)}`
}
