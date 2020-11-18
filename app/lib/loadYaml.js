const fs = require('fs')
const yaml = require('js-yaml')

module.exports = function (path) {
  const fileContent = fs.readFileSync(path, "utf8")
  return yaml.safeLoad(fileContent)
}