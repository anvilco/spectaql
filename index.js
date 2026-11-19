// This file is mainly just for cleaning up the exports to be intuitive
function loadModule() {
  try {
    return require('./dist')
  } catch (error) {
    if (
      error &&
      error.code === 'MODULE_NOT_FOUND' &&
      String(error.message || '').includes("'./dist'")
    ) {
      throw new Error(
        "Cannot load SpectaQL build output (./dist). If you're running from a source checkout, run `npm run build:src` first, or install the published npm package.",
        { cause: error }
      )
    }

    throw error
  }
}

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
} = loadModule()

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
