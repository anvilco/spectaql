const path = require('path')
const appModulePath = require('app-module-path')
console.log({ appModulePath, path: path.join(__dirname, '..') })
appModulePath.addPath(path.join(__dirname, '..'))
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chai = require('chai')
const chaiExclude = require('chai-exclude')
const chaiAsPromised = require('chai-as-promised')

// Allow for imports starting from the project root
// console.log({appModulePath, path: path.join(__dirname, '..')})
// appModulePath.addPath(path.join(__dirname, '..'))

chai.use(sinonChai)
chai.use(chaiExclude)
chai.use(chaiAsPromised)

global.chai = chai
global.expect = chai.expect
global.sinon = sinon
