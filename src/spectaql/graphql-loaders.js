import isEmpty from 'lodash/isEmpty'
import get from 'lodash/get'
import set from 'lodash/set'

import {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  graphqlSync,
  print,
} from 'graphql'
import { loadFilesSync } from '@graphql-tools/load-files'
import { mergeTypeDefs } from '@graphql-tools/merge'
import converter from 'graphql-2-json-schema'
import request from 'sync-request'
import {
  fileExists,
  fileExtensionIs,
  readTextFile,
  fileToObject,
} from './utils'

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

export const introspectionResponseFromSchemaSDL = ({ schemaSDL }) => {
  return introspectionResponseFromSchema({
    schema: buildSchema(schemaSDL),
  })
}

export const introspectionResponseFromSchema = ({ schema }) => {
  return standardizeIntrospectionQueryResult(
    graphqlSync(schema, getIntrospectionQuery())
  )
}

export const loadSchemaFromSDLFile = ({ pathToFile } = {}) => {
  const paths = Array.isArray(pathToFile) ? pathToFile : [pathToFile]
  const typesArray = []
  for (const path of paths) {
    if (!fileExists(path)) {
      throw new Error(`GraphQL schema file does not exist at ${path}`)
    }
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
    typesArray.push(types)
  }

  const mergedTypeDefs = mergeTypeDefs(typesArray)
  const printedTypeDefs = print(mergedTypeDefs)
  return buildSchema(printedTypeDefs)
}

export const loadIntrospectionResponseFromFile = ({ pathToFile } = {}) => {
  // Standardize it
  return standardizeIntrospectionQueryResult(fileToObject(pathToFile))
}

export const loadIntrospectionResponseFromUrl = ({ headers, url }) => {
  const requestBody = {
    operationName: 'IntrospectionQuery',
    query: getIntrospectionQuery(),
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

export const jsonSchemaFromIntrospectionResponse = (introspectionResponse) => {
  // Need to pass nullableArrayItems: true until this is the default
  return converter.fromIntrospectionQuery(introspectionResponse, {
    nullableArrayItems: true,
  })
}

export const graphQLSchemaFromIntrospectionResponse = (
  introspectionResponse
) => {
  return buildClientSchema(
    normalizeIntrospectionQueryResult(introspectionResponse),
    { assumeValid: true }
  )
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
