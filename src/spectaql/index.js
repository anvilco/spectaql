import url from 'url'
import buildSchemas from './build-schemas'
import arrangeData from './arrange-data'
import preProcessData from './pre-process'

function run(opts) {
  const { logo, favicon, specFile, specData: spec } = opts

  const {
    introspection: { url: introspectionUrl },
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

  const orderedDataWithHeaders = arrangeData({
    introspectionResponse,
    graphQLSchema,
  })

  // console.log(JSON.stringify({
  //   introspectionResponse,
  //   orderedDataWithHeaders,
  // }))

  // console.log(JSON.stringify({
  //   orderedDataWithHeaders,
  // }))

  // console.log(JSON.stringify({
  //   introspectionResponse,
  //   graphQLSchema,
  // }))

  // Side-effects
  preProcessData({
    orderedDataWithHeaders,
    introspectionResponse,
    graphQLSchema,
  })

  // console.log(JSON.stringify({
  //   orderedDataWithHeaders,
  // }))

  // generate specification
  const data = {
    // introspectionResponse,
    // graphQLSchema,
    logo,
    favicon,
    info,
    servers,
    host,
    schemes: [protocol.slice(0, -1)],
    basePath: pathname,
    orderedDataWithHeaders,
    // TODO: remove this? What does it do?
    'x-spec-path': specFile,
  }

  return data
}

// These need to be exported as CommonJS so that they can be properly dynamically required in src/index.js
module.exports = run
module.exports.run = run
module.exports.buildSchemas = buildSchemas
