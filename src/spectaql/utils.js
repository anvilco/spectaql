import path from 'path'
import fs from 'fs'

// How far is this file from the Root?
const numDirsToRoot = 2

export const pathToRoot = path.resolve(__dirname, '../'.repeat(numDirsToRoot))

function normalizePathFn(pth) {
  if (!pth.startsWith('/')) {
    pth = pathToRoot + '/' + pth
  }

  return path.resolve(pth)
}
export const normalizePath = normalizePathFn

export function fileExists(pth, { normalizePath = true } = {}) {
  if (normalizePath) {
    pth = normalizePathFn(pth)
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
    pth = normalizePathFn(pth)
  }

  return fs.readFileSync(pth, optionsForReadFileSync)
}

export function fileToObject(pathToFile, options = {}) {
  let { normalizePath = true, ...otherOptions } = options
  if (normalizePath) {
    pathToFile = normalizePathFn(pathToFile)
  }
  return path.extname(pathToFile) === '.js'
    ? readJSFile(pathToFile, otherOptions)
    : readJSONFile(pathToFile, otherOptions)
}

export function readJSONFile(pth, options = {}) {
  let { normalizePath = true, ...optionsForReadJSONParse } = options
  if (normalizePath) {
    pth = normalizePathFn(pth)
  }
  return JSON.parse(readTextFile(pth, optionsForReadJSONParse))
}

export function readJSFile(pth, { normalizePath = true } = {}) {
  if (normalizePath) {
    pth = normalizePathFn(pth)
  }
  return require(pth)
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
