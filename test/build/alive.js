const { run } = require('spectaql')

console.warn('Trying on Node ' + process.version)

if (typeof run !== 'function') {
  console.error("I didn't work.")
  process.exit(1)
}

console.log('I worked!')
process.exit()
