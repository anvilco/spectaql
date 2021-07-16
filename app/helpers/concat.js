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
  let altJoiner
  let altJoinerRegex

  if (typeof strings[strings.length - 1] === 'object') {
    const options = strings.pop()
    joiner = options.hash.joiner || joiner
    filterFalsy = options.hash.filterFalsy === true
    altJoiner = options.hash.altJoiner
    altJoinerRegex = options.hash.altJoinerRegex
  }

  if (filterFalsy) {
    strings = strings.filter((s) => s)
  }

  if (!strings.length) {
    return ''
  }

  if (typeof altJoiner !== 'undefined' && altJoinerRegex) {
    altJoinerRegex = new RegExp(`${altJoinerRegex}$`)
    let lastString = strings.shift()
    let result = lastString
    for (const string of strings) {
      if (altJoinerRegex.test(lastString)) {
        result = result + altJoiner + string
      } else {
        result = result + joiner + string
      }
      lastString = string
    }

    return result
  }


  return strings.join(joiner)
}
