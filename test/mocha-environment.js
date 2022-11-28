const path = require('path')
const appModulePath = require('app-module-path')
// Allow for imports starting from the project root
appModulePath.addPath(path.join(__dirname, '..'))
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chai = require('chai')
const chaiExclude = require('chai-exclude')
const chaiAsPromised = require('chai-as-promised')

chai.use(sinonChai)
chai.use(chaiExclude)
chai.use(chaiAsPromised)

global.chai = chai
global.expect = chai.expect
global.sinon = sinon
