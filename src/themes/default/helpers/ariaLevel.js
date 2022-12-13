const LARGEST_HEADING = 6

module.exports = function (headingNumber, _options) {
  if (!headingNumber || headingNumber <= LARGEST_HEADING) {
    return ''
  }

  return 'aria-level="' + headingNumber + '"'
}
