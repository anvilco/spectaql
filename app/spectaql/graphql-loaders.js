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

const loadIntrospectionResponseFromUrl = ({ authHeader, url }) => {
  const requestBody = {
    operationName: "IntrospectionQuery",
    query: getIntrospectionQuery()
  };

  const responseBody = request("POST", url, {
    headers: {
      authorization: authHeader,
    },
    json: requestBody
  }).getBody('utf8')

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
