const stripTrailing = require('./stripTrailing')

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
  let fixDoublePeriods = true
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

  // If there are more than 1 string, strip off any trailing "." from all
  // but the last one.
  // Checking for startsWith('.') because sometimes the joiner might be ". "
  if (fixDoublePeriods && joiner.startsWith('.') && strings.length > 1) {
    strings = strings.map((string, idx, strings) => idx === strings.length - 1 ? string : stripTrailing(string, '.', {}))
  }


  return strings.join(joiner)
}
