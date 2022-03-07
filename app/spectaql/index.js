const url = require('url')

const buildSchemas = require('./build-schemas')
const arrangeData = require('./arrange-data')
const preProcessData = require('./pre-process')

function run (opts) {
  const {
    specData: spec,
  } = opts

  const {
    introspection: {
      url: introspectionUrl,
    },
    domains = [],
    servers = [],
    info = {},
    externalDocs,
    securityDefinitions,
  } = spec

  // Find the 1 marked Production. Or take the first one if there are any. Or use
  // the URL provided
  const urlToParse =
    info['x-swaggerUrl']
    || (servers.find((server) => server.production === true) || servers[0] || {}).url
    || introspectionUrl

  if (!urlToParse) {
    throw new Error('Please provide either: introspection.url OR servers.url OR info.x-swaggerUrl for Swagger spec compliance')
  }


  const {
    protocol,
    host,
    pathname,
  } = url.parse(urlToParse)

  const {
    introspectionResponse,
    graphQLSchema,
  } = buildSchemas(opts)

  // console.log(JSON.stringify({
  //   introspectionResponse,
  // }))

  const orderedDataWithHeaders = arrangeData({
    introspectionResponse,
    graphQLSchema,
  })

  // console.log(JSON.stringify({
  //   orderedDataWithHeaders,
  // }))

  // console.log(JSON.stringify({
  //   introspectionResponse,
  //   graphQLSchema,
  // }))

  // Side-effects
  preProcessData({ orderedDataWithHeaders, introspectionResponse, graphQLSchema })


  // console.log(JSON.stringify({
  //   orderedDataWithHeaders,
  // }))

  // generate specification
  const swaggerSpec = {
    // introspectionResponse,
    // graphQLSchema,
    openapi: '3.0.0',
    info,
    servers,
    host,
    schemes: [ protocol.slice(0, -1) ],
    basePath: pathname,
    externalDocs,
    tags: domains.map((domain) => ({
      name: domain.name,
      description: domain.description,
      externalDocs: domain.externalDocs,
    })),
    orderedDataWithHeaders,
    securityDefinitions,
  }

  return swaggerSpec
}

module.exports = run
module.exports.run = run
module.exports.buildSchemas = buildSchemas
