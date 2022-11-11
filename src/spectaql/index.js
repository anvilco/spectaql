import url from 'url'
import path from 'path'
import buildSchemas from './build-schemas'
import { augmentData } from './augmenters'
import arrangeDataDefaultFn from '../themes/default/data'
import { fileExists } from './utils'
import preProcessData from './pre-process'

async function run(opts) {
  const { logo, favicon, specData: spec, themeDir } = opts

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
  const customDataArrangerSuffixThatExists = ['data/index.js', 'data.js'].find(
    (pathSuffix) => {
      return fileExists(path.normalize(`${themeDir}/${pathSuffix}`))
    }
  )
  const arrangeDataModule = customDataArrangerSuffixThatExists
    ? await import(
        path.normalize(`${themeDir}/${customDataArrangerSuffixThatExists}`)
      )
    : arrangeDataDefaultFn
  const arrangeData = arrangeDataModule.default
    ? arrangeDataModule.default
    : arrangeDataModule

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
    logo,
    favicon,
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
