import { readTextFile } from '../../../spectaql/utils'
import interpolateReferences from './interpolateReferences'

module.exports = function (path, options) {
  const text = readTextFile(path)
  if (options?.hash?.interpolateReferences) {
    return interpolateReferences(text, options)
  }
  return text
}
