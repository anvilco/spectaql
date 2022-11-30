/*
 * grunt-prettify
 * https://github.com/jonschlinkert/grunt-prettify
 *
 * Copyright (c) 2013 Jon Schlinkert
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    // Lint.
    jshint: {
      options: {jshintrc: '.jshintrc'},
      all: [
        'Gruntfile.js',
        'tasks/*.js'
      ]
    },

    // Build HTML for tests.
    assemble: {
      options: {
        flatten: true,
        assets: 'test/actual/assets',
        data: 'test/fixtures/data/*.{json,yml}',
        partials: 'test/fixtures/includes/*.hbs',
        layoutdir: 'test/fixtures/layouts',
        layout: 'default.hbs'
      },
      pages: {
        src: ['test/fixtures/pages/*.{hbs,md}'],
        dest: 'test/actual/ugly/'
      }
    },

    prettify: {
      options: {
        ocd: true
      },
      // Prettify a single file
      single: {
        src: 'test/actual/ugly/index.html',
        dest: 'test/actual/single/index.html'
      },
      // Use defaults
      defaults: {
        files: [
          {expand: true, cwd: 'test/actual/ugly/', src: ['*.html'], dest: 'test/actual/defaults/', ext: '.html'}
        ]
      },
      // Use .jsbeautifyrc
      jsbeautifyrc: {
        options: {
          config: '.jsbeautifyrc'
        },
        files: [
          {expand: true, cwd: 'test/actual/ugly/', src: ['*.html'], dest: 'test/actual/jsbeautifyrc/', ext: '.html'}
        ]
      },
      // Indent by 6 spaces
      custom_indentation: {
        options: {
          config: '.jsbeautifyrc'
        },
        src: 'test/actual/ugly/index.html',
        dest: 'test/actual/single/index.html'
      },
      // Use condense option to reduce extra newlines
      condense: {
        files: [
          {expand: true, cwd: 'test/actual/ugly/', src: ['*.html'], dest: 'test/actual/custom_indentation/', ext: '.html'}
        ]
      },
      // Specify a number to padcomments
      padcomments: {
        options: {
          padcomments: 3
        },
        files: [
          {expand: true, cwd: 'test/actual/ugly/', src: ['*.html'], dest: 'test/actual/padcomments/', ext: '.html'}
        ]
      }
    },

    // Before generating any new files,
    // remove files from previous build.
    clean: {
      dest: {
        src: ['test/actual/**/*.html']
      }
    }
  });

  // Actually load this plugin.
  grunt.loadTasks('tasks');

  // Load npm plugins to provide necessary tasks.
  grunt.loadNpmTasks('assemble');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-readme');

  grunt.registerTask('test', ['jshint', 'prettify']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'clean', 'assemble', 'prettify', 'readme']);
};
