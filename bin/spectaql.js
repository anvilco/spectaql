#!/usr/bin/env node

const options = require('../dist/cli')()
const spectaql = require('../dist')

// Run the main app with parsed options
spectaql(options).catch(console.warn)
