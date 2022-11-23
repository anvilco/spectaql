const path = require('path')
const appModulePath = require('app-module-path')
console.log({appModulePath, path: path.join(__dirname, '..')})
appModulePath.addPath(path.join(__dirname, '..'))
appModulePath.addPath(path.join(__dirname))


import('./foom.mjs').then((foomm) => {
  console.log({foomm})
})
