import path from 'path'
import sass from 'sass'

// Gotta keep this a commonjs export because of dynamic requiring
module.exports = function (grunt, options, spectaqlData) {
  console.log({ spectaqlData })
  // Watch them schema file(s)
  let schemaFiles = options.specData.introspection.schemaFile
  if (!schemaFiles) {
    schemaFiles = []
  } else if (Array.isArray(schemaFiles)) {
    // Copy the Array so that the addition of the specFile does not get passed to
    // the graphql schema merger
    schemaFiles = [...schemaFiles]
  } else {
    schemaFiles = [schemaFiles]
  }

  // And the spec file
  schemaFiles.push(options.specFile)

  return {
    // Compile SCSS source files into the cache directory
    sass: {
      options: {
        implementation: sass,
        // sourceMap: true,
        // includePaths: [
        //   // A little JANK to reach into the node_modules directory like this but
        //   // other option is to include in "app/vendor" folder (which had been done prior)
        //   path.resolve(node_modules_clone, 'foundation-sites/scss'),
        //   path.resolve(node_modules_dependency, 'foundation-sites/scss'),
        // ],
        functions: {
          // TODO: deprecated and undocumented. Remove in the next Major version.
          'getLogoMaxHeightPx()': () => {
            return options.logoMaxHeightPx
              ? sass.SassNumber(options.logoMaxHeightPx, 'px')
              : sass.sassFalse
          },
          'getLogoHeightPx()': () => {
            return options.logoHeightPx
              ? sass.SassNumber(options.logoHeightPx, 'px')
              : sass.sassFalse
          },
          'getScrollOffset()': () => {
            return options.scrollPaddingTopPx
              ? sass.SassNumber(options.scrollPaddingTopPx, 'px')
              : sass.sassFalse
          },
        },
      },
      main: {
        files: {
          [path.resolve(options.cacheDir, 'stylesheets/main.css')]:
            path.resolve(options.cacheDir, 'stylesheets/main.scss'),
        },
      },
    },

    // Concatenate files into 1
    concat: {
      js: {
        src: [options.cacheDir + '/javascripts/**/*.js'],
        dest: options.cacheDir + '/javascripts/spectaql.js',
      },
      css: {
        src: [
          options.cacheDir + '/stylesheets/main.css',
          options.cacheDir + '/stylesheets/**/*.css',
        ],
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
              (options.embeddable ? 'embedded.hbs' : 'main.hbs'),
            dest: options.cacheDir + '/' + options.targetFile,
          },
        ],
        templateData: spectaqlData,
        partials: options.cacheDir + '/views/partials/**/*.hbs',
        helpers: [
          // You get all the built-in helpers for free
          options.appDir + '/themes/default/helpers/**/*.js',
          // Plus any others from the theme directory. The build process may complain/warn about colliding
          // names, but it will still work as expected.
          options.themeDir + '/helpers/**/*.js',
        ],
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
    clean: {
      options: {
        force: true,
      },
      // Delete the entire temp directory used in the build process
      cache: [options.cacheDir],
      css: [options.cacheDir + '/stylesheets/**/*.css'],
      js: [options.cacheDir + '/javascripts/**/*.js'],
      html: [options.cacheDir + '/**/*.html'],
      // HBS from the build process
      views: [options.cacheDir + '/views/**/*.hbs'],
      // partials: options.cacheDir + '/views/partials/**/*.hbs',
      helpers: [options.cacheDir + '/helpers/**/*.js'],
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
      // Copy the whole default theme directory
      'default-theme-to-cache': {
        expand: true,
        cwd: options.defaultThemeDir,
        src: '*/**',
        dest: options.cacheDir,
      },
      'overlay-custom-theme-to-cache': {
        expand: true,
        cwd: options.themeDir,
        src: ['**/*', '!helpers/**/*'],
        dest: options.cacheDir,
      },
      'logo-to-target': {
        src: options.logoFile,
        dest: options.targetDir + '/images/' + options.logoFileTargetName,
      },
      'favicon-to-target': {
        src: options.faviconFile,
        dest: options.targetDir + '/images/' + options.faviconFileTargetName,
      },
      'css-to-target': {
        expand: true,
        cwd: options.cacheDir,
        src: 'stylesheets/*.min.css',
        dest: options.targetDir,
      },
      'js-to-target': {
        expand: true,
        cwd: options.cacheDir,
        src: 'javascripts/*.min.js',
        dest: options.targetDir,
      },
      'html-to-target': {
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
        files: [options.themeDir + '/javascripts/**/*.js'],
        tasks: ['javascripts'],
      },
      css: {
        files: [options.themeDir + '/stylesheets/**/*.scss'],
        tasks: ['stylesheets'],
      },
      templates: {
        files: [
          options.themeDir + '/views/**/*.hbs',
          options.themeDir + '/helpers/**/*.js',
          options.themeDir + '/lib/**/*.js',
        ],
        tasks: ['templates'],
      },
      inputs: {
        files: schemaFiles,
        tasks: ['default'],
      },
    },
  }
}
