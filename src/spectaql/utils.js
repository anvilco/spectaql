import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import tmp from 'tmp'
import JSON5 from 'json5'

// Ensures temporary files are cleaned up on program close, even if errors are encountered.
tmp.setGracefulCleanup()

const cwd = process.cwd()

// How far is this file from the Root?
const numDirsToRoot = 2

export const pathToRoot = path.resolve(__dirname, '../'.repeat(numDirsToRoot))

export const TMP_PREFIX = 'spectaqltmp-'

export function tmpFolder(options = {}) {
  const { unsafeCleanup = true, prefix = TMP_PREFIX } = options

  return tmp.dirSync({
    unsafeCleanup,
    prefix,
  }).name
}

export function takeDefaultExport(mojule) {
  return mojule?.default ? mojule.default : mojule
}

export async function dynamicImport(path) {
  const mojule = await import(path)
  // Some babelizing oddities result in a nested export structure sometimes, so let's
  // normalize that
  if (
    mojule.__esModule === true &&
    mojule.default?.default &&
    Object.keys(mojule).length === 2
  ) {
    return mojule.default
  }
  return mojule
}

function normalizePathFn(pth, { start = cwd } = {}) {
  if (!path.isAbsolute(pth)) {
    pth = path.join(start, pth)
  }

  return path.normalize(pth)
}

export function normalizePathFromRoot(pth) {
  return normalizePathFn(pth, { start: pathToRoot })
}

export function normalizePathFromCwd(pth) {
  return normalizePathFn(pth, { start: cwd })
}

export function fileExists(pth, { normalizePath = true } = {}) {
  if (normalizePath) {
    pth = normalizePathFromCwd(pth)
  }
  return fs.existsSync(pth)
}

export function readTextFile(pth, options = {}) {
  let { normalizePath = true, ...optionsForReadFileSync } = options

  optionsForReadFileSync = {
    encoding: 'utf-8',
    ...optionsForReadFileSync,
  }
  if (normalizePath) {
    pth = normalizePathFromCwd(pth)
  }

  return fs.readFileSync(pth, optionsForReadFileSync)
}

export function writeTextFile(pth, text, _options = {}) {
  return fs.writeFileSync(pth, text)
}

export function fileToObject(pathToFile, options = {}) {
  let { normalizePath = true, ...otherOptions } = options
  if (normalizePath) {
    pathToFile = normalizePathFromCwd(pathToFile)
  }
  return path.extname(pathToFile) === '.js'
    ? readJSFile(pathToFile, otherOptions)
    : readJSONFile(pathToFile, otherOptions)
}

export function readJSONFile(pth, options = {}) {
  let { normalizePath = true, ...optionsForReadJSONParse } = options
  if (normalizePath) {
    pth = normalizePathFromCwd(pth)
  }
  return JSON5.parse(readTextFile(pth, optionsForReadJSONParse))
}

export function readJSFile(pth, { normalizePath = true } = {}) {
  if (normalizePath) {
    pth = normalizePathFromCwd(pth)
  }
  return require(pth)
}

export function readFileAsBase64(pth, { normalizePath } = {}) {
  if (normalizePath) {
    pth = normalizePathFromCwd(pth)
  }
  return Buffer.from(fs.readFileSync(pth)).toString('base64')
}

export function fileExtensionIs(fileNameOrPath, extensionOrExtensions) {
  if (typeof fileNameOrPath !== 'string') {
    return false
  }
  const ext = fileNameOrPath.split('.').pop()
  if (!Array.isArray(extensionOrExtensions)) {
    extensionOrExtensions = [extensionOrExtensions]
  }

  return extensionOrExtensions.some((supportExt) => supportExt === ext)
}

/**
 * Utilities for managing both URL and file paths.
 */

/**
 * Determines if the given string is an absolute URL.
 * @param {string} str the string to check.
 * @return {boolean} `true` if the string is a URL.
 */
export function absoluteURL(str) {
  // return /^.*\:\/\/[^\/]+\/?/.test(str)
  return /^.*:\/\/[^/]+\/?/.test(str)
}

/**
 * Returns the base-part of a URL - returns `"http://example.com/"` when given `"http://example.com/test/"`.
 * @param {string} url an absolute URL to split
 * @return {string} the base-part of the given URL
 */
export function urlBasename(url) {
  // return /^(.*\:\/\/[^\/]+\/?)/.exec(url)[1];
  return /^(.*:\/\/[^/]+\/?)/.exec(url)[1]
}

/**
 * `path.join()` that works with either file paths or URLs.
 * @param {...string} paths Paths to join, left to right
 * @return {string} the joined path.
 */
export function join(..._paths) {
  const args = [].concat.apply([], arguments)
  return args.slice(1).reduce(function (url, val) {
    if (absoluteURL(url) || absoluteURL(val)) {
      return require('url').resolve(url, val)
    }
    return path.posix.join(url, val)
  }, args[0])
}

/**
 * `path.relative` that works with either file paths or URLs.
 * @param {string} from the origin path
 * @param {string} to the destination path
 * @return {string} A relative path from the origin to the destination.
 */
export function relative(from, to) {
  var localToRemote = !absoluteURL(from) && absoluteURL(to)
  var differentDomains =
    absoluteURL(from) &&
    absoluteURL(to) &&
    urlBasename(from) !== urlBasename(to)
  if (localToRemote || differentDomains) {
    return to
  }
  return path.posix.relative(from, to)
}

export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function capitalize(string) {
  return _.capitalize(string)
}

export function camelCase(string) {
  return _.camelCase(string)
}

export function snakeCase(string) {
  return _.snakeCase(string)
}

export function upperCase(string) {
  return string.toUpperCase()
}

export function lowerCase(string) {
  return string.toLowerCase()
}

export function isUndef(thing) {
  return typeof thing === 'undefined'
}

export function firstNonUndef(array) {
  if (!Array.isArray(array)) {
    return
  }
  return array.find((item) => !isUndef(item))
}
