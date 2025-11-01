import {
  introspectionResponseFromSchemaSDL,
  graphQLSchemaFromIntrospectionResponse,
} from 'dist/spectaql/graphql-loaders'

import { introspectionOptionsToMicrofiberOptions } from 'dist'
import { addMetadata } from 'dist/spectaql/metadata-loaders'

import {
  createIntrospectionManipulator,
  hideThingsBasedOnMetadata,
  augmentData,
} from 'dist/spectaql/augmenters'

import preProcess from 'dist/spectaql/pre-process'
import arrangeDataDefaultFn from 'dist/themes/default/data'

describe('pre-process', function () {
  def(
    'schemaSDL',
    () => `
    type MyType {
      myField: String
      myOtherField: String
    }

    type Query {
      myQuery(myArg: String): MyType
      myOtherQuery: MyType
    }

    type Mutation {
      myMutation(myArg: String): MyType
      myOtherMutation: MyType
    }
  `
  )

  def('metadataBase', () => ({
    OBJECT: {
      Query: {},
      Mutation: {},
    },
  }))
  def('metadata', () => $.metadataBase)

  def('doMetadata', true)
  def('metadatasPath', 'documentation')

  def('introspectionOptionsBase', () => {
    const base = {
      metadata: $.doMetadata,
      metadatasPath: $.metadatasPath,
      queriesDocumentedDefault: true,
      queryDocumentedDefault: true,
      queryArgDocumentedDefault: true,
      hideQueriesWithUndocumentedReturnType: true,
      mutationsDocumentedDefault: true,
      mutationDocumentedDefault: true,
      mutationArgDocumentedDefault: true,
      hideMutationsWithUndocumentedReturnType: true,
      objectsDocumentedDefault: true,
      objectDocumentedDefault: true,
      fieldDocumentedDefault: true,
      argDocumentedDefault: true,
      hideFieldsOfUndocumentedType: true,
      inputsDocumentedDefault: true,
      inputDocumentedDefault: true,
      inputFieldDocumentedDefault: true,
      hideInputFieldsOfUndocumentedType: true,
      unionsDocumentedDefault: true,
      unionDocumentedDefault: true,
      enumsDocumentedDefault: true,
      enumDocumentedDefault: true,
    }
    base.microfiberOptions = introspectionOptionsToMicrofiberOptions(base)
    return base
  })
  def('introspectionOptions', () => $.introspectionOptionsBase)

  def('rawIntrospectionResponse', () =>
    introspectionResponseFromSchemaSDL({
      schemaSDL: $.schemaSDL,
    })
  )
  def('introspectionResponse', () =>
    addMetadata({
      introspectionQueryResponse: $.rawIntrospectionResponse,
      metadata: $.metadata,
      metadatasReadPath: $.metadatasPath,
      metadatasWritePath: $.metadatasPath,
    })
  )

  def('introspectionManipulator', () =>
    createIntrospectionManipulator({
      introspectionResponse: $.introspectionResponse,
      introspectionOptions: $.introspectionOptions,
    })
  )

  def('augmentedIntrospectionResponse', () => {
    const response = $.introspectionResponse
    const options = $.introspectionOptions
    return augmentData({
      introspectionResponse: response,
      introspectionOptions: options,
    })
  })

  def('graphQLSchema', () =>
    graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
  )

  def('allOptions', () => ({
    specData: {
      introspection: $.introspectionOptions,
      originalMetadata: $.originalMetadata,
    },
  }))

  def('originalMetadata', () => null)

  describe('operation examples', function () {
    // Ensure introspectionOptions is accessible in nested contexts
    def('introspectionOptions', () => $.introspectionOptionsBase)
    
    def('metadataWithExamples', () => ({
      OBJECT: {
        Query: {
          fields: {
            myQuery: {
              documentation: {
                examples: [
                  {
                    name: 'Custom query example',
                    request: {
                      query:
                        'query myQuery($myArg: String) { myQuery(myArg: $myArg) { myField } }',
                      variables: {
                        myArg: 'customValue',
                      },
                    },
                    response: {
                      data: {
                        myQuery: {
                          myField: 'result',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        Mutation: {
          fields: {
            myMutation: {
              documentation: {
                examples: [
                  {
                    name: 'Custom mutation example',
                    query:
                      'mutation myMutation($myArg: String) { myMutation(myArg: $myArg) { myField } }',
                    variables: {
                      myArg: 'mutationValue',
                    },
                    response: {
                      data: {
                        myMutation: {
                          myField: 'mutationResult',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
    }))

    def('metadata', () => $.metadataWithExamples)

    def('originalMetadata', () => $.metadataWithExamples)

    def('rawIntrospectionResponse', () =>
      introspectionResponseFromSchemaSDL({
        schemaSDL: $.schemaSDL,
      })
    )

    def('introspectionResponse', () =>
      addMetadata({
        introspectionQueryResponse: $.rawIntrospectionResponse,
        metadata: $.metadata,
        metadatasReadPath: $.metadatasPath,
        metadatasWritePath: $.metadatasPath,
      })
    )

    def('introspectionManipulator', () =>
      createIntrospectionManipulator({
        introspectionResponse: $.introspectionResponse,
        introspectionOptions: $.introspectionOptions,
      })
    )

    def('augmentedIntrospectionResponse', () => {
      const response = $.introspectionResponse
      const options = $.introspectionOptions
      return augmentData({
        introspectionResponse: response,
        introspectionOptions: options,
      })
    })

    def('graphQLSchema', () =>
      graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
    )

    def('allOptions', () => ({
      specData: {
        introspection: $.introspectionOptions,
        originalMetadata: $.originalMetadata,
      },
    }))

    def('items', () =>
      arrangeDataDefaultFn({
        introspectionResponse: $.augmentedIntrospectionResponse,
        graphQLSchema: $.graphQLSchema,
        allOptions: $.allOptions,
        introspectionOptions: $.introspectionOptions,
      })
    )

    it('uses custom query example from OBJECT format', function () {
      preProcess({
        items: $.items,
        introspectionResponse: $.augmentedIntrospectionResponse,
        graphQLSchema: $.graphQLSchema,
        extensions: {},
        queryNameStrategy: 'none',
        allOptions: $.allOptions,
      })

      const findInItems = (items) => {
        if (!Array.isArray(items)) return null
        for (const item of items) {
          if (item && item.isQuery && item.name === 'myQuery') return item
          if (item && item.items) {
            const found = findInItems(item.items)
            if (found) return found
          }
        }
        return null
      }
      const queryItem = findInItems($.items)
      expect(queryItem).to.be.ok
      expect(queryItem.query).to.equal(
        'query myQuery($myArg: String) { myQuery(myArg: $myArg) { myField } }'
      )
      expect(queryItem.variables).to.deep.equal({
        myArg: 'customValue',
      })
      expect(queryItem.response.data).to.deep.equal({
        myQuery: {
          myField: 'result',
        },
      })
      expect(queryItem.examples).to.be.an('array')
      expect(queryItem.examples.length).to.equal(1)
    })

    it('uses custom mutation example with direct format', function () {
      preProcess({
        items: $.items,
        introspectionResponse: $.augmentedIntrospectionResponse,
        graphQLSchema: $.graphQLSchema,
        extensions: {},
        queryNameStrategy: 'none',
        allOptions: $.allOptions,
      })

      const findInItems = (items) => {
        if (!Array.isArray(items)) return null
        for (const item of items) {
          if (item && item.isMutation && item.name === 'myMutation') return item
          if (item && item.items) {
            const found = findInItems(item.items)
            if (found) return found
          }
        }
        return null
      }
      const mutationItem = findInItems($.items)
      expect(mutationItem).to.be.ok
      expect(mutationItem.mutation).to.equal(
        'mutation myMutation($myArg: String) { myMutation(myArg: $myArg) { myField } }'
      )
      expect(mutationItem.variables).to.deep.equal({
        myArg: 'mutationValue',
      })
      expect(mutationItem.response.data).to.deep.equal({
        myMutation: {
          myField: 'mutationResult',
        },
      })
      expect(mutationItem.examples).to.be.an('array')
      expect(mutationItem.examples.length).to.equal(1)
    })

    context('alternative format from originalMetadata', function () {
      def('rawIntrospectionResponse', () =>
        introspectionResponseFromSchemaSDL({
          schemaSDL: $.schemaSDL,
        })
      )

      def('introspectionResponse', () =>
        addMetadata({
          introspectionQueryResponse: $.rawIntrospectionResponse,
          metadata: $.metadata,
          metadatasReadPath: $.metadatasPath,
          metadatasWritePath: $.metadatasPath,
        })
      )

      def('originalMetadata', () => ({
        queries: {
          myOtherQuery: {
            examples: [
              {
                name: 'Alternative format query',
                request: {
                  query: 'query myOtherQuery { myOtherQuery { myField } }',
                  variables: {},
                },
                response: {
                  data: {
                    myOtherQuery: {
                      myField: 'otherResult',
                    },
                  },
                },
              },
            ],
          },
        },
        mutations: {
          myOtherMutation: {
            examples: [
              {
                name: 'Alternative format mutation',
                query: 'mutation myOtherMutation { myOtherMutation { myField } }',
                variables: null,
                response: {
                  data: {
                    myOtherMutation: {
                      myField: 'otherMutationResult',
                    },
                  },
                },
              },
            ],
          },
        },
      }))

      def('introspectionManipulator', () =>
        createIntrospectionManipulator({
          introspectionResponse: $.introspectionResponse,
          introspectionOptions: $.introspectionOptions,
        })
      )

      def('augmentedIntrospectionResponse', () => {
        const response = $.introspectionResponse
        const options = $.introspectionOptions
        return augmentData({
          introspectionResponse: response,
          introspectionOptions: options,
        })
      })

      def('graphQLSchema', () =>
        graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
      )

      def('allOptions', () => ({
        specData: {
          introspection: $.introspectionOptions,
          originalMetadata: $.originalMetadata,
        },
      }))

      def('items', () =>
        arrangeDataDefaultFn({
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          allOptions: $.allOptions,
          introspectionOptions: $.introspectionOptions,
        })
      )

      it('uses custom query example from queries format', function () {
        preProcess({
          items: $.items,
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          extensions: {},
          queryNameStrategy: 'none',
          allOptions: $.allOptions,
        })

        const findInItems = (items) => {
          if (!Array.isArray(items)) return null
          for (const item of items) {
            if (item && item.isQuery && item.name === 'myOtherQuery') return item
            if (item && item.items) {
              const found = findInItems(item.items)
              if (found) return found
            }
          }
          return null
        }
        const queryItem = findInItems($.items)
        expect(queryItem).to.be.ok
        expect(queryItem.query).to.equal(
          'query myOtherQuery { myOtherQuery { myField } }'
        )
        expect(queryItem.variables).to.equal(null)
        expect(queryItem.response.data).to.deep.equal({
          myOtherQuery: {
            myField: 'otherResult',
          },
        })
      })

      it('uses custom mutation example from mutations format', function () {
        preProcess({
          items: $.items,
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          extensions: {},
          queryNameStrategy: 'none',
          allOptions: $.allOptions,
        })

        const findInItems = (items) => {
          if (!Array.isArray(items)) return null
          for (const item of items) {
            if (item && item.isMutation && item.name === 'myOtherMutation') return item
            if (item && item.items) {
              const found = findInItems(item.items)
              if (found) return found
            }
          }
          return null
        }
        const mutationItem = findInItems($.items)
        expect(mutationItem).to.be.ok
        expect(mutationItem.mutation).to.equal(
          'mutation myOtherMutation { myOtherMutation { myField } }'
        )
        expect(mutationItem.variables).to.equal(null)
        expect(mutationItem.response.data).to.deep.equal({
          myOtherMutation: {
            myField: 'otherMutationResult',
          },
        })
      })
    })

    context('missing examples', function () {
      def('metadataWithoutExamples', () => ({
        OBJECT: {
          Query: {
            fields: {
              myQuery: {
                documentation: {},
              },
            },
          },
        },
      }))

      def('metadata', () => $.metadataWithoutExamples)

      def('originalMetadata', () => $.metadataWithoutExamples)

      def('rawIntrospectionResponse', () =>
        introspectionResponseFromSchemaSDL({
          schemaSDL: $.schemaSDL,
        })
      )

      def('introspectionResponse', () =>
        addMetadata({
          introspectionQueryResponse: $.rawIntrospectionResponse,
          metadata: $.metadata,
          metadatasReadPath: $.metadatasPath,
          metadatasWritePath: $.metadatasPath,
        })
      )

      def('introspectionManipulator', () =>
        createIntrospectionManipulator({
          introspectionResponse: $.introspectionResponse,
          introspectionOptions: $.introspectionOptions,
        })
      )

      def('augmentedIntrospectionResponse', () => {
        const response = $.introspectionResponse
        const options = $.introspectionOptions
        return augmentData({
          introspectionResponse: response,
          introspectionOptions: options,
        })
      })

      def('graphQLSchema', () =>
        graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
      )

      def('allOptions', () => ({
        specData: {
          introspection: $.introspectionOptions,
          originalMetadata: $.originalMetadata,
        },
      }))

      def('items', () =>
        arrangeDataDefaultFn({
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          allOptions: $.allOptions,
          introspectionOptions: $.introspectionOptions,
        })
      )

      it('falls back to auto-generation when no custom examples', function () {
        preProcess({
          items: $.items,
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          extensions: {},
          queryNameStrategy: 'none',
          allOptions: $.allOptions,
        })

        const findInItems = (items) => {
        if (!Array.isArray(items)) return null
        for (const item of items) {
          if (item && item.isQuery && item.name === 'myQuery') return item
          if (item && item.items) {
            const found = findInItems(item.items)
            if (found) return found
          }
        }
        return null
      }
      const queryItem = findInItems($.items)
        expect(queryItem).to.be.ok
        // Should have auto-generated query (will contain myQuery)
        expect(queryItem.query).to.include('myQuery')
        expect(queryItem.query).to.include('query')
        // Should not have examples array
        expect(queryItem.examples).to.be.undefined
      })
    })

    context('missing variables in example', function () {
      def('metadataWithoutVariables', () => ({
        OBJECT: {
          Query: {
            fields: {
              myQuery: {
                documentation: {
                  examples: [
                    {
                      request: {
                        query: 'query myQuery { myQuery { myField } }',
                      },
                      response: {
                        data: {
                          myQuery: {
                            myField: 'result',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      }))

      def('metadata', () => $.metadataWithoutVariables)

      def('originalMetadata', () => $.metadataWithoutVariables)

      def('rawIntrospectionResponse', () =>
        introspectionResponseFromSchemaSDL({
          schemaSDL: $.schemaSDL,
        })
      )

      def('introspectionResponse', () =>
        addMetadata({
          introspectionQueryResponse: $.rawIntrospectionResponse,
          metadata: $.metadata,
          metadatasReadPath: $.metadatasPath,
          metadatasWritePath: $.metadatasPath,
        })
      )

      def('introspectionManipulator', () =>
        createIntrospectionManipulator({
          introspectionResponse: $.introspectionResponse,
          introspectionOptions: $.introspectionOptions,
        })
      )

      def('augmentedIntrospectionResponse', () => {
        const response = $.introspectionResponse
        const options = $.introspectionOptions
        return augmentData({
          introspectionResponse: response,
          introspectionOptions: options,
        })
      })

      def('graphQLSchema', () =>
        graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
      )

      def('allOptions', () => ({
        specData: {
          introspection: $.introspectionOptions,
          originalMetadata: $.originalMetadata,
        },
      }))

      def('items', () =>
        arrangeDataDefaultFn({
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          allOptions: $.allOptions,
          introspectionOptions: $.introspectionOptions,
        })
      )

      it('handles missing variables gracefully', function () {
        preProcess({
          items: $.items,
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          extensions: {},
          queryNameStrategy: 'none',
          allOptions: $.allOptions,
        })

        const findInItems = (items) => {
        if (!Array.isArray(items)) return null
        for (const item of items) {
          if (item && item.isQuery && item.name === 'myQuery') return item
          if (item && item.items) {
            const found = findInItems(item.items)
            if (found) return found
          }
        }
        return null
      }
      const queryItem = findInItems($.items)
        expect(queryItem).to.be.ok
        expect(queryItem.query).to.equal('query myQuery { myQuery { myField } }')
        expect(queryItem.variables).to.equal(null)
      })
    })

    context('missing response in example', function () {
      def('metadataWithoutResponse', () => ({
        OBJECT: {
          Query: {
            fields: {
              myQuery: {
                documentation: {
                  examples: [
                    {
                      request: {
                        query: 'query myQuery { myQuery { myField } }',
                        variables: {},
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      }))

      def('metadata', () => $.metadataWithoutResponse)

      def('originalMetadata', () => $.metadataWithoutResponse)

      def('rawIntrospectionResponse', () =>
        introspectionResponseFromSchemaSDL({
          schemaSDL: $.schemaSDL,
        })
      )

      def('introspectionResponse', () =>
        addMetadata({
          introspectionQueryResponse: $.rawIntrospectionResponse,
          metadata: $.metadata,
          metadatasReadPath: $.metadatasPath,
          metadatasWritePath: $.metadatasPath,
        })
      )

      def('introspectionManipulator', () =>
        createIntrospectionManipulator({
          introspectionResponse: $.introspectionResponse,
          introspectionOptions: $.introspectionOptions,
        })
      )

      def('augmentedIntrospectionResponse', () => {
        const response = $.introspectionResponse
        const options = $.introspectionOptions
        return augmentData({
          introspectionResponse: response,
          introspectionOptions: options,
        })
      })

      def('graphQLSchema', () =>
        graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
      )

      def('allOptions', () => ({
        specData: {
          introspection: $.introspectionOptions,
          originalMetadata: $.originalMetadata,
        },
      }))

      def('items', () =>
        arrangeDataDefaultFn({
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          allOptions: $.allOptions,
          introspectionOptions: $.introspectionOptions,
        })
      )

      it('handles missing response gracefully', function () {
        preProcess({
          items: $.items,
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          extensions: {},
          queryNameStrategy: 'none',
          allOptions: $.allOptions,
        })

        const findInItems = (items) => {
        if (!Array.isArray(items)) return null
        for (const item of items) {
          if (item && item.isQuery && item.name === 'myQuery') return item
          if (item && item.items) {
            const found = findInItems(item.items)
            if (found) return found
          }
        }
        return null
      }
      const queryItem = findInItems($.items)
        expect(queryItem).to.be.ok
        expect(queryItem.query).to.equal('query myQuery { myQuery { myField } }')
        expect(queryItem.response.data).to.equal(null)
      })
    })

    context('multiple examples', function () {
      def('metadataWithMultipleExamples', () => {
        return {
          OBJECT: {
            Query: {
              fields: {
                myQuery: {
                  documentation: {
                    examples: [
                      {
                        name: 'First example',
                        request: {
                          query: 'query myQuery { myQuery { myField } }',
                          variables: {},
                        },
                        response: {
                          data: { myQuery: { myField: 'first' } },
                        },
                      },
                      {
                        name: 'Second example',
                        request: {
                          query: 'query myQuery($arg: String) { myQuery(myArg: $arg) { myField } }',
                          variables: { arg: 'value' },
                        },
                        response: {
                          data: { myQuery: { myField: 'second' } },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        }
      })

      def('metadata', () => $.metadataWithMultipleExamples)

      def('originalMetadata', () => $.metadataWithMultipleExamples)

      def('rawIntrospectionResponse', () =>
        introspectionResponseFromSchemaSDL({
          schemaSDL: $.schemaSDL,
        })
      )

      def('introspectionResponse', () =>
        addMetadata({
          introspectionQueryResponse: $.rawIntrospectionResponse,
          metadata: $.metadata,
          metadatasReadPath: $.metadatasPath,
          metadatasWritePath: $.metadatasPath,
        })
      )

      def('introspectionManipulator', () =>
        createIntrospectionManipulator({
          introspectionResponse: $.introspectionResponse,
          introspectionOptions: $.introspectionOptions,
        })
      )

      def('augmentedIntrospectionResponse', () => {
        const response = $.introspectionResponse
        const options = $.introspectionOptions
        return augmentData({
          introspectionResponse: response,
          introspectionOptions: options,
        })
      })

      def('graphQLSchema', () =>
        graphQLSchemaFromIntrospectionResponse($.augmentedIntrospectionResponse)
      )

      def('allOptions', () => ({
        specData: {
          introspection: $.introspectionOptions,
          originalMetadata: $.originalMetadata,
        },
      }))

      def('items', () =>
        arrangeDataDefaultFn({
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          allOptions: $.allOptions,
          introspectionOptions: $.introspectionOptions,
        })
      )

      it('uses first example when multiple provided', function () {
        preProcess({
          items: $.items,
          introspectionResponse: $.augmentedIntrospectionResponse,
          graphQLSchema: $.graphQLSchema,
          extensions: {},
          queryNameStrategy: 'none',
          allOptions: $.allOptions,
        })

        const findInItems = (items) => {
        if (!Array.isArray(items)) return null
        for (const item of items) {
          if (item && item.isQuery && item.name === 'myQuery') return item
          if (item && item.items) {
            const found = findInItems(item.items)
            if (found) return found
          }
        }
        return null
      }
      const queryItem = findInItems($.items)
        expect(queryItem).to.be.ok
        // Should use first example
        expect(queryItem.query).to.equal('query myQuery { myQuery { myField } }')
        expect(queryItem.variables).to.equal(null)
        // Should store all examples
        expect(queryItem.examples).to.be.an('array')
        expect(queryItem.examples.length).to.equal(2)
        expect(queryItem.examples[0].name).to.equal('First example')
        expect(queryItem.examples[1].name).to.equal('Second example')
      })
    })
  })
})

