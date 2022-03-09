// This file is mainly just for cleaning up the exports to be intuitive
const { run, parseCliOptions, loadData, buildSchemas } = require('./dist')

module.exports = run
module.exports.run = run
module.exports.parseCliOptions = parseCliOptions
module.exports.loadData = loadData
module.exports.buildSchemas = buildSchemas
