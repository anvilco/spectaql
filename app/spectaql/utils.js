const path = require('path')
const fs = require('fs')

function fileExists (path) {
  return fs.existsSync(path)
}

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

function fileExtensionIs (fileNameOrPath, extensionOrExtensions) {
  if (typeof fileNameOrPath !== 'string') {
    return false
  }
  const ext = fileNameOrPath.split('.').pop()
  if (!Array.isArray(extensionOrExtensions)) {
    extensionOrExtensions = [extensionOrExtensions]
  }

  return extensionOrExtensions.some((supportExt) => supportExt === ext)
}

module.exports = {
  fileExists,
  fileExtensionIs,
  readTextFile,
  fileToObject,
  readJSONFile,
  readJSFile,
}