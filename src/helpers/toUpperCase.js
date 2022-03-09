/**
 * Converts a string to uppercase
 * @name toUpperCase
 * @param {string} value the input string
 * @returns {string} the uppercase string
 * @api public
 */
module.exports = function (value, _options) {
  return value ? value.toUpperCase() : ''
}
