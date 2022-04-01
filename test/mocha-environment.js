const path = require('path')
const appModulePath = require('app-module-path')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chai = require('chai')
const chaiExclude = require('chai-exclude')

// Allow for imports starting from the project root
appModulePath.addPath(path.join(__dirname, '..'))

chai.use(sinonChai)
chai.use(chaiExclude)

global.chai = chai
global.expect = chai.expect
global.sinon = sinon
