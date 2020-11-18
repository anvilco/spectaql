const path = require('path')
const fs = require('fs')

function readTextFile (path, options = {}) {
  options = {
    encoding: 'utf-8',
    ...options
  }

  return fs.readFileSync(path, options)
}

function fileToObject (pathToFile, options) {
  return path.extname(pathToFile) === '.js' ? readJSFile(pathToFile, options) : readJSONFile(pathToFile, options)
}

function readJSONFile (path, options) {
  return JSON.parse(readTextFile(path, options))
}

function readJSFile (path, _options) {
  return require(path)
}

module.exports = {
  readTextFile,
  fileToObject,
  readJSONFile,
  readJSFile,
}