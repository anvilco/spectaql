###
  grunt-embed
  https://github.com/callumlocke/grunt-embed

  Copyright 2013 Callum Locke
  Licensed under the MIT license.
###

module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig

    clean:
      tests: ['tmp']

    nodeunit:
      tests: ['test/*_test.coffee']

    embed:
      default_options:
        files:
          'tmp/default.html': 'test/fixtures/input.html'

      custom_options:
        options:
          threshold: '2kb'
          stylesheets: false
        files:
          'tmp/custom.html': 'test/fixtures/input.html'

    watch:
      all:
        files: [
          'tasks/*.coffee'
          'test/*.coffee'
        ]
        tasks: ['test']


  grunt.loadTasks 'tasks' # this plugin's own tasks
  grunt.loadNpmTasks task for task in [
    'grunt-contrib-clean'
    'grunt-contrib-nodeunit'
    'grunt-contrib-watch'
  ]

  grunt.registerTask 'test', ['clean', 'embed', 'nodeunit']
  grunt.registerTask 'default', ['watch']
