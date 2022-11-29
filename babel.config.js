module.exports = {
  // https://babeljs.io/docs/en/options#retainlines
  retainLines: true,
  // https://babeljs.io/docs/en/options#comments
  comments: false,
  // https://babeljs.io/docs/en/options#compact
  // compact: true,
  // https://babeljs.io/docs/en/options#minified
  // minified: true,
  presets: [
    [
      // Using polyfills: No polyfills were added, since the `useBuiltIns` option was not set.
      '@babel/preset-env',
      {
        // modules: 'commonjs',
        targets: {
          // Keep this roughly in-line with our "engines.node" value in package.json
          node: '14',
        },
        exclude: [
          // Node 14+ supports this natively AND we need it to operate natively
          // so do NOT transpile it
          'proposal-dynamic-import',
        ],
      },
    ],
  ],
  plugins: [],
  ignore: [
    // Don't transpile this folder. Would normally completely leave this folder out but
    // we added the --copy-files flag:
    //    "When compiling a directory copy over non-compilable files"
    'src/javascripts/**/*.js',
  ],
}
