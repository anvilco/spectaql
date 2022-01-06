const {
  introspectionResponseFromSchemaSDL,
  jsonSchemaFromIntrospectionResponse,
  graphQLSchemaFromIntrospectionResponse,
} = require('app/spectaql/graphql-loaders')

const {
  addMetadata
} = require('app/spectaql/metadata-loaders')

const {
  augmentData
} = require('app/spectaql/augmenters')

const composePaths = require('app/spectaql/compose-paths')

function digQuery (queryName, paths) {
  return _dig(queryName, paths, 'Queries')
}

function digMutation (mutationName, paths) {
  return _dig(mutationName, paths, 'Mutations')
}

function _dig(name, paths, str) {
  return paths.find((path) => path.post.tags.includes(str) && path.post.summary === name)
}

function argExists (argName, query) {
  if (!query.post.parameters.find((p) => p.in === 'query' && p.name === argName)) {
    return false
  }

  let val = query.post.parameters.find((p) => p.in === 'body')
  if (!val) {
    return false
  }

  if (!val.schema.properties[argName]) {
    return false
  }

  if (!val.example.includes(`$${argName}`)) {
    return false
  }

  return true
}


describe('compose-paths', function () {
  def('schemaSDL', () => `
    type TypeOne {
      fieldOne(
        argOne: String
        argTwo: String
      ): String

      fieldTwo: String
    }

    type Query {
      queryOne(
        argOne: String
        argTwo: String
      ): String

      queryTwo: String
    }

    type Mutation {
      mutationOne(
        argOne: String
        argTwo: String
      ): String

      mutationTwo(
        argOne: String
        argTwo: String
      ): String
    }
  `)

  def('metadatasPath', 'metadata')
  def('metadata', () => ({
    'OBJECT': {
      TypeOne: {
        fields: {
          fieldOne: {
            args: {
              argTwo: {
                metadata: { undocumented: true },
              }
            }
          },
          fieldTwo: {
            metadata: { undocumented: true },
          },
        },
      },
      Query: {
        fields: {
          queryOne: {
            args: {
              argTwo: {
                metadata: { undocumented: true },
              },
            },
          },
          queryTwo: {
            metadata: { undocumented: true },
          }
        }
      },
      Mutation: {
        fields: {
          mutationOne: {
            args: {
              argTwo: {
                metadata: { undocumented: true },
              },
            },
          },
          mutationTwo: {
            metadata: { undocumented: true },
          },
        }
      },
    }
  }))

  def('doMetadata', true)

  def('typesDocumentedDefault', true)
  def('typeDocumentedDefault', true)
  def('fieldDocumentedDefault', true)
  def('argDocumentedDefault', true)
  def('hideFieldsWithUndocumentedReturnType', true)

  def('queriesDocumentedDefault', true)
  def('queryDocumentedDefault', true)
  def('queryArgDocumentedDefault', true)
  def('hideQueriesWithUndocumentedReturnType', true)

  def('mutationsDocumentedDefault', true)
  def('mutationDocumentedDefault', true)
  def('mutationArgDocumentedDefault', true)
  def('hideMutationsWithUndocumentedReturnType', true)
  def('introspectionOptions', () => ({
    metadata: $.doMetadata,
    metadatasPath: $.metadatasPath,

    typesDocumentedDefault: $.typesDocumentedDefault,
    typeDocumentedDefault: $.typeDocumentedDefault,
    fieldDocumentedDefault: $.fieldDocumentedDefault,
    argDocumentedDefault: $.argDocumentedDefault,
    hideFieldsWithUndocumentedReturnType: $.hideFieldsWithUndocumentedReturnType,

    queriesDocumentedDefault: $.queriesDocumentedDefault,
    queryDocumentedDefault: $.queryDocumentedDefault,
    queryArgDocumentedDefault: $.queryArgDocumentedDefault,
    hideQueriesWithUndocumentedReturnType: $.hideQueriesWithUndocumentedReturnType,

    mutationsDocumentedDefault: $.mutationsDocumentedDefault,
    mutationDocumentedDefault: $.mutationDocumentedDefault,
    mutationArgDocumentedDefault: $.mutationArgDocumentedDefault,
    hideMutationsWithUndocumentedReturnType: $.hideMutationsWithUndocumentedReturnType,
  }))

  def('rawIntrospectionResponse', () => introspectionResponseFromSchemaSDL({
    schemaSDL: $.schemaSDL
  }))
  def('introspectionResponse', () => addMetadata({
    introspectionQueryResponse: $.rawIntrospectionResponse,
    metadata: $.metadata,
    metadatasReadPath: $.metadatasPath,
    metadatasWritePath: $.metadatasPath,
  }))

  def('jsonSchema', () => jsonSchemaFromIntrospectionResponse($.introspectionResponse))
  def('graphQLSchema', () => graphQLSchemaFromIntrospectionResponse($.introspectionResponse))

  it('properly hides queries, mutations and arguments', function () {
    const graphQLSchema = $.graphQLSchema
    const jsonSchema = $.jsonSchema
    const introspectionResponse = $.introspectionResponse
    const introspectionOptions = $.introspectionOptions

    augmentData({
      introspectionResponse,
      jsonSchema,
      graphQLSchema,
      introspectionOptions,
    })
    const paths = composePaths({ graphQLSchema, jsonSchema })

    const query = digQuery('queryOne', paths)
    expect(query).to.be.ok
    expect(digQuery('queryTwo', paths)).to.not.be.ok

    const mutation = digMutation('mutationOne', paths)
    expect(mutation).to.be.ok
    expect(digMutation('mutationTwo', paths)).to.not.be.ok

    ;[query, mutation].forEach((thing) => {
      [
        [true, ['argOne']],
        [false, ['argTwo']],
      ].forEach(([tf, argNames]) => {
        argNames.forEach((argName) => {
          const result = argExists(argName, thing)
          expect(tf ? result : !result).to.be.true
        })
      })
    })
  })
})
