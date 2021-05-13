const isEmpty = require('lodash/isEmpty')

const {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  graphqlSync,
} = require('graphql')

const converter = require('graphql-2-json-schema')
const request = require('sync-request')

const {
  readTextFile,
  fileToObject,
} = require('./utils')

// Get rid of the `data` envelope
function standardizeIntrospectionQueryResult (result) {
  return result.data ? result.data : result
}

const introspectionResponseFromSchemaSDL = ({ schemaSDL }) => {
  return introspectionResponseFromSchema({
    schema: buildSchema(schemaSDL),
  })
}

const introspectionResponseFromSchema = ({ schema }) => {
  return standardizeIntrospectionQueryResult(
    graphqlSync(schema, getIntrospectionQuery())
  )
}

const loadSchemaFromSDLFile = ({
  pathToFile
} = {}) => {
  return buildSchema(readTextFile(pathToFile))
}

const loadIntrospectionResponseFromFile = ({
  pathToFile,
} = {}) => {
  // Standardize it
  return standardizeIntrospectionQueryResult(fileToObject(pathToFile))
}

const loadIntrospectionResponseFromUrl = ({ headers, url }) => {
  const requestBody = {
    operationName: "IntrospectionQuery",
    query: getIntrospectionQuery()
  };

  const requestOpts = {
    json: requestBody
  }

  if (!isEmpty(headers)) {
    requestOpts.headers = headers
  }

  const responseBody = request("POST", url, requestOpts).getBody('utf8')

  // Standardize it
  return standardizeIntrospectionQueryResult(
    // Parse it
    JSON.parse(responseBody)
  )
}

const jsonSchemaFromIntrospectionResponse = (introspectionResponse) => {
  // Need to pass nullableArrayItems: true until this is the default
  return converter.fromIntrospectionQuery(introspectionResponse, { nullableArrayItems: true })
}

const graphQLSchemaFromIntrospectionResponse = (introspectionResponse) => {
  return buildClientSchema(introspectionResponse, { assumeValid: true })
}

module.exports = {
  introspectionResponseFromSchemaSDL,
  introspectionResponseFromSchema,
  loadSchemaFromSDLFile,
  loadIntrospectionResponseFromFile,
  loadIntrospectionResponseFromUrl,
  jsonSchemaFromIntrospectionResponse,
  graphQLSchemaFromIntrospectionResponse,
}
