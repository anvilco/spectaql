/*
 * grunt-compile-handlebars
 * http://gruntjs.com/
 *
 * Copyright (c) 2014 Patrick Kettner, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    clean: {
      test: ['tmp']
    },

    // Configuration to be run (and then tested).
    'compile-handlebars': {
      allStatic: {
        files: [{
          src: 'test/fixtures/template.handlebars',
          dest: 'tmp/allStatic.html'
        }],
        preHTML: 'test/fixtures/pre-dev.html',
        postHTML: 'test/fixtures/post-dev.html',
        templateData: 'test/fixtures/data.json'
      },
      dynamicHandlebars: {
        files: [{
            src: '<h1></h1>',
            dest: 'tmp/dynamicHandlebars.html'
        }],
        templateData: {},
        handlebars: 'node_modules/handlebars'
      },
      jsonHandlebars: {
        files: [{
          src: 'test/fixtures/sweedishTemplate.json',
          dest: 'tmp/sweedish.json'
        }],
        templateData: 'test/fixtures/sweedishData.json'
      },
      dynamicTemplate: {
        files: [{
            src: '<h1>{{salutation}}{{punctuation}} {{location}}</h1>',
            dest: 'tmp/dynamicTemplate.html'
        }],
        template: '<h1>{{salutation}}{{punctuation}} {{location}}</h1>',
        templateData: 'test/fixtures/data.json'
      },
      dynamicTemplateData: {
        files: [{
          src: 'test/fixtures/template.handlebars',
          dest: 'tmp/dynamicTemplateData.html'
        }],
        templateData: {
          "salutation": "Hallo",
          "punctuation": ",",
          "location": "Welt"
        }
      },
      dynamicPre: {
        files: [{
          src: 'test/fixtures/template.handlebars',
          dest: 'tmp/dynamicPre.html'
        }],
        preHTML: '<header>INLINE HEADER</header>',
        templateData: 'test/fixtures/data.json'
      },
      dynamicPost: {
        files: [{
          src: 'test/fixtures/template.handlebars',
          dest: 'tmp/dynamicPost.html'
        }],
        postHTML: '<footer>INLINE FOOTER</footer>',
        templateData: 'test/fixtures/data.json'
      },
      anyArray: {
        files: [{
          src: ['test/fixtures/deep/romanian.handlebars', 'test/fixtures/deep/german.handlebars'],
          dest: ['tmp/deep/romanian.html','tmp/deep/german.html']
        }],
        templateData: ['test/fixtures/deep/romanian.json', 'test/fixtures/deep/german.json'],
        helpers: ['test/helpers/super_helper.js'],
        partials: ['test/fixtures/deep/shared/foo.handlebars']
      },
      globbedTemplateAndOutput: {
        files: [{
            expand: true,
            cwd: 'test/fixtures/',
            src: 'deep/**/*.handlebars',
            dest: 'tmp/',
            ext: '.html'
        }],
        templateData: 'test/fixtures/deep/**/*.json',
        helpers: 'test/helpers/**/*.js',
        partials: 'test/fixtures/deep/shared/**/*.handlebars'
      },
      globalJsonGlobbedTemplate: {
        files: [{
            expand: true,
            cwd: 'test/fixtures/',
            src: 'deep/**/*.handlebars',
            dest: 'tmp/',
            ext: '.html'
        }],
        templateData: 'test/fixtures/deep/**/*.json',
        helpers: 'test/helpers/**/*.js',
        partials: 'test/fixtures/deep/shared/**/*.handlebars',
        globals: [
          'test/globals/info.json',
          'test/globals/textspec.json',
          {
            textspec: {
              "ps": "P.S. from Gruntfile.js"
            }
          }
        ]
      },
      registerFullPath: {
        files: [{
            src: '<h1>{{salutation}}{{punctuation}} {{location}}</h1>{{> test/fixtures/deep/shared/pathTest}}',
            dest: 'tmp/fullPath.html'
        }],
        templateData: {
          "salutation": "Hallo",
          "punctuation": ",",
          "location": "Welt"
        },
        partials: 'test/fixtures/deep/shared/**/*.handlebars',
        registerFullPath: true
      },
      concatGlobbed: {
        files: [{
          src: 'test/fixtures/deep/**/*.handlebars',
          dest: 'tmp/concatGlobbed.html'
        }],
        templateData: 'test/fixtures/deep/**/*.json'
      },
      oneTemplateToManyOutputs: {
        files: [{
          src: 'test/fixtures/template.handlebars',
          dest: ['tmp/oneTemplateToManyOutputs1.html', 'tmp/oneTemplateToManyOutputs2.html']
        }],
        templateData: ['test/fixtures/oneTemplateToManyOutputs1.json', 'test/fixtures/oneTemplateToManyOutputs2.json']
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the 'test' task is run, first create some files to be cleaned,
  // then run this plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'compile-handlebars', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);
};
