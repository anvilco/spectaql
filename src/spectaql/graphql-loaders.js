import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import set from 'lodash/set'

import {
  buildSchema,
  buildClientSchema,
  getIntrospectionQuery,
  graphqlSync,
  print,
} from 'graphql'
import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeTypeDefs } from '@graphql-tools/merge'

import { makeExecutableSchema } from '@graphql-tools/schema'

import request from 'sync-request'
import { generateSpectaqlDirectiveSupport } from './directive'
import { fileExtensionIs, readTextFile, fileToObject } from './utils'

const GRAPHQL_LOAD_FILES_SUPPORTED_EXTENSIONS = [
  'gql',
  'graphql',
  'graphqls',
  'ts',
  'js',
]

// Get rid of the `data` envelope
function standardizeIntrospectionQueryResult(result) {
  return result.data ? result.data : result
}

export const introspectionResponseFromSchemaSDL = ({
  schemaSDL,
  getIntrospectionQueryOptions,
}) => {
  return introspectionResponseFromSchema({
    schema: buildSchema(schemaSDL),
    getIntrospectionQueryOptions,
  })
}

export const introspectionResponseFromSchema = ({
  schema,
  getIntrospectionQueryOptions,
}) => {
  return standardizeIntrospectionQueryResult(
    graphqlSync({
      schema,
      source: getIntrospectionQuery(getIntrospectionQueryOptions),
    })
  )
}

export const loadSchemaFromSDLFile = ({
  pathToFile,
  spectaqlDirectiveOptions = {},
} = {}) => {
  const paths = Array.isArray(pathToFile) ? pathToFile : [pathToFile]
  const typesArray = []
  for (const path of paths) {
    let types
    // loadFilesSync won't load .txt files, so we'll load them ourselves
    if (path.endsWith('.txt')) {
      types = [readTextFile(path)]
    } else {
      if (!fileExtensionIs(path, GRAPHQL_LOAD_FILES_SUPPORTED_EXTENSIONS)) {
        throw new Error(
          `Unsupported GraphQL schema file extension: ${path}. Supported extensions include ${GRAPHQL_LOAD_FILES_SUPPORTED_EXTENSIONS.join(
            ', '
          )}.`
        )
      }
      types = loadFilesSync(path)
    }

    if (types.length) {
      typesArray.push(types)
    } else {
      console.warn(`WARNING: No GraphqQL schema file(s) found at ${path}.`)
    }
  }
  if (!typesArray.length) {
    throw new Error(`No GraphQL schema files found in paths ${paths.join(',')}`)
  }

  const mergedTypeDefs = mergeTypeDefs(typesArray)
  const printedTypeDefs = print(mergedTypeDefs)

  let directiveName
  let directiveSdl = null
  let optionsTypeName
  let optionsSdl = null
  let transformer = (schema) => schema
  let directables = []

  if (spectaqlDirectiveOptions.enable) {
    ({
      directiveName,
      directiveSdl,
      optionsSdl,
      optionsTypeName,
      transformer,
      directables,
    } = generateSpectaqlDirectiveSupport({
      options: spectaqlDirectiveOptions,
      userSdl: printedTypeDefs,
    }))
  }

  let schema = makeExecutableSchema({
    typeDefs: [
      directiveSdl,
      optionsSdl,
      // I assume that these are processed in-order, so it's important to do the user-provided
      // SDL *after* the spectaql generated directive-related SDL so that if they've defined
      // or overridden things that will take precedence.
      printedTypeDefs,
    ],
  })

  schema = transformer(schema)

  return {
    schema,
    directables,
    directiveName,
    optionsTypeName,
  }
}

export const loadIntrospectionResponseFromFile = ({ pathToFile } = {}) => {
  // Standardize it
  return standardizeIntrospectionQueryResult(fileToObject(pathToFile))
}

export const loadIntrospectionResponseFromUrl = ({
  headers,
  url,
  getIntrospectionQueryOptions,
}) => {
  const requestBody = {
    operationName: 'IntrospectionQuery',
    query: getIntrospectionQuery(getIntrospectionQueryOptions),
  }

  const requestOpts = {
    json: requestBody,
  }

  if (!isEmpty(headers)) {
    requestOpts.headers = headers
  }

  const responseBody = request('POST', url, requestOpts).getBody('utf8')

  // Standardize it
  return standardizeIntrospectionQueryResult(
    // Parse it
    JSON.parse(responseBody)
  )
}

export const graphQLSchemaFromIntrospectionResponse = (
  introspectionResponse
) => {
  try {
    return buildClientSchema(
      normalizeIntrospectionQueryResult(introspectionResponse),
      { assumeValid: true }
    )
  } catch (err) {
    console.log('Here is your Introspection Query Response:')
    console.log(JSON.stringify(introspectionResponse))
    throw err
  }
}

// For some reason, if there's a non-standard queryType or mutationType
// they may get re-named to Query and Mutation in the introspectionResponse
// but not get re-named in the queryType or mutationType definition
const normalizeIntrospectionQueryResult = (introspectionResponse) => {
  for (const [key, defaultTypeName] of [
    ['queryType', 'Query'],
    ['mutationType', 'Mutation'],
  ]) {
    const queryOrMutationTypeName = get(
      introspectionResponse,
      `__schema.${key}.name`
    )
    if (
      queryOrMutationTypeName &&
      !findType({ introspectionResponse, typeName: queryOrMutationTypeName })
    ) {
      set(introspectionResponse, `__schema.${key}`, { name: defaultTypeName })
    }
  }

  return introspectionResponse
}

function findType({ introspectionResponse, typeName }) {
  return get(introspectionResponse, '__schema.types', []).find(
    (type) => type.kind === 'OBJECT' && type.name === typeName
  )
}
