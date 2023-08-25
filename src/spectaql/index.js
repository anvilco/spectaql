import url from 'url'
import path from 'path'
import buildSchemas from './build-schemas'
import { augmentData } from './augmenters'
import arrangeDataDefaultFn from '../themes/default/data'
import { dynamicImport, fileExists, takeDefaultExport } from './utils'
import preProcessData from './pre-process'

async function run(opts) {
  const {
    logoImageName,
    logoData,
    logoUrl,
    faviconImageName,
    faviconData,
    faviconUrl,
    specData: spec,
    themeDir,
  } = opts

  const {
    introspection: introspectionOptions,
    introspection: { url: introspectionUrl, queryNameStrategy },
    extensions = {},
    servers = [],
    info = {},
  } = spec

  const server =
    servers.find((server) => server.production === true) || servers[0]

  const headers = server?.headers
    ? server.headers
        .map((header) => {
          const { name, example, comment } = header
          if (name && example) {
            return [comment ? `# ${comment}` : '', `${name}: ${example}`]
              .filter(Boolean)
              .join('\n')
          }
        })
        .filter(Boolean)
        .join('\n')
    : false

  // Find the 1 marked Production. Or take the first one if there are any. Or use
  // the URL provided
  const urlToParse = info['x-url'] || (server || {}).url || introspectionUrl

  if (!urlToParse) {
    throw new Error(
      'Please provide either: introspection.url OR servers.url OR info.x-url'
    )
  }

  const { protocol, host, pathname } = url.parse(urlToParse)

  const { introspectionResponse, graphQLSchema } = buildSchemas(opts)

  // Figure out what data arranger to use...the default one, or the one from the theme
  const customDataArrangerSuffixThatExists = [
    'data/index.js',
    'data/index.mjs',
    'data.js',
    'data.mjs',
  ].find((pathSuffix) => {
    return fileExists(path.normalize(`${themeDir}/${pathSuffix}`))
  })

  let arrangeDataModule = arrangeDataDefaultFn
  if (customDataArrangerSuffixThatExists) {
    try {
      arrangeDataModule = await dynamicImport(
        url.pathToFileURL(
          path.normalize(`${themeDir}/${customDataArrangerSuffixThatExists}`)
        )
      )
    } catch (err) {
      console.error(err)
      if (
        err instanceof SyntaxError &&
        err.message.includes('Cannot use import statement outside a module')
      ) {
        const messages = [
          '***',
          'It appears your theme code is written in ESM but not indicated as such.',
        ]
        if (!customDataArrangerSuffixThatExists.endsWith('.mjs')) {
          messages.push(
            'You can try renaming your file with an "mjs" extension, or seting "type"="module" in your package.json'
          )
        } else {
          messages.push('Try setting "type"="module" in your package.json')
        }

        messages.push('***')
        messages.forEach((msg) => console.error(msg))
      }
      throw err
    }
  }

  const arrangeData = takeDefaultExport(arrangeDataModule)

  const items = arrangeData({
    introspectionResponse,
    graphQLSchema,
    allOptions: spec,
    introspectionOptions,
  })

  // Side-effects
  preProcessData({
    items,
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions: opts,
  })

  const data = {
    allOptions: opts,
    logoImageName,
    logoUrl,
    logoData,
    faviconImageName,
    faviconData,
    faviconUrl,
    info,
    server,
    headers,
    servers,
    host,
    url: urlToParse,
    schemes: [protocol.slice(0, -1)],
    basePath: pathname,
    items,
  }

  return data
}

// These need to be exported as CommonJS so that they can be properly dynamically required in src/index.js
module.exports = run
module.exports.run = run
module.exports.buildSchemas = buildSchemas
module.exports.augmentData = augmentData
