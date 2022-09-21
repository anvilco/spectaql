import path from 'path'
import _ from 'lodash'
import tmp from 'tmp'
import grunt from 'grunt'

import pkg from '../package.json'
import loadYaml from './lib/loadYaml'
import {
  normalizePathFromRoot,
  normalizePathFromCwd,
  pathToRoot,
  readTextFile,
  writeTextFile,
} from './spectaql/utils'

export {
  generateSpectaqlSdl,
  generateDirectiveSdl,
  generateOptionsSdl,
} from './spectaql/directive'

export { default as parseCliOptions } from './cli'

const defaultAppDir = normalizePathFromRoot('dist')
let spectaql = require(path.resolve(defaultAppDir, 'spectaql/index'))
let gruntConfigFn

// Ensures temporary files are cleaned up on program close, even if errors are encountered.
tmp.setGracefulCleanup()

//*********************************************************************
//
//  These possible "themeDir" values are special and get translated
//

const DEFAULT_THEM_NAME = 'default'
const defaultThemeDir = normalizePathFromRoot('dist/themes/default')

const BASIC_THEME_NAME = 'basic'
const basicThemeDir = normalizePathFromRoot('dist/themes/basic')

const SPECTAQL_THEME_NAME = 'spectaql'
const spectaqlThemeDir = normalizePathFromRoot('dist/themes/spectaql')

//
//
//*********************************************************************

const defaults = Object.freeze({
  quiet: false,
  port: 4400,
  portLive: 4401,
  targetDir: path.resolve(process.cwd(), 'public'),
  targetFile: 'index.html',
  appDir: defaultAppDir,
  gruntConfigFile: normalizePathFromRoot('dist/lib/gruntConfig.js'),
  themeDir: defaultThemeDir,
  defaultThemeDir,
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
  errorOnInterpolationReferenceNotFound: true,
  displayAllServers: false,
  resolveWithOutput: true,
})

const spectaqlDirectiveDefault = Object.freeze({
  enable: true,
  directiveName: 'spectaql',
  optionsTypeName: 'SpectaQLOption',
})

const introspectionOptionDefaults = Object.freeze({
  dynamicExamplesProcessingModule: false,

  spectaqlDirective: Object.assign({}, spectaqlDirectiveDefault),

  removeTrailingPeriodFromDescriptions: false,

  fieldExpansionDepth: 1,

  metadatasReadPath: 'documentation',
  metadatasWritePath: 'documentation',

  metadatasPath: 'documentation',
  metadatas: true,

  queriesDocumentedDefault: true,
  queryDocumentedDefault: true,
  queryArgDocumentedDefault: true,
  // TODO: support this granularly in microfiber
  hideQueriesWithUndocumentedReturnType: true,

  mutationsDocumentedDefault: true,
  mutationDocumentedDefault: true,
  mutationArgDocumentedDefault: true,
  // TODO: support this granularly in microfiber
  hideMutationsWithUndocumentedReturnType: true,

  subscriptionsDocumentedDefault: true,
  subscriptionDocumentedDefault: true,
  subscriptionArgDocumentedDefault: true,
  // TODO: support this granularly in microfiber
  hideSubscriptionsWithUndocumentedReturnType: true,

  hideUnusedTypes: true,

  objectsDocumentedDefault: true,
  objectDocumentedDefault: true,

  inputsDocumentedDefault: true,
  inputDocumentedDefault: true,

  enumsDocumentedDefault: true,
  enumDocumentedDefault: true,

  unionsDocumentedDefault: true,
  unionDocumentedDefault: true,
  hideUnionTypesOfUndocumentedType: true,

  fieldDocumentedDefault: true,
  hideFieldsOfUndocumentedType: true,

  inputFieldDocumentedDefault: true,
  hideInputFieldsOfUndocumentedType: true,

  argDocumentedDefault: true,
  hideArgsOfUndocumentedType: true,
})

const extensionsOptionDefaults = Object.freeze({
  graphqlScalarExamples: true,
})

// From CLI option name to introspection config option name
const introspectionOptionsMap = Object.freeze({
  schemaFile: 'schemaFile',
  introspectionUrl: 'url',
  introspectionFile: 'introspectionFile',
  introspectionMetadataFile: 'metadataFile',
  dynamicExamplesProcessingModule: 'dynamicExamplesProcessingModule',
  headers: 'headers',
})

// What keys should be normalized as paths?
const introspectionOptionsToNormalize = Object.values(
  introspectionOptionsMap
).filter((key) => !['url', 'headers'].includes(key))

function resolvePaths(
  options,
  keys = [
    'targetDir',
    'appDir',
    'logoFile',
    'faviconFile',
    'specFile',
    'gruntConfigFile',
    // DO NOT DO themeDir because it's not always a path...it can be a special value.
    // 'themeDir',
  ]
) {
  keys.forEach((key) => {
    const pth = options[key]
    if (typeof pth === 'string') {
      options[key] = normalizePathFromCwd(pth)
    }
  })
}

export function introspectionOptionsToMicrofiberOptions(introspectionOptions) {
  const {
    hideUnusedTypes: removeUnusedTypes,
    hideFieldsOfUndocumentedType: removeFieldsWithMissingTypes,
    hideArgsOfUndocumentedType: removeArgsWithMissingTypes,
    hideInputFieldsOfUndocumentedType: removeInputFieldsWithMissingTypes,
    hideUnionTypesOfUndocumentedType: removePossibleTypesOfMissingTypes,
    // TODO: support this granularly in microfiber
    hideQueriesWithUndocumentedReturnType: removeQueriesWithMissingTypes,
    // TODO: support this granularly in microfiber
    hideMutationsWithUndocumentedReturnType: removeMutationsWithMissingTypes,
    // TODO: support this granularly in microfiber
    hideSubscriptionsWithUndocumentedReturnType:
      removeSubscriptionsWithMissingTypes,
  } = Object.assign({}, introspectionOptionDefaults, introspectionOptions)

  return {
    removeUnusedTypes,
    removeFieldsWithMissingTypes,
    removeArgsWithMissingTypes,
    removeInputFieldsWithMissingTypes,
    removePossibleTypesOfMissingTypes,
    // TODO: support this granularly in microfiber
    removeQueriesWithMissingTypes,
    // TODO: support this granularly in microfiber
    removeMutationsWithMissingTypes,
    // TODO: support this granularly in microfiber
    removeSubscriptionsWithMissingTypes,
  }
}

export function resolveOptions(cliOptions) {
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

  if (!opts.themeDir || opts.themeDir === DEFAULT_THEM_NAME) {
    opts.themeDir = defaultThemeDir
  } else if (opts.themeDir === BASIC_THEME_NAME) {
    opts.themeDir = basicThemeDir
  } else if (opts.themeDir === SPECTAQL_THEME_NAME) {
    opts.themeDir = spectaqlThemeDir
  } else {
    opts.themeDir = normalizePathFromCwd(opts.themeDir)
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

  // Generate the microfiber options
  opts.specData.introspection.microfiberOptions =
    introspectionOptionsToMicrofiberOptions(opts.specData.introspection)

  opts.specData.introspection.spectaqlDirective = _.defaults(
    opts.specData.introspection.spectaqlDirective,
    spectaqlDirectiveDefault
  )

  opts.specData.extensions = _.defaults(
    {},
    opts.specData.extensions,
    extensionsOptionDefaults
  )

  // Resolve the introspection options paths
  resolvePaths(opts.specData.introspection, introspectionOptionsToNormalize)

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
  const pathToSpectaql = path.resolve(opts.appDir, 'spectaql/index')
  if (pathToSpectaql !== defaultAppDir) {
    spectaql = require(pathToSpectaql)
  }
  gruntConfigFn = require(opts.gruntConfigFile)

  return opts
}

/**
 * Run SpectaQL and configured tasks
 **/
export const run = function (cliOptions = {}) {
  const opts = resolveOptions(cliOptions)

  //
  //= Load the specification and init configuration

  const gruntConfig = gruntConfigFn(grunt, opts, loadData(opts))

  //
  //= Setup Grunt to do the heavy lifting

  grunt.initConfig(_.merge({ pkg }, gruntConfig))
  if (opts.quiet) {
    grunt.log.writeln = function () {}
    grunt.log.write = function () {}
    grunt.log.header = function () {}
    grunt.log.ok = function () {}
  }

  const cwd = process.cwd() // change CWD for loadNpmTasks global install
  const exists = grunt.file.exists(
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
  grunt.loadNpmTasks('@anvilco/grunt-embed')

  process.chdir(cwd)

  const pathToHtmlFile = opts.cacheDir + '/' + opts.targetFile

  grunt.registerTask(
    'predentation',
    'Remove indentation from generated <pre> tags.',
    function () {
      let html = readTextFile(pathToHtmlFile)
      html = html.replace(
        /<pre.*?><code.*?>([\s\S]*?)<\/code><\/pre>/gim,
        function (x, _y) {
          const lines = x.split('\n')
          let level = null
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
            const regex = new RegExp('^\\s{' + level + '}')
            lines.forEach(function (line, index, lines) {
              lines[index] = line.replace(regex, '')
            })
          }
          return lines.join('\n')
        }
      )
      writeTextFile(pathToHtmlFile, html)
    }
  )

  const themeCopyTasks = ['copy:default-theme-to-cache']
  // Only need to copy again if it's a custom theme
  if (opts.themeDir !== defaultThemeDir) {
    themeCopyTasks.push('copy:overlay-custom-theme-to-cache')
  }

  grunt.registerTask('copy-theme-stuff', themeCopyTasks)

  grunt.registerTask('clean-things', [
    'clean:css',
    'clean:js',
    'clean:html',
    'clean:views',
    'clean:helpers',
  ])

  const stylesheetsTasks = []
  if (!opts.disableCss) {
    stylesheetsTasks.push('sass:main', 'concat:css', 'cssmin:css')
  }
  grunt.registerTask('stylesheets', stylesheetsTasks)

  grunt.registerTask('javascripts', ['concat:js', 'uglify'])

  grunt.registerTask('templates', [
    'compile-handlebars',
    'predentation',
    'prettify',
  ])

  grunt.registerTask('default', [
    'clean-things',
    'copy-theme-stuff',
    'stylesheets',
    'javascripts',
    'templates',
  ])

  grunt.registerTask('server', ['connect'])

  grunt.registerTask('develop', ['server', 'watch'])

  // Reload template data when watch files change
  grunt.event.on('watch', function () {
    try {
      grunt.config.set(
        'compile-handlebars.compile.templateData',
        loadData(opts)
      )
    } catch (e) {
      grunt.fatal(e)
    }
  })

  // Report, etc when all tasks have completed.
  const donePromise = new Promise(function (resolve, reject) {
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

        let result
        if (opts.resolveWithOutput) {
          result = {
            html: readTextFile(pathToHtmlFile),
            // eventually?
            // css: '',
            // js: '',
          }
        }
        resolve(result)
      },
    })
  })

  // Grunt it up.

  const copiesToTarget = ['html-to-target']

  if (opts.startServer) {
    grunt.task.run('server')
  } else {
    grunt.task.run('clean-things')
    grunt.task.run('copy-theme-stuff')

    grunt.task.run('stylesheets')

    // If not oneFile/embedding JS/CSS, then we'll need to copy the files
    if (!opts.oneFile) {
      copiesToTarget.unshift('css-to-target')
    }

    if (!opts.disableJs) {
      grunt.task.run('javascripts')

      // If not oneFile/embedding JS/CSS, then we'll need to copy the files
      if (!opts.oneFile) {
        copiesToTarget.unshift('js-to-target')
      }
    }
    if (opts.logoFile) {
      copiesToTarget.unshift('logo-to-target')
    }
    if (opts.faviconFile) {
      copiesToTarget.unshift('favicon-to-target')
    }

    grunt.task.run('templates')

    // Resolve all the (local) JS and CSS requests and put them into the HTML
    // file itself
    if (opts.oneFile) {
      grunt.task.run('embed')
    }

    copiesToTarget.forEach((flavor) => {
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

export const loadData = function (options) {
  return spectaql(options)
}

export const buildSchemas = function (options) {
  const { buildSchemas } = spectaql
  return buildSchemas(options)
}

export const augmentData = function (options) {
  const { augmentData } = spectaql
  return augmentData(options)
}
