const { readTextFile } = require('../spectaql/utils')

module.exports = function (path, _options) {
  const text = readTextFile(path)
  return text
}
