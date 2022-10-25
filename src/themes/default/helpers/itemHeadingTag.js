const LARGEST_HEADING = 6

module.exports = function (headingNumber, _options) {
  return 'h' + Math.min(headingNumber, LARGEST_HEADING)
}
