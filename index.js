// This file is mainly just for cleaning up the exports to be intuitive
const {
  run,
  parseCliOptions,
  resolveOptions,
  loadData,
  buildSchemas,
  augmentData,
  generateSpectaqlSdl,
  generateDirectiveSdl,
  generateOptionsSdl,
} = require('./dist')

module.exports = run
module.exports.run = run
module.exports.parseCliOptions = parseCliOptions
module.exports.resolveOptions = resolveOptions
module.exports.loadData = loadData
module.exports.buildSchemas = buildSchemas
module.exports.augmentData = augmentData
module.exports.generateSpectaqlSdl = generateSpectaqlSdl
module.exports.generateDirectiveSdl = generateDirectiveSdl
module.exports.generateOptionsSdl = generateOptionsSdl
