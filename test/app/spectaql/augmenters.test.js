const _ = require('lodash')

const IntrospectionManipulator = require('app/lib/Introspection')

const {
  introspectionResponseFromSchemaSDL,
  jsonSchemaFromIntrospectionResponse,
  graphQLSchemaFromIntrospectionResponse,
} = require('app/spectaql/graphql-loaders')

const {
  addMetadata
} = require('app/spectaql/metadata-loaders')

const {
  addSpecialTags,
} = require('app/lib/common')

const {
  hideThingsBasedOnMetadata,
  addExamplesFromMetadata,
  addExamplesDynamically,
} = require('app/spectaql/augmenters')

describe.only('augmenters', function () {
  def('schemaSDLBase', () => `
    type MyType {
      myField(
        myArg: String
        myOtherArg: String
      ): String
      myOtherField: OtherType
    }

    type OtherType {
      myField: MyType
      myOtherField: String
      requiredArrayOfNonNullables: [String!]!
      requiredArrayOfNullables: [String]!
      nonRequiredArrayOfNonNullables: [String!]
      nonRequiredArrayOfNullables: [String]
    }

    "Some combined types"
    union CombinedTypes =
      | MyType
      | OtherType

    type Query {
      myQuery(
        myArg: String
        myOtherArg: String
      ): String

      myOtherQuery: MyType
    }

    type Mutation {
      myMutation(
        myArg: String
        myOtherArg: String
      ): String

      myOtherMutation: MyType
    }

    input MyInput {
      inputOne: String
      inputTwo: Int
    }
  `
  )
  def('schemaSDL', () => $.schemaSDLBase)

  def('metadataBase', () => ({
    'OBJECT': {
      MyType: {

      },
      OtherType: {

      },
      Query: {

      },
      Mutation: {

      }
    },
    'INPUT_OBJECT': {
      MyInput: {

      },
    }
  }))
  def('metadata', () => $.metadataBase)

  def('doMetadata', true)
  def('metadatasPath', 'metadata')

  def('typesDocumented', true)
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

  def('introspectionOptionsBase', () => ({
    metadata: $.doMetadata,
    metadatasPath: $.metadatasPath,

    typesDocumented: $.typesDocumented,
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
  def('introspectionOptions', () => $.introspectionOptionsBase)


  def('rawIntrospectionResponse', () => introspectionResponseFromSchemaSDL({
    schemaSDL: $.schemaSDL
  }))
  def('introspectionResponse', () => addMetadata({
    introspectionQueryResponse: $.rawIntrospectionResponse,
    metadata: $.metadata,
    metadatasReadPath: $.metadatasPath,
    metadatasWritePath: $.metadatasPath,
  }))

  def('introspectionManipulator', () => new IntrospectionManipulator($.introspectionResponse, $.introspectionManipulatorOptions))

  def('graphQLSchema', () => graphQLSchemaFromIntrospectionResponse($.introspectionResponse))

  describe('hideThingsBasedOnMetadata', function () {
    def('result', () => hideThingsBasedOnMetadata({
        introspectionManipulator: $.introspectionManipulator,
        introspectionOptions: $.introspectionOptions,
    }))

    def('response', () => $.result.introspectionManipulator.getResponse())

    it('shows everything when nothing was told to be hidden', function () {
      const responseBefore = _.cloneDeep($.introspectionResponse)
      const response = $.response
      expect(response).to.eql(responseBefore)
    })

    describe.only('Types', function () {
      it('shows at least some things by default', function () {
        expect($.introspectionManipulator.getType({ name: 'MyType' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'MyType', fieldName: 'myField' })).to.be.ok
        expect($.introspectionManipulator.getArg({ typeName: 'MyType', fieldName: 'myField', argName: 'myArg' })).to.be.ok
      })

      context('typesDocumented is false', function () {
        def('typesDocumented', false)

        it('does not show any types', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)
          expect(response.__schema.types).to.eql([])
          expect($.introspectionManipulator.getType({ name: 'MyType' })).to.not.be.ok
        })

        context('metadata says MyType should be documented', function () {
          def('metadata', () => {
            return _.set($.metadataBase, 'OBJECT.MyType.documentation', { documented: true })
          })

          it('still does not show any types', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)
            expect(response.__schema.types).to.eql([])
            expect($.introspectionManipulator.getType({ name: 'MyType' })).to.not.be.ok
          })
        })
      })

      context('typeDocumentedDefault is false', function () {
        def('typeDocumentedDefault', false)

        it('does not show any types', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)

          expect(response.__schema.types).to.eql([])
          expect($.introspectionManipulator.getType({ name: 'MyType' })).to.not.be.ok
        })

        context('metadata directive says MyType should be documented', function () {
          def('metadata', () => {
            return _.set($.metadataBase, `OBJECT.MyType.${$.metadatasPath}`, { documented: true })
          })

          it.only('only documents MyType', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect(response.__schema.types).to.be.an('array').of.length(1)
            expect($.introspectionManipulator.getType({ name: 'MyType' })).to.be.ok
          })
        })
      })

      describe('undocumented metadata directive', function () {
        context('metadata directive says MyType should NOT be documented', function () {
          def('metadata', () => {
            return _.set($.metadataBase, `OBJECT.MyType.${$.metadatasPath}`, { undocumented: true })
          })

          it('does not document MyType', function () {
            const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
            const { jsonSchema } = $.result
            expect(jsonSchemaBefore).to.not.eql(jsonSchema)

            expect(jsonSchema.definitions).to.be.an('object').that.does.not.have.any.keys('MyType')
          })

          // Removal of Types fields, Mutations and Queries that have a return type that is not
          // documented.

          it('removes some Type Fields, Queries and Mutations due to MyType not existing', function () {
            const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
            const { jsonSchema } = $.result
            expect(jsonSchemaBefore).to.not.eql(jsonSchema)

            // myField is gone b/c it was MyType
            expect(jsonSchema.definitions.OtherType.properties).to.be.an('object').that.has.all.keys(
              'myOtherField',
              'nonRequiredArrayOfNonNullables',
              'nonRequiredArrayOfNullables',
              'requiredArrayOfNonNullables',
              'requiredArrayOfNullables',
            )
            // myOtherQuery is gone b/c its return type was MyType
            expect(jsonSchema.properties.Query.properties).to.be.an('object').that.has.all.keys('myQuery')
            // myOtherMutation is gone b/c its return type was MyType
            expect(jsonSchema.properties.Mutation.properties).to.be.an('object').that.has.all.keys('myMutation')
          })
        })
      })
    })

    describe('Fields', function () {
      it('shows at least some things by default', function () {
        const { jsonSchema } = $.result
        expect(jsonSchema.definitions.MyType.properties).to.be.an('object').that.has.all.keys('myField', 'myOtherField')
        expect(jsonSchema.definitions.OtherType.properties).to.be.an('object').that.has.all.keys(
          'myField',
          'myOtherField',
          'nonRequiredArrayOfNonNullables',
          'nonRequiredArrayOfNullables',
          'requiredArrayOfNonNullables',
          'requiredArrayOfNullables',
        )
        // Make sure it does not mess up Query or Mutation
        expect(jsonSchema.properties.Query.properties).to.not.be.empty
        expect(jsonSchema.properties.Mutation.properties).to.not.be.empty
      })

      context('fieldDocumentedDefault is false', function () {
        def('fieldDocumentedDefault', false)

        it('does not show any fields', function () {
          const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
          const { jsonSchema } = $.result
          expect(jsonSchemaBefore).to.not.eql(jsonSchema)

          expect(jsonSchema.definitions.MyType.properties).to.eql({})

          // Make sure it does not mess up Query or Mutation
          expect(jsonSchema.properties.Query.properties).to.not.be.empty
          expect(jsonSchema.properties.Mutation.properties).to.not.be.empty
        })

        context('metadata directive says MyType should be documented', function () {
          def('metadata', () => {
            return _.set($.metadataBase, `OBJECT.MyType.fields.myField.${$.metadatasPath}`, { documented: true })
          })

          it('only documents myField', function () {
            const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
            const { jsonSchema } = $.result
            expect(jsonSchemaBefore).to.not.eql(jsonSchema)

            // Chai says this means only the provided keys, and no more.
            expect(jsonSchema.definitions.MyType.properties).to.be.an('object').that.has.all.keys('myField')
          })
        })
      })
    })

    describe('Queries and Mutations', function () {
      it('shows at least some things by default', function () {
        const { jsonSchema } = $.result
        expect(jsonSchema.properties.Query.properties).to.be.an('object').that.has.all.keys('myQuery', 'myOtherQuery')
        expect(jsonSchema.properties.Mutation.properties).to.be.an('object').that.has.all.keys('myMutation', 'myOtherMutation')
        // Make sure it does not mess up Types
        expect(jsonSchema.definitions.MyType.properties).to.not.be.empty
      })

      // Tests for top-level "should we document this at all" options
      ;[
        ['queriesDocumentedDefault', 'Query', 'Mutation' ],
        ['mutationsDocumentedDefault', 'Mutation', 'Query'],
      ].forEach(([option, thing, otherThing]) => {
        context(`${option} is false`, function () {
          def(option, false)

          it(`does not show any ${thing}s`, function () {
            const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
            const { jsonSchema } = $.result
            expect(jsonSchemaBefore).to.not.eql(jsonSchema)

            // Only the other type of thing should be left
            expect(jsonSchema.properties).to.be.an('object').that.has.all.keys(otherThing)
            // Make sure it does not mess up Types
            expect(jsonSchema.definitions).to.not.be.empty
          })
        })
      })


      // Tests for 1-by-1 undocumentedness
      ;[
        ['queryDocumentedDefault', 'Query', 'Mutation', 'myOtherQuery'],
        ['mutationDocumentedDefault', 'Mutation', 'Query', 'myOtherMutation'],
      ].forEach(([option, thing, otherThing, exceptionName]) => {
        context(`${option} is false`, function () {
          def(option, false)

          it(`does not show any ${thing}s`, function () {
            const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
            const { jsonSchema } = $.result
            expect(jsonSchemaBefore).to.not.eql(jsonSchema)

            // Both things should be there
            expect(jsonSchema.properties).to.be.an('object').that.has.all.keys(thing, otherThing)
            // But only 1 should have any properties
            expect(jsonSchema.properties[thing].properties).to.be.an('object').that.is.empty
            expect(jsonSchema.properties[otherThing].properties).to.be.an('object').that.is.not.empty

            // Make sure it does not mess up Types
            expect(jsonSchema.definitions).to.not.be.empty
          })

          context(`metadata directive says ${exceptionName} should be documented`, function () {
            def('metadata', () => {
              return _.set($.metadataBase, `OBJECT.${thing}.fields.${exceptionName}.${$.metadatasPath}`, { documented: true })
            })

            it(`only documents ${exceptionName}`, function () {
              const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
              const { jsonSchema } = $.result
              expect(jsonSchemaBefore).to.not.eql(jsonSchema)

              // Chai says this means only the provided keys, and no more.
              expect(jsonSchema.properties[thing].properties).to.be.an('object').that.has.all.keys(exceptionName)
              // Makes sure other thing is OK
              expect(jsonSchema.properties[otherThing].properties).to.be.an('object').that.is.not.empty
              // Make sure Types are OK
              expect(jsonSchema.definitions).to.not.be.empty
            })
          })
        })
      })
    })

    // Same code for Types and [Queries / Mutations]?
    describe('Arguments', function () {
      it('shows at least some things by default', function () {
        const { jsonSchema } = $.result
        ;[
          jsonSchema.properties.Query.properties.myQuery.properties.arguments.properties,
          jsonSchema.properties.Mutation.properties.myMutation.properties.arguments.properties,
          jsonSchema.definitions.MyType.properties.myField.properties.arguments.properties
        ].forEach((thing) => {
          expect(thing).to.be.an('object').that.has.all.keys('myArg', 'myOtherArg')
        })
      })

      ;[
        [
          'argDocumentedDefault',
          'Types',
          'definitions.MyType.properties.myField.properties.arguments.properties',
          [
            'properties.Query.properties.myQuery.properties.arguments.properties',
            'properties.Mutation.properties.myMutation.properties.arguments.properties',
          ],
        ],
        [
          'queryArgDocumentedDefault',
          'Queries',
          'properties.Query.properties.myQuery.properties.arguments.properties',
          [
            'definitions.MyType.properties.myField.properties.arguments.properties',
            'properties.Mutation.properties.myMutation.properties.arguments.properties',
          ],
        ],
        [
          'mutationArgDocumentedDefault',
          'Mutations',
          'properties.Mutation.properties.myMutation.properties.arguments.properties',
          [
            'definitions.MyType.properties.myField.properties.arguments.properties',
            'properties.Query.properties.myQuery.properties.arguments.properties',
          ],
        ],
      ].forEach(([option, name, affected, notAffecteds]) => {
        context(`${option} is false`, function () {
          def(option, false)

          it(`does not show any ${name}`, function () {
            const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
            const { jsonSchema } = $.result
            expect(jsonSchemaBefore).to.not.eql(jsonSchema)

            // Affected thing should be empty of arguments
            expect(
              _.get(jsonSchema, affected)
            ).to.be.an('object').that.is.empty

            // Unaffecteds should still have all their arguments
            notAffecteds.forEach((path) => {
              const thing = _.get(jsonSchema, path)
              expect(thing).to.be.an('object').that.has.all.keys('myArg', 'myOtherArg')
            })
          })

          context(`metadata directive says myOtherArg should be documented`, function () {
            // Split something like definitions.MyType.properties.myField.properties.arguments.properties
            const splitskies = affected.split('.')
            const typeName = splitskies[1]
            const fieldName = splitskies[3]
            const exceptionName = 'myOtherArg'

            def('metadata', () => {
              return _.set($.metadataBase, `OBJECT.${typeName}.fields.${fieldName}.args.${exceptionName}.${$.metadatasPath}`, { documented: true })
            })

            it(`only documents ${exceptionName}`, function () {
              const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
              const { jsonSchema } = $.result
              expect(jsonSchemaBefore).to.not.eql(jsonSchema)

              // Affected thing should have just the exceptional argument
              expect(
                _.get(jsonSchema, affected)
              ).to.be.an('object').that.has.all.keys('myOtherArg')

              // Unaffecteds should still have all their arguments
              notAffecteds.forEach((path) => {
                const thing = _.get(jsonSchema, path)
                expect(thing).to.be.an('object').that.has.all.keys('myArg', 'myOtherArg')
              })
            })
          })
        })
      })
    })

    // TODO: Properly support INPUT_TYPEs, and then test those things
    it('removes arguments whose input types have been hidden')
  })

  describe('addExamplesFromMetadata', function () {
    def('metadataBase', () => ({
      'OBJECT': {
        MyType: {
          // Should have no impact, example-wise
          metadata: $.theMetadata,
          fields: {
            myField: {
              metadata: $.theMetadata,
              args: {
                myArg: {
                  metadata: $.theMetadata,
                }
              }
            }
          }
        },
        Query: {
          // Should have no impact, example-wise
          metadata: $.theMetadata,
          fields: {
            myQuery: {
              metadata: $.theMetadata,
              args: {
                myArg: {
                  metadata: $.theMetadata,
                }
              }
            }
          }
        },
        Mutation: {
          // Should have no impact, example-wise
          metadata: $.theMetadata,
          fields: {
            myMutation: {
              metadata: $.theMetadata,
              args: {
                myArg: {
                  metadata: $.theMetadata,
                }
              }
            }
          }
        }
      },
      'INPUT_OBJECT': {
        MyInput: {
          // Should have no impact, example-wise
          metadata: $.theMetadata,
          inputFields: {
            inputOne: {
              metadata: $.theMetadata,
            },
            inputTwo: {
              metadata: $.theMetadata,
            },
          },
        },
      }
    }))

    def('metadata', () => $.metadataBase)

    def('result', () => {
      return addExamplesFromMetadata(
        // Need to call hideThingsBasedOnMetadata so that metadata gets copied
        hideThingsBasedOnMetadata({
          introspectionResponse: $.introspectionResponse,
          jsonSchema: $.jsonSchema,
          graphQLSchema: $.graphQLSchema,
          introspectionOptions: $.introspectionOptions,
        })
      )
    })

    context('example in metadata', function () {
      def('example', "fooey")
      def('processedExample', () => addSpecialTags($.example, { placeholdQuotes: true }))
      def('theMetadata', () => ({ example: $.example }))

      it('adds example to JSON Schema', function () {
        const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
        const { jsonSchema } = $.result
        expect(jsonSchemaBefore).to.not.eql(jsonSchema)

        // No top-level example
        expect(jsonSchema.definitions.MyType).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.definitions.MyInput).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.properties.Query).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.properties.Mutation).be.an('object').that.does.not.have.any.keys('example')

        // Type Fields have example...
        expect(jsonSchema.definitions.MyType.properties.myField.properties.return.example).to.eql($.processedExample)
        // Input Fields have example...
        expect(jsonSchema.definitions.MyInput.properties.inputOne.example).to.eql($.processedExample)
        // ...queries and mutations DO NOT
        expect(jsonSchema.properties.Query.properties.myQuery).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.properties.Mutation.properties.myMutation).be.an('object').that.does.not.have.any.keys('example')

        // Arguments on all things have example
        expect(jsonSchema.definitions.MyType.properties.myField.properties.arguments.properties.myArg.example).to.eql($.processedExample)
        expect(jsonSchema.properties.Query.properties.myQuery.properties.arguments.properties.myArg.example).to.eql($.processedExample)
        expect(jsonSchema.properties.Mutation.properties.myMutation.properties.arguments.properties.myArg.example).to.eql($.processedExample)
      })

      context('examples *also* in metadata', function () {
        // Yes, weird that this is a scalar/single value and not an array
        def('examples', "barrey")
        def('processedExample', () => addSpecialTags($.examples, { placeholdQuotes: true }))
        def('theMetadata', () => ({
          example: $.example,
          examples: [$.examples]
        }))

        it('adds one of the examples to JSON Schema', function () {
          const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
          const { jsonSchema } = $.result
          expect(jsonSchemaBefore).to.not.eql(jsonSchema)

          // No top-level example
          expect(jsonSchema.definitions.MyType).be.an('object').that.does.not.have.any.keys('example')
          expect(jsonSchema.definitions.MyInput).be.an('object').that.does.not.have.any.keys('example')
          expect(jsonSchema.properties.Query).be.an('object').that.does.not.have.any.keys('example')
          expect(jsonSchema.properties.Mutation).be.an('object').that.does.not.have.any.keys('example')

          // Type Fields have example...
          expect(jsonSchema.definitions.MyType.properties.myField.properties.return.example).to.eql($.processedExample)
          // Input Fields have example...
          expect(jsonSchema.definitions.MyInput.properties.inputOne.example).to.eql($.processedExample)
          // ...queries and mutations DO NOT
          expect(jsonSchema.properties.Query.properties.myQuery).be.an('object').that.does.not.have.any.keys('example')
          expect(jsonSchema.properties.Mutation.properties.myMutation).be.an('object').that.does.not.have.any.keys('example')

          // Arguments on all things have example
          expect(jsonSchema.definitions.MyType.properties.myField.properties.arguments.properties.myArg.example).to.eql($.processedExample)
          expect(jsonSchema.properties.Query.properties.myQuery.properties.arguments.properties.myArg.example).to.eql($.processedExample)
          expect(jsonSchema.properties.Mutation.properties.myMutation.properties.arguments.properties.myArg.example).to.eql($.processedExample)
        })
      })
    })

    context('examples in metadata', function () {
      // Yes, weird that this is a scalar/single value and not an array
      def('examples', "barrey")
      def('processedExample', () => addSpecialTags($.examples, { placeholdQuotes: true }))
      def('theMetadata', () => ({ examples: [$.examples] }))

      it('adds one of the examples to JSON Schema', function () {
        const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
        const { jsonSchema } = $.result
        expect(jsonSchemaBefore).to.not.eql(jsonSchema)

        // No top-level example
        expect(jsonSchema.definitions.MyType).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.definitions.MyInput).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.properties.Query).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.properties.Mutation).be.an('object').that.does.not.have.any.keys('example')

        // Type Fields have example...
        expect(jsonSchema.definitions.MyType.properties.myField.properties.return.example).to.eql($.processedExample)
        // Input Fields have example...
        expect(jsonSchema.definitions.MyInput.properties.inputOne.example).to.eql($.processedExample)
        // ...queries and mutations DO NOT
        expect(jsonSchema.properties.Query.properties.myQuery).be.an('object').that.does.not.have.any.keys('example')
        expect(jsonSchema.properties.Mutation.properties.myMutation).be.an('object').that.does.not.have.any.keys('example')

        // Arguments on all things have example
        expect(jsonSchema.definitions.MyType.properties.myField.properties.arguments.properties.myArg.example).to.eql($.processedExample)
        expect(jsonSchema.properties.Query.properties.myQuery.properties.arguments.properties.myArg.example).to.eql($.processedExample)
        expect(jsonSchema.properties.Mutation.properties.myMutation.properties.arguments.properties.myArg.example).to.eql($.processedExample)
      })
    })
  })

  describe('addExamplesDynamically', function () {
    def('schemaSDL', () => `
      ${$.schemaSDLBase}

      type YetAnotherType {
        fieldWithExample(
          argWithExample: String,
          argWithoutExample: String,
        ): String

        fieldWithoutExample(
          argWithExample: Boolean,
          argWithoutExample: String,
        ): String
      }

      input AnotherInput {
        inputOne: Int,
        inputTwo: [Int],
        inputThree: Int!,
        inputFour: [Int!]
        inputFive: [Int!]!
      }
    `)

    // This from-the-root path works due to appModulePath in testing setup
    def('dynamicExamplesProcessingModule', 'test/fixtures/examplesProcessor')
    def('introspectionOptions', () => ({
      ...$.introspectionOptionsBase,
      dynamicExamplesProcessingModule: $.dynamicExamplesProcessingModule,
    }))
    def('result', () => {
      return addExamplesDynamically({
        introspectionResponse: $.introspectionResponse,
        jsonSchema: $.jsonSchema,
        graphQLSchema: $.graphQLSchema,
        introspectionOptions: $.introspectionOptions,
      })
    })

    describe('Scalars', function () {
      it('adds example when it should', function () {
        const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
        const { jsonSchema } = $.result
        expect(jsonSchemaBefore).to.not.eql(jsonSchema)

        expect(jsonSchema.definitions.String.example).to.eql(
          addSpecialTags('42: Life, the Universe and Everything')
        )
      })
    })

    describe('Fields', function () {
      it('adds example when it should', function () {
        const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
        const { jsonSchema } = $.result
        expect(jsonSchemaBefore).to.not.eql(jsonSchema)

        ;[
          ['MyType', 'myField', 'String', true],
          ['MyType', 'myOtherField', 'OtherType', false],

          ['OtherType', 'myField', 'MyType', false],
          ['OtherType', 'myOtherField', 'String', true],

          // This field should have an example
          ['YetAnotherType', 'fieldWithExample', 'String', true],
        ].forEach(([type, field, returnTypeName, placeholdQuotes]) => {
          expect(jsonSchema.definitions[type].properties[field].properties.return.example).to.eql(
            addSpecialTags(
              [type, field, returnTypeName, 'example'].join('.'),
              { placeholdQuotes }
            )
          )
        })

        // This field should NOT have an example
        expect(jsonSchema.definitions.YetAnotherType.properties.fieldWithoutExample)
          .to.be.an('object')
          .that.does.not.have.any.keys('example')
      })
    })

    describe('Input Fields', function () {
      it('adds example when it should', function () {
        const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
        const { jsonSchema } = $.result
        expect(jsonSchemaBefore).to.not.eql(jsonSchema)

        ;[
          ['AnotherInput', 'inputOne', 'Int', false, false],
          ['AnotherInput', 'inputTwo', 'Int', true, false],
          ['AnotherInput', 'inputThree', 'Int', false, false],
          ['AnotherInput', 'inputFour', 'Int', true, true],
          ['AnotherInput', 'inputFive', 'Int', true, true],
        ].forEach(([inputTypeName, field, type, isArray, itemsRequired]) => {
          expect(jsonSchema.definitions[inputTypeName].properties[field].example).to.eql(
            addSpecialTags(
              [inputTypeName, field, type, isArray, itemsRequired, 'example'].join('.'),
            )
          )
        })

        ;['inputOne', 'inputTwo'].forEach((fieldWithoutExample) => {
          // This field should NOT have an example
          expect(jsonSchema.definitions.MyInput.properties[fieldWithoutExample])
            .to.be.an('object')
            .that.does.not.have.any.keys('example')
        })
      })
    })

    describe('Arguments', function () {
      it('adds example when it should', function () {
        const jsonSchemaBefore = _.cloneDeep($.jsonSchema)
        const { jsonSchema } = $.result
        expect(jsonSchemaBefore).to.not.eql(jsonSchema)

        ;[
          ['Type', 'MyType', 'myField', 'myArg', 'String', true],
          ['Type', 'MyType', 'myField', 'myOtherArg', 'String', true],

          ['Type', 'YetAnotherType', 'fieldWithExample', 'argWithExample', 'String', true],
          ['Type', 'YetAnotherType', 'fieldWithoutExample', 'argWithExample', 'Boolean', false],

          ['Query', 'Query', 'myQuery', 'myArg', 'String', true],
          ['Query', 'Query', 'myQuery', 'myOtherArg', 'String', true],

          ['Mutation', 'Mutation', 'myMutation', 'myArg', 'String', true],
          ['Mutation', 'Mutation', 'myMutation', 'myOtherArg', 'String', true],
        ].forEach(([typeType, typeName, fieldName, argName, argType, placeholdQuotes]) => {
          const area = typeType === 'Type' ? 'definitions' : 'properties'
          const whatDoWeCallAField = typeType === 'Type' ? 'Field' : typeType

          expect(jsonSchema[area][typeName].properties[fieldName].properties.arguments.properties[argName].example).to.eql(
            addSpecialTags(
              [typeName, typeType, fieldName, whatDoWeCallAField, argName, argType, 'example'].join('.'),
              { placeholdQuotes }
            )
          )
        })

        // There are no arguments on these, so they should not have examples
        ;[
          ['Type', 'MyType', 'myOtherField'],
          ['Type', 'OtherType', 'myField'],
          ['Type', 'OtherType', 'myOtherField'],
          ['Query', 'Query', 'myOtherQuery'],
          ['Mutation', 'Mutation', 'myOtherMutation'],
        ].forEach(([typeType, typeName, fieldName]) => {
          const area = typeType === 'Type' ? 'definitions' : 'properties'
          expect(jsonSchema[area][typeName].properties[fieldName].properties.arguments.properties).to.eql({})
        })
      })
    })
  })
})
