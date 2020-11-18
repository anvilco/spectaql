// Implements a simple ternary helper.
//
// Options:
//   undefOnly (Boolean) default = false: If truthy, only values that are undefined will trigger the ifFalse
//     condition path.
module.exports = function(value, ifTrue, ifFalse, options) {
  const undefOnly = !!options?.hash?.undefOnly

  if (value) {
    return ifTrue
  }

  if (undefOnly) {
    return typeof value !== 'undefined' ? ifTrue : ifFalse
  }

  return ifFalse
}
