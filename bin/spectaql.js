#!/usr/bin/env node

const { run, parseCliOptions } = require('../index')
const cliOptions = parseCliOptions()

// Run the main app with parsed options
run(cliOptions).catch(console.warn)
