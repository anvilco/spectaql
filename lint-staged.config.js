// https://github.com/okonet/lint-staged#readme
// This file exports a function that is passed all the staged files, and returns
// the command(s) to be executed by lint-staged.

// This is a dependency of `lint-staged`
const micromatch = require('micromatch')

const { scripts } = require('./package.json')

module.exports = (allStagedFiles) => {
  // The globs are centrally stored in the package.json, so we grab them from there
  // and do some processing
  const globs = scripts.lint
    .split('eslint ')[1]
    .split(' ')
    .map((glob) => {
      glob = glob.replace(/"/g, '').replace(/'/g, '')
      if (glob.startsWith('**')) {
        return glob
      }
      // lint-staged will pass absolute paths, but our globs may not be prepared to
      // work with that. If this becomes an issue, there is a way to work with relative
      // paths: https://github.com/okonet/lint-staged#example-use-relative-paths-for-commands
      return `**/${glob}`
    })

  const codeFiles = micromatch(allStagedFiles, globs).join(' ')

  if (!codeFiles.length) {
    return []
  }

  return [`prettier --write ${codeFiles}`, `eslint --quiet --fix ${codeFiles}`]
}
