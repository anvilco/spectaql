const { get } = require('bdd-lazy-var/getter')

// https://github.com/stalniy/bdd-lazy-var/issues/56#issuecomment-639248242
// eslint-disable-next-line id-length
global.$ = get
