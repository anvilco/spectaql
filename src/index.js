import fs from 'fs'
import path from 'path'
import _ from 'lodash'
import tmp from 'tmp'
import grunt from 'grunt'

import pkg from '../package.json'
import loadYaml from './lib/loadYaml'
import { normalizePath, pathToRoot } from './spectaql/utils'

export { default as parseCliOptions } from './cli'

let spectaql
let gruntConfigFn

// Ensures temporary files are cleaned up on program close, even if errors are encountered.
tmp.setGracefulCleanup()

const defaults = Object.freeze({
  quiet: false,
  port: 4400,
  portLive: 4401,
  targetDir: path.resolve(process.cwd(), 'public'),
  targetFile: 'index.html',
  appDir: normalizePath('dist'), //path.resolve(root, 'dist'),
  gruntConfigFile: normalizePath('dist/lib/gruntConfig.js'), //path.resolve(root, 'dist/lib/gruntConfig.js'),
  cacheDir: tmp.dirSync({
    unsafeCleanup: true,
    prefix: 'spectaql-',
  }).name,
  oneFile: false,
  specData: {},
})

// Things that may get set from either the CLI or the YAML.spectaql area, but if nothing
// is set, then use these:
const spectaqlOptionDefaults = Object.freeze({
  cssBuildMode: 'full',
})

const introspectionOptionDefaults = Object.freeze({
  dynamicExamplesProcessingModule: normalizePath('customizations/examples'),

  removeTrailingPeriodFromDescriptions: false,

  metadatasReadPath: 'documentation',
  metadatasWritePath: 'documentation',

  metadatasPath: 'documentation',
  metadatas: true,

  queriesDocumentedDefault: true,
  queryDocumentedDefault: true,
  queryArgDocumentedDefault: true,
  hideQueriesWithUndocumentedReturnType: true,

  mutationsDocumentedDefault: true,
  mutationDocumentedDefault: true,
  mutationArgDocumentedDefault: true,
  hideMutationsWithUndocumentedReturnType: true,

  typesDocumentedDefault: true,
  typeDocumentedDefault: true,
  fieldDocumentedDefault: true,
  argDocumentedDefault: true,
  hideFieldsWithUndocumentedReturnType: true,
})

// From CLI option name to introspection config option name
const introspectionOptionsMap = Object.freeze({
  schemaFile: 'schemaFile',
  introspectionUrl: 'url',
  introspectionFile: 'introspectionFile',
  introspectionMetadataFile: 'metadataFile',
  dynamicExamplesProcessingModule: 'dynamicExamplesProcessingModule',
  header: 'authHeader',
  headers: 'headers',
})

function resolvePaths(
  options,
  keys = [
    'targetDir',
    'appDir',
    'logoFile',
    'additionalJsFile',
    'additionalCssFile',
    'faviconFile',
    'specFile',
    'gruntConfigFile',
  ]
) {
  keys.forEach((key) => {
    const pth = options[key]
    if (typeof pth === 'string') {
      options[key] = normalizePath(pth)
    }
  })
}

function resolveOptions(cliOptions) {
  // Start with options from the CLI
  let opts = _.extend({}, cliOptions)

  resolvePaths(opts)

  const introspectionCliOptions = Object.entries(
    introspectionOptionsMap
  ).reduce((acc, [fromKey, toKey]) => {
    if (typeof opts[fromKey] !== 'undefined') {
      acc[toKey] = opts[fromKey]
    }

    return acc
  }, {})

  if (opts.specFile) {
    // Add the loaded YAML to the options
    const spec = (opts.specData = loadYaml(opts.specFile))

    const {
      spectaql: spectaqlYaml,
      // introspection: introspectionYaml,
    } = spec

    if (spectaqlYaml) {
      // Use "defaults" here to preserve whatever may have been specified in the CLI
      opts = _.defaults({}, opts, spectaqlYaml)
    }
  }

  // Add in defaults for things that were not set via CLI or YAML config
  opts = _.defaults({}, opts, defaults)

  // Resolve all the top-level paths
  resolvePaths(opts)

  // Add in some defaults here
  opts.specData.introspection = _.defaults(
    {},
    introspectionCliOptions,
    opts.specData.introspection,
    introspectionOptionDefaults
  )

  // Resolve the introspection options paths
  resolvePaths(
    opts.specData.introspection,
    Object.values(introspectionOptionsMap)
  )

  // OK, layer in any defaults that may be set by the CLI and the YAML, but may not have been:
  opts = _.defaults({}, opts, spectaqlOptionDefaults)

  if (opts.logoFile) {
    // Keep or don't keep the original logoFile name when copying to the target
    opts.logoFileTargetName = opts.preserveLogoName
      ? path.basename(opts.logoFile)
      : `logo${path.extname(opts.logoFile)}`
    opts.logo = path.basename(opts.logoFileTargetName)
  }

  if (opts.faviconFile) {
    // Keep or don't keep the original faviconFile name when copying to the target
    opts.faviconFileTargetName = opts.preserveFaviconName
      ? path.basename(opts.faviconFile)
      : `favicon${path.extname(opts.faviconFile)}`
    opts.favicon = path.basename(opts.faviconFileTargetName)
  }

  // Set the spectaql object
  spectaql = require(path.resolve(opts.appDir + '/spectaql/index'))
  gruntConfigFn = require(opts.gruntConfigFile)

  return opts
}

function _loadData(options) {
  return spectaql(options)
}

function _buildSchemas(options) {
  const { buildSchemas } = spectaql
  return buildSchemas(options)
}

/**
 * Run SpectaQL and configured tasks
 **/
export const run = function (cliOptions = {}) {
  const opts = resolveOptions(cliOptions)

  //
  //= Load the specification and init configuration

  const gruntConfig = gruntConfigFn(grunt, opts, _loadData(opts))

  //
  //= Setup Grunt to do the heavy lifting

  grunt.initConfig(_.merge({ pkg }, gruntConfig))
  if (opts.quiet) {
    grunt.log.writeln = function () {}
    grunt.log.write = function () {}
    grunt.log.header = function () {}
    grunt.log.ok = function () {}
  }

  var cwd = process.cwd() // change CWD for loadNpmTasks global install
  var exists = grunt.file.exists(
    path.join(
      path.resolve('node_modules'),
      'grunt-contrib-concat',
      'package.json'
    )
  )
  if (!exists) process.chdir(pathToRoot)

  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-cssmin')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-compile-handlebars')
  grunt.loadNpmTasks('grunt-prettify')
  grunt.loadNpmTasks('grunt-sass')
  grunt.loadNpmTasks('grunt-embed')

  process.chdir(cwd)

  grunt.registerTask(
    'predentation',
    'Remove indentation from generated <pre> tags.',
    function () {
      var html = fs.readFileSync(opts.cacheDir + '/' + opts.targetFile, 'utf8')
      html = html.replace(
        /<pre.*?><code.*?>([\s\S]*?)<\/code><\/pre>/gim,
        function (x, _y) {
          var lines = x.split('\n'),
            level = null
          if (lines) {
            // Determine the level of indentation
            lines.forEach(function (line) {
              if (line[0] === '<') return
              var wsp = line.search(/\S/)
              level =
                level === null || (wsp < line.length && wsp < level)
                  ? wsp
                  : level
            })

            // Remove indentation
            var regex = new RegExp('^\\s{' + level + '}')
            lines.forEach(function (line, index, lines) {
              lines[index] = line.replace(regex, '')
            })
          }
          return lines.join('\n')
        }
      )
      fs.writeFileSync(opts.cacheDir + '/' + opts.targetFile, html)
    }
  )

  const stylesheetsToBuild = []

  if (opts.cssBuildMode === 'full') {
    stylesheetsToBuild.push('full', 'foundation')
  } else {
    stylesheetsToBuild.push('basic')
  }

  grunt.registerTask('stylesheets', [
    ...stylesheetsToBuild.map((name) => `sass:${name}`),
    'concat:css',
    'cssmin:css',
  ])

  grunt.registerTask('javascripts', ['concat:js', 'uglify']),
    grunt.registerTask('templates', [
      'clean:html',
      'compile-handlebars',
      'predentation',
      'prettify',
    ])

  grunt.registerTask('default', ['stylesheets', 'javascripts', 'templates'])

  grunt.registerTask('server', ['connect'])

  grunt.registerTask('develop', ['server', 'watch'])

  // Reload template data when watch files change
  grunt.event.on('watch', function () {
    try {
      grunt.config.set(
        'compile-handlebars.compile.templateData',
        _loadData(opts)
      )
    } catch (e) {
      grunt.fatal(e)
    }
  })

  // Report, etc when all tasks have completed.
  var donePromise = new Promise(function (resolve, reject) {
    grunt.task.options({
      error: function (e) {
        if (!opts.quiet) {
          console.warn('Task error:', e)
        }
        // TODO: fail here or push on?
        reject(e)
      },
      done: function () {
        if (!opts.quiet) {
          console.log('All tasks complete')
        }
        resolve()
      },
    })
  })

  // Run the shiz

  const copies = ['html']

  if (opts.startServer) {
    grunt.task.run('server')
  } else {
    if (!opts.disableCss) {
      grunt.task.run('stylesheets')

      // If not oneFile/embedding JS/CSS, then we'll need to copy the files
      if (!opts.oneFile) {
        copies.unshift('css')
      }
    }
    if (!opts.disableJs) {
      grunt.task.run('javascripts')

      // If not oneFile/embedding JS/CSS, then we'll need to copy the files
      if (!opts.oneFile) {
        copies.unshift('js')
      }
    }
    if (opts.logoFile) {
      copies.unshift('logo')
    }
    if (opts.faviconFile) {
      copies.unshift('favicon')
    }

    grunt.task.run('templates')

    // Resolve all the (local) JS and CSS requests and put them into the HTML
    // file itself
    if (opts.oneFile) {
      grunt.task.run('embed')
    }

    copies.forEach((flavor) => {
      grunt.task.run(`copy:${flavor}`)
    })

    // Delete the entire cache/temp directory
    // You may want to comment out if you are debugging build process
    // grunt.task.run('clean:cache')

    // I don't know why, but if you drop into this block and run 'develop'
    // then the 'embed' task will not run...and vice versa`
    if (opts.developmentMode || opts.developmentModeLive) {
      grunt.task.run('develop')
    }
  }

  grunt.task.start()

  return donePromise
}

export const loadData = function (cliOptions = {}) {
  const opts = resolveOptions(cliOptions)
  return _loadData(opts)
}

export const buildSchemas = function (cliOptions = {}) {
  const opts = resolveOptions(cliOptions)
  return _buildSchemas(opts)
}
