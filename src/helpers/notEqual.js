const equal = require('./equal')
module.exports = function (value1, value2) {
  return !equal(value1, value2)
}
