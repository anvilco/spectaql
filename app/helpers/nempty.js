const empty = require('./empty')

module.exports = function(value) {
  return !empty(value)
};
