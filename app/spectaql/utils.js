const path = require('path')
const fs = require('fs')

// How far is this file from the Root?
const numDirsToRoot = 2
const pathToRoot = path.resolve(__dirname, '../'.repeat(numDirsToRoot))

function normalizePathFn (pth) {
  if (!pth.startsWith('/')) {
    pth = pathToRoot + '/' + pth
  }

  return path.resolve(pth)
}

function fileExists (pth, { normalizePath = true } = {}) {
  if (normalizePath) {
    pth = normalizePathFn(pth)
  }
  return fs.existsSync(pth)
}

function readTextFile (pth, options = {}) {
  let {
    normalizePath = true,
    ...optionsForReadFileSync
  } = options

  optionsForReadFileSync = {
    encoding: 'utf-8',
    ...optionsForReadFileSync
  }
  if (normalizePath) {
    pth = normalizePathFn(pth)
  }

  return fs.readFileSync(pth, optionsForReadFileSync)
}

function fileToObject (pathToFile, options = {}) {
  let {
    normalizePath = true,
    ...otherOptions
  } = options
  if (normalizePath) {
    pathToFile = normalizePathFn(pathToFile)
  }
  return path.extname(pathToFile) === '.js' ? readJSFile(pathToFile, otherOptions) : readJSONFile(pathToFile, otherOptions)
}

function readJSONFile (pth, options = {}) {
  let {
    normalizePath = true,
    ...optionsForReadJSONParse
  } = options
  if (normalizePath) {
    pth = normalizePathFn(pth)
  }
  return JSON.parse(readTextFile(pth, optionsForReadJSONParse))
}

function readJSFile (pth, { normalizePath = true } = {}) {
  if (normalizePath) {
    pth = normalizePathFn(pth)
  }
  return require(pth)
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
  pathToRoot,
  normalizePath: normalizePathFn,
  fileExists,
  fileExtensionIs,
  readTextFile,
  fileToObject,
  readJSONFile,
  readJSFile,
}