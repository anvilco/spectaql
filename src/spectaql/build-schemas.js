import {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
  loadIntrospectionResponseFromFile,
  loadIntrospectionResponseFromUrl,
  graphQLSchemaFromIntrospectionResponse,
} from './graphql-loaders'

import { addMetadataFromFile } from './metadata-loaders'

import {
  augmentData,
  removeTrailingPeriodsFromDescriptions,
} from './augmenters'

function errorThingDone({ trying, done }) {
  const msg = `Cannot try to ${trying} while also having ${done}`
  throw new Error(msg)
}

export function buildSchemas(opts) {
  const { specData: spec } = opts

  const {
    introspection: introspectionOptions,
    introspection: {
      url: introspectionUrl,
      schemaFile,
      introspectionFile,
      metadataFile,
      headers,
      removeTrailingPeriodFromDescriptions,
    },
  } = spec

  let done = false
  let introspectionResponse

  if (schemaFile) {
    const schema = loadSchemaFromSDLFile({ pathToFile: schemaFile })
    introspectionResponse = introspectionResponseFromSchema({ schema })
    done = 'loaded GraphQL SDL from file'
  }

  if (introspectionFile) {
    if (done) {
      errorThingDone({ trying: 'load Introspection from file', done })
    }
    introspectionResponse = loadIntrospectionResponseFromFile({
      pathToFile: introspectionFile,
    })
    done = 'loaded Introspection from file'
  }

  if (introspectionUrl) {
    if (done) {
      errorThingDone({ trying: 'load Introspection from URL', done })
    }

    let resolvedHeaders = {}
    if (headers) {
      // CLI headers come in as a string; YAML as an object.
      resolvedHeaders =
        typeof headers === 'string' ? JSON.parse(headers) : headers
    }

    introspectionResponse = loadIntrospectionResponseFromUrl({
      headers: resolvedHeaders,
      url: introspectionUrl,
    })
    done = 'loaded via Introspection URL'
  }

  if (!done) {
    throw new Error('Must provide some way to get your schema')
  }

  if (!introspectionResponse) {
    throw new Error('No Introspection Query response')
  }

  if (metadataFile) {
    addMetadataFromFile({
      ...introspectionOptions,
      pathToFile: metadataFile,
      introspectionQueryResponse: introspectionResponse,
    })
  }

  if (introspectionResponse.errors) {
    console.error(introspectionResponse.errors)
    throw new Error('Problem with Introspection Query Response')
  }

  const augmentedIntrospectionResponse = augmentData({
    introspectionResponse,
    introspectionOptions,
  })

  if (removeTrailingPeriodFromDescriptions) {
    removeTrailingPeriodsFromDescriptions(augmentedIntrospectionResponse)
  }

  const graphQLSchema = graphQLSchemaFromIntrospectionResponse(
    augmentedIntrospectionResponse
  )
  return {
    introspectionResponse: augmentedIntrospectionResponse,
    graphQLSchema,
  }
}

export default buildSchemas
