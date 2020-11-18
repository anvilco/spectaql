module.exports = {
  extends: '../.eslintrc.js',
  env: {
    mocha: true
  },
  plugins: [
    'mocha',
  ],
  rules: {
    'mocha/no-skipped-tests': 'error',
    'mocha/no-exclusive-tests': 'error',
  },
  globals: {
    expect: 'readonly',
    // *************************************************
    // bdd-lazy-var
    //
    // In order to get around eslint complaining for now:
    // https://github.com/stalniy/bdd-lazy-var/issues/56#issuecomment-639248242
    // eslint-disable-next-line id-length
    $: 'readonly',
    def: 'readonly',
    //
    // *************************************************
  }
}
