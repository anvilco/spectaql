module.exports = {
  presets: [
    [
      // Using polyfills: No polyfills were added, since the `useBuiltIns` option was not set.
      '@babel/preset-env',
      {
        targets: {
          // Keep this roughly in-line with our "engines.node" value in package.json
          node: '12',
        },
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
