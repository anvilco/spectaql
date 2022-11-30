'use strict'

module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  env: {
    es2021: true,
    node: true,
    browser: false,
  },
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [],
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
  },
  ignorePatterns: [
    'vendor-src/**/*.*js',
    'src/**/javascripts/**/*.js',
    'examples/output/javascripts/**/*.js',
  ],
}
