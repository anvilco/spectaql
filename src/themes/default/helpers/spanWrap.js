// Wraps a string in a span with a class
//
// Options:
//   clazz (String)
module.exports = function (value, options) {
  return `<span class="${options?.hash?.className || ''}">${value}</span>`
}
