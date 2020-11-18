/**
 * A simple helper to concatenate strings
 * @param  {...string[, object]} strings - Any number of strings that you want to
 *   concatenate.
 *
 *   Can pass an optional 'joiner' option that will be used to join the strings,
 *   otherwise an empty string is used
 *
 * @return {string} - All the strings combined
 */
module.exports = function(...strings) {
  let joiner = ''
  let filterFalsy = false

  if (typeof strings[strings.length - 1] === 'object') {
    const options = strings.pop()
    joiner = options.hash.joiner || joiner
    filterFalsy = options.hash.filterFalsy === true
  }

  if (filterFalsy) {
    strings = strings.filter((s) => s)
  }


  return strings.join(joiner)
}
