'use strict'

module.exports = {
  "extends": ["eslint:recommended"],
  "env": {
    "browser": false,
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaVersion": 2020
  },
  "rules": {
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ]
  }
}
