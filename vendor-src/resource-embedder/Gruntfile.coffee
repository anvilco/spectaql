require 'sugar'
path = require 'path'

module.exports = (grunt) ->
  config =
    nodeunit:
      all:
        files: [[{ src: 'test/*_test.coffee' }]]
    watch:
      all:
        files: [
          'src/*.coffee'
          'test/*.coffee'
        ]
        tasks: ['nodeunit']

  # Add module-specific targets
  modules = []

  grunt.file.recurse 'src', (absPath, rootDir, subDir, fileName) ->
    if fileName.endsWith '.coffee'
      modules.push path.join(subDir || '', fileName.substring(0, fileName.length-7))

  for module in modules
    srcPath = path.join 'src', "#{module}.coffee"
    testPath = path.join 'test', "#{module}_test.coffee"
    for filePath in [srcPath, testPath]
      grunt.fail.warn "File not found: '#{filePath}'." if not grunt.file.exists filePath
    config.watch[module] =
      files: [srcPath, testPath]
      tasks: ["nodeunit:#{module}"]
    config.nodeunit[module] =
      files: [[testPath]]

  # Load and initialise
  grunt.loadNpmTasks task for task in [
    'grunt-contrib-nodeunit'
    'grunt-contrib-watch'
  ]
  grunt.initConfig config
  grunt.registerTask 'default', ['watch']
