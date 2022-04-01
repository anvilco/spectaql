import url from 'url'
import buildSchemas from './build-schemas'
import arrangeDataDefaultFn from '../themes/default/data'
import { fileExists, normalizePath } from './utils'
import preProcessData from './pre-process'

function run(opts) {
  const { logo, favicon, specData: spec, themeDir } = opts

  const {
    introspection: { url: introspectionUrl },
    extensions = {},
    servers = [],
    info = {},
  } = spec

  // Find the 1 marked Production. Or take the first one if there are any. Or use
  // the URL provided
  const urlToParse =
    info['x-url'] ||
    (servers.find((server) => server.production === true) || servers[0] || {})
      .url ||
    introspectionUrl

  if (!urlToParse) {
    throw new Error(
      'Please provide either: introspection.url OR servers.url OR info.x-url'
    )
  }

  const { protocol, host, pathname } = url.parse(urlToParse)

  const { introspectionResponse, graphQLSchema } = buildSchemas(opts)

  // Figure out what data arranger to use...the default one, or the one from the theme
  const customDataArrangerExists = ['data/index.js', 'data.js'].some(
    (pathSuffix) => {
      return fileExists(normalizePath(`${themeDir}/${pathSuffix}`))
    }
  )
  const arrangeDataModule = customDataArrangerExists
    ? require(normalizePath(`${themeDir}/data`))
    : arrangeDataDefaultFn
  const arrangeData = arrangeDataModule.default
    ? arrangeDataModule.default
    : arrangeDataModule

  const items = arrangeData({
    introspectionResponse,
    graphQLSchema,
  })

  // Side-effects
  preProcessData({
    items,
    introspectionResponse,
    graphQLSchema,
    extensions,
  })

  const data = {
    logo,
    favicon,
    info,
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
