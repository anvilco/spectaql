#!/usr/bin/env node

const options = require('../app/cli')()
const spectaql = require('../app')

// Run the main app with parsed options
spectaql(options).catch(console.warn)
