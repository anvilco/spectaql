import path from 'path'
import sass from 'sass'

import { normalizePath } from '../spectaql/utils'

const root = path.resolve(__dirname, '../..')
const node_modules_clone = path.resolve(root, 'node_modules')
const node_modules_dependency = path.resolve(root, '..')

// Gotta keep this a commonjs export because of dynamic requiring
module.exports = function (grunt, options, spec) {
  // The basic JS paths
  const jsSrcPaths = [
    options.appDir + '/javascripts/**/*.js',
    '!' + options.appDir + '/javascripts/jquery*.js',
  ]
  // Add in the additional path if needed
  if (options.additionalJsFile) {
    jsSrcPaths.push(options.additionalJsFile)
  }

  const cssSrcPaths = [options.cacheDir + '/stylesheets/**/*.css']
  if (options.additionalCssFile) {
    cssSrcPaths.push(options.additionalCssFile)
  }

  const copyViewsTempFiles = [
    {
      expand: true,
      cwd: options.appDir,
      src: 'views/**/*.hbs',
      dest: options.cacheDir,
    },
  ]

  if (options.viewsOverlay) {
    copyViewsTempFiles.push({
      expand: true,
      cwd: normalizePath(options.viewsOverlay + '/..'),
      src: '**/*.hbs',
      dest: options.cacheDir,
    })
  }

  return {
    // Compile SCSS source files into the cache directory
    sass: {
      options: {
        implementation: sass,
        // sourceMap: true,
        includePaths: [
          // A little JANK to reach into the node_modules directory like this but
          // other option is to include in "app/vendor" folder (which had been done prior)
          path.resolve(node_modules_clone, 'foundation-sites/scss'),
          path.resolve(node_modules_dependency, 'foundation-sites/scss'),
        ],
      },
      basic: {
        files: {
          [path.resolve(options.cacheDir, 'stylesheets/basic.css')]:
            path.resolve(options.appDir, 'stylesheets/basic.scss'),
        },
      },
      full: {
        files: {
          [path.resolve(options.cacheDir, 'stylesheets/full.css')]:
            path.resolve(options.appDir, 'stylesheets/full.scss'),
        },
      },
      foundation: {
        files: {
          [path.resolve(options.cacheDir, 'stylesheets/foundation.css')]:
            path.resolve(
              options.appDir,
              'stylesheets/foundation-includes.scss'
            ),
        },
      },
    },

    // Concatenate files into 1
    concat: {
      js: {
        src: jsSrcPaths,
        dest: options.cacheDir + '/javascripts/spectaql.js',
      },
      css: {
        src: cssSrcPaths,
        dest: options.cacheDir + '/stylesheets/spectaql.css',
      },
    },

    // Minify JS
    uglify: {
      js: {
        src: options.cacheDir + '/javascripts/spectaql.js',
        dest: options.cacheDir + '/javascripts/spectaql.min.js',
      },
    },

    // Minify CSS
    cssmin: {
      css: {
        expand: true,
        cwd: options.cacheDir + '/stylesheets',
        src: ['spectaql.css'],
        dest: options.cacheDir + '/stylesheets',
        ext: '.min.css',
      },
    },

    // https://www.npmjs.com/package/grunt-compile-handlebars
    // Compile the Handlebars templates as HTML into the target directory
    // Everyting has been copied intermediately to the cache directory
    // so that custom stuff can be combined with standard stuff
    'compile-handlebars': {
      compile: {
        files: [
          {
            src:
              options.cacheDir +
              '/views/' +
              (options.embeddable ? 'embedded.hbs' : 'normal.hbs'),
            dest: options.cacheDir + '/' + options.targetFile,
          },
        ],
        templateData: spec,
        // TODO: allow helpers to be overridden/expanded, too
        helpers: options.appDir + '/helpers/*.js',
        partials: options.cacheDir + '/views/partials/**/*.hbs',
      },
    },

    // Prettify generated HTML output
    prettify: {
      options: {
        // indent: 4,
        // indent_char: ' ',
        // wrap_line_length: 500,
        // brace_style: 'end-expand',
        preserve_newlines: false,
        unformatted: ['code', 'pre'],
      },
      index: {
        src: options.cacheDir + '/' + options.targetFile,
        dest: options.cacheDir + '/' + options.targetFile,
      },
    },

    // Resolve all the JS and CSS requests to local files, and embed/inline the results rather than
    // make the multiple requests
    embed: {
      options: {
        threshold: '1024KB',
        // deleteEmbeddedFiles: true,
      },
      index: {
        src: options.cacheDir + '/' + options.targetFile,
        dest: options.cacheDir + '/' + options.targetFile,
      },
    },

    // Cleanup cache and target files
    // TODO: This only cleans up cacheDir for now. Would be better if it cleaned up target directory
    //   but that is a bit tricky/risky
    clean: {
      options: {
        force: true,
      },
      // Delete the entire temp directory used in the build process
      cache: [options.cacheDir],
      // CSS and JS from the build process
      assets: [
        options.cacheDir + '/stylesheets/**/*.css',
        options.cacheDir + '/javascripts/**/*.js',
        options.cacheDir + '/views/**/*.hbs',
      ],
      // HTML from the build process
      html: [options.cacheDir + '/**/*.html'],
      // HBS from the build process
      'views-tmp': [options.cacheDir + '/views/**/*.hbs'],
      // helpers: [options.cacheDir + '/helpers/*.js'],
      // partials: options.cacheDir + '/views/partials/**/*.hbs',
    },

    // Raise a HTTP server for previewing generated docs
    connect: {
      server: {
        options: {
          hostname: '*',
          port: options.port,
          base: options.targetDir,
          livereload: options.developmentModeLive ? options.portLive : false,
        },
      },
    },

    // https://www.npmjs.com/package/grunt-contrib-copy
    // Copy files to the target directory
    copy: {
      'views-tmp': {
        // We do an intermediate copy of the template files to the cache directory
        // so that we can combine the standard templates/files, with any custom ones
        // the user has provided.
        files: copyViewsTempFiles,
      },
      logo: {
        src: options.logoFile,
        dest: options.targetDir + '/images/' + options.logoFileTargetName,
      },
      favicon: {
        src: options.faviconFile,
        dest: options.targetDir + '/images/' + options.faviconFileTargetName,
      },
      'custom-css': {
        src: options.additionalCssFile,
        dest: options.cacheDir + '/stylesheets/custom.css',
      },
      css: {
        expand: true,
        cwd: options.cacheDir,
        src: 'stylesheets/*.min.css',
        dest: options.targetDir,
      },
      js: {
        expand: true,
        cwd: options.cacheDir,
        src: 'javascripts/*.min.js',
        dest: options.targetDir,
      },
      html: {
        src: options.cacheDir + '/' + options.targetFile,
        dest: options.targetDir + '/' + options.targetFile,
      },
    },

    // Watch the filesystem and regenerate docs if sources change
    watch: {
      options: {
        livereload: options.developmentModeLive ? options.portLive : false,
        spawn: false,
      },
      js: {
        files: [options.appDir + '/javascripts/**/*.js'],
        tasks: ['javascripts'],
      },
      css: {
        files: [options.appDir + '/stylesheets/**/*.scss'],
        tasks: ['stylesheets'],
      },
      templates: {
        files: [
          options.specFile,
          options.appDir + '/views/**/*.hbs',
          options.appDir + '/helpers/**/*.js',
          options.appDir + '/lib/**/*.js',
        ],
        tasks: ['templates'],
      },
    },
  }
}
