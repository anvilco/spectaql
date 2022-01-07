const _ = require('lodash')

// const IntrospectionManipulator = require('app/lib/Introspection')

const {
  introspectionResponseFromSchemaSDL,
  // jsonSchemaFromIntrospectionResponse,
  graphQLSchemaFromIntrospectionResponse,
} = require('app/spectaql/graphql-loaders')

const {
  addMetadata
} = require('app/spectaql/metadata-loaders')

const {
  addSpecialTags,
} = require('app/lib/common')

const {
  createIntrospectionManipulator,
  hideThingsBasedOnMetadata,
  addExamples,
  // addExamplesFromMetadata,
  // addExamplesDynamically,
} = require('app/spectaql/augmenters')

const {
  KIND_INPUT_OBJECT,
} = require('app/lib/Introspection')

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

  def('introspectionOptionsBase', () => ({
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

  def('introspectionManipulatorOptions', () => ({
    removeUnusedTypes: false,
    // removeFieldsWithMissingTypes: false,
    // removeArgsWithMissingTypes: false,
    // removeInputFieldsWithMissingTypes: false,
    // removePossibleTypesOfMissingTypes: false,
  }))

  def('graphQLSchema', () => graphQLSchemaFromIntrospectionResponse($.introspectionResponse))

  def('args', () => ({
    introspectionResponse: $.introspectionResponse,
    introspectionOptions: $.introspectionOptions
  }))

  def('introspectionManipulator', () => createIntrospectionManipulator($.args))

  def('response', () => $.result.introspectionManipulator.getResponse())

  describe('hideThingsBasedOnMetadata', function () {
    def('result', () => hideThingsBasedOnMetadata({
        introspectionManipulator: $.introspectionManipulator,
        introspectionOptions: $.introspectionOptions,
    }))


    it('shows everything when nothing was told to be hidden', function () {
      const responseBefore = _.cloneDeep($.introspectionResponse)
      const response = $.response
      expect(response).to.eql(responseBefore)
    })

    describe('Types', function () {
      it('shows at least some things by default', function () {
        expect($.introspectionManipulator.getType({ name: 'MyType' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'MyType', fieldName: 'myField' })).to.be.ok
        expect($.introspectionManipulator.getArg({ typeName: 'MyType', fieldName: 'myField', argName: 'myArg' })).to.be.ok
      })

      context('typesDocumentedDefault is false', function () {
        def('typesDocumentedDefault', false)

        it('does not show any types', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)

          expect($.introspectionManipulator.getAllTypes()).to.eql([])
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
            expect($.introspectionManipulator.getAllTypes()).to.eql([])
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

          expect($.introspectionManipulator.getAllTypes()).to.eql([])
          expect($.introspectionManipulator.getType({ name: 'MyType' })).to.not.be.ok
        })

        context('metadata directive says MyType should be documented', function () {
          def('metadata', () => {
            return _.set($.metadataBase, `OBJECT.MyType.${$.metadatasPath}`, { documented: true })
          })

          it('only documents MyType', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect($.introspectionManipulator.getAllTypes()).to.be.an('array').of.length(1)
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
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect($.introspectionManipulator.getType({ name: 'MyType' })).to.not.be.ok
          })

          // Removal of Types fields, Mutations and Queries that have a return type that is not
          // documented.

          it('removes some Type Fields, Queries and Mutations due to MyType not existing', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            // myField is gone b/c it was MyType
            expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'myField' })).to.not.be.ok

            expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'myOtherField' })).to.be.ok
            expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'nonRequiredArrayOfNonNullables' })).to.be.ok
            expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'nonRequiredArrayOfNullables' })).to.be.ok
            expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'requiredArrayOfNonNullables' })).to.be.ok
            expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'requiredArrayOfNullables' })).to.be.ok

            // myOtherQuery is gone b/c its return type was MyType
            expect($.introspectionManipulator.getQuery({ name: 'myOtherQuery' })).to.not.be.ok

            expect($.introspectionManipulator.getQuery({ name: 'myQuery' })).to.be.ok

            // myOtherMutation is gone b/c its return type was MyType
            expect($.introspectionManipulator.getMutation({ name: 'myOtherMutation' })).to.not.be.ok

            expect($.introspectionManipulator.getMutation({ name: 'myMutation' })).to.be.ok
          })
        })
      })
    })

    describe('Fields', function () {
      afterEach(() => {
        // Make sure it does not mess up Query or Mutation
        expect($.introspectionManipulator.getQueryType()).to.be.ok
        expect($.introspectionManipulator.getQuery({ name: 'myOtherQuery' })).to.be.ok
        expect($.introspectionManipulator.getQuery({ name: 'myQuery' })).to.be.ok
        expect($.introspectionManipulator.getMutationType()).to.be.ok
        expect($.introspectionManipulator.getMutation({ name: 'myOtherMutation' })).to.be.ok
        expect($.introspectionManipulator.getMutation({ name: 'myMutation' })).to.be.ok
      })

      it('shows at least some things by default', function () {
        expect($.introspectionManipulator.getField({ typeName: 'MyType', fieldName: 'myField' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'MyType', fieldName: 'myOtherField' })).to.be.ok


        expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'myField' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'myOtherField' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'nonRequiredArrayOfNonNullables' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'nonRequiredArrayOfNullables' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'requiredArrayOfNonNullables' })).to.be.ok
        expect($.introspectionManipulator.getField({ typeName: 'OtherType', fieldName: 'requiredArrayOfNullables' })).to.be.ok
      })

      context('fieldDocumentedDefault is false', function () {
        def('fieldDocumentedDefault', false)

        it('does not show any fields on types', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)

          let fields = $.introspectionManipulator.getType({ name: 'MyType' }).fields
          expect(fields).to.be.null

          fields = $.introspectionManipulator.getType({ name: 'OtherType' }).fields
          expect(fields).to.be.null
        })

        context('metadata directive says MyType should be documented', function () {
          def('metadata', () => {
            return _.set($.metadataBase, `OBJECT.MyType.fields.myField.${$.metadatasPath}`, { documented: true })
          })

          it('only documents myField', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            let fields = $.introspectionManipulator.getType({ name: 'MyType' }).fields
            // myField is the only one there
            expect(fields).to.be.an('array').of.length(1)
            expect(fields[0].name).to.eql('myField')

            // No fields on OtherType
            fields = $.introspectionManipulator.getType({ name: 'OtherType' }).fields
            expect(fields).to.be.null
          })
        })
      })
    })

    describe('Queries and Mutations', function () {
      afterEach(() => {
        // Make sure it does not mess up Types
        expect($.introspectionManipulator.getAllTypes()).to.be.an('array').of.length.gt(4)
      })

      it('shows at least some things by default', function () {
        expect($.introspectionManipulator.getQuery({ name: 'myQuery' })).to.be.ok
        expect($.introspectionManipulator.getQuery({ name: 'myOtherQuery' })).to.be.ok

        expect($.introspectionManipulator.getMutation({ name: 'myMutation' })).to.be.ok
        expect($.introspectionManipulator.getMutation({ name: 'myOtherMutation' })).to.be.ok
      })

      // Tests for top-level "should we document this at all" options
      ;[
        ['queriesDocumentedDefault', 'Query', 'Mutation' ],
        ['mutationsDocumentedDefault', 'Mutation', 'Query'],
      ].forEach(([option, thing, otherThing]) => {
        context(`${option} is false`, function () {
          def(option, false)

          it(`does not show any ${thing}s`, function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect($.introspectionManipulator[`get${thing}Type`]()).to.not.be.ok
            expect($.introspectionManipulator[`get${otherThing}Type`]()).to.be.ok
          })
        })
      })


      // Tests for 1-by-1 undocumentedness
      ;[
        ['queryDocumentedDefault', 'Query', 'Mutation', 'myOtherQuery', 'myMutation'],
        ['mutationDocumentedDefault', 'Mutation', 'Query', 'myOtherMutation', 'myQuery'],
      ].forEach(([option, thing, otherThing, exceptionName, otherThingTest]) => {
        context(`${option} is false`, function () {
          def(option, false)

          afterEach(() => {
            // Make sure that at least 1 thing from the other thing is OK
            expect($.introspectionManipulator[`get${otherThing}`]({ name: otherThingTest })).to.be.ok
          })

          it(`does not show any ${thing}s`, function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            const thingType = $.introspectionManipulator[`get${thing}Type`]()
            const otherThingType = $.introspectionManipulator[`get${otherThing}Type`]()

            // Both things should be there
            expect(thingType).to.be.ok
            expect(otherThingType).to.be.ok

            // But only 1 should have any fields
            expect(thingType.fields).to.be.null
            expect(otherThingType.fields).to.be.an('array').of.length(2)
          })

          context(`metadata directive says ${exceptionName} should be documented`, function () {
            def('metadata', () => {
              return _.set($.metadataBase, `OBJECT.${thing}.fields.${exceptionName}.${$.metadatasPath}`, { documented: true })
            })

            it(`only documents ${exceptionName}`, function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              const thingType = $.introspectionManipulator[`get${thing}Type`]()
              const otherThingType = $.introspectionManipulator[`get${otherThing}Type`]()

              // Both things should be there
              expect(thingType).to.be.ok
              expect(otherThingType).to.be.ok

              // Thing should have just the 1 field, and it should be the exception
              expect(thingType.fields).to.be.an('array').of.length(1)
              expect($.introspectionManipulator[`get${thing}`]({ name: exceptionName })).to.be.ok

              // OtherThing should be normal
              expect(otherThingType.fields).to.be.an('array').of.length(2)
            })
          })
        })
      })
    })

    // Same code for Types and [Queries / Mutations]?
    describe('Arguments', function () {
      it('shows at least some things by default', function () {
        [
          ['Query', 'myQuery'],
          ['Mutation', 'myMutation'],
          ['MyType', 'myField'],
        ].forEach(([typeName, fieldName]) => {
          ['myArg', 'myOtherArg'].forEach((argName) => {
            expect($.introspectionManipulator.getArg({ typeName, fieldName, argName })).to.be.ok
          })

        })
      })

      ;[
        [
          'argDocumentedDefault',
          'Type',
          { typeName: 'MyType', fieldName: 'myField' },
          [
            { typeName: 'Query', fieldName: 'myQuery' },
            { typeName: 'Mutation', fieldName: 'myMutation' },
          ],
        ],
        [
          'queryArgDocumentedDefault',
          'Query',
          { typeName: 'Query', fieldName: 'myQuery' },
          [
            { typeName: 'MyType', fieldName: 'myField' },
            { typeName: 'Mutation', fieldName: 'myMutation' },
          ],
        ],
        [
          'mutationArgDocumentedDefault',
          'Mutation',
          { typeName: 'Mutation', fieldName: 'myMutation' },
          [
            { typeName: 'MyType', fieldName: 'myField' },
            { typeName: 'Query', fieldName: 'myQuery' },
          ],
        ],
      ].forEach(([option, name, affected, notAffecteds]) => {
        context(`${option} is false`, function () {
          def(option, false)

          afterEach(() => {
            // Unaffecteds should still have all their arguments
            for (const notAffected of notAffecteds) {
              expect($.introspectionManipulator.getField(notAffected).args).to.be.an('array').of.length(2)
              for (const argName of ['myArg', 'myOtherArg']) {
                expect($.introspectionManipulator.getArg({ ...notAffected, argName })).to.be.ok
              }
            }
          })

          it(`does not show any ${name}s`, function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            // Affected thing should be empty of arguments
            expect($.introspectionManipulator.getField(affected).args).to.eql([])
          })

          context(`metadata directive says myOtherArg should be documented`, function () {
            const exceptionName = 'myOtherArg'

            def('metadata', () => {
              return _.set($.metadataBase, `OBJECT.${affected.typeName}.fields.${affected.fieldName}.args.${exceptionName}.${$.metadatasPath}`, { documented: true })
            })

            it(`only documents ${exceptionName}`, function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              // Affected thing should have just the exceptional argument
              expect($.introspectionManipulator.getField(affected).args).to.be.an('array').of.length(1)
              expect($.introspectionManipulator.getArg({ ...affected, argName: exceptionName })).to.be.ok
            })
          })
        })
      })
    })

    // TODO: Properly support INPUT_TYPEs, and then test those things
    it('removes arguments whose input types have been hidden')
  })

  describe('addExamples', function () {
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

    // def('result', () => {
    //   return addExamplesFromMetadata(
    //     // Need to call hideThingsBasedOnMetadata so that metadata gets copied
    //     hideThingsBasedOnMetadata({
    //       introspectionResponse: $.introspectionResponse,
    //       jsonSchema: $.jsonSchema,
    //       graphQLSchema: $.graphQLSchema,
    //       introspectionOptions: $.introspectionOptions,
    //     })
    //   )
    // })

    def('result', () => addExamples({
      introspectionManipulator: $.introspectionManipulator,
      introspectionOptions: $.introspectionOptions,
    }))

    // Common stuff across both tests, if you define things properly
    function commonTests () {
      const responseBefore = _.cloneDeep($.introspectionResponse)
      const response = $.response
      expect(response).to.not.eql(responseBefore)

      // No top-level examples, even if ther was something in the metadata for them
      expect($.introspectionManipulator.getType({ name: 'MyType' })).to.be.an('object').that.does.not.have.any.keys('example')
      expect($.introspectionManipulator.getType({ name: 'MyInput', kind: KIND_INPUT_OBJECT })).to.be.an('object').that.does.not.have.any.keys('example')
      expect($.introspectionManipulator.getType({ name: 'Query' })).to.be.an('object').that.does.not.have.any.keys('example')
      expect($.introspectionManipulator.getType({ name: 'Mutation' })).to.be.an('object').that.does.not.have.any.keys('example')

      // Type Fields have example...
      expect($.introspectionManipulator.getField({ typeName: 'MyType', fieldName: 'myField' }).example).to.eql($.processedExample)

      // Input Fields have example...
      expect($.introspectionManipulator.getInputField({ inputName: 'MyInput', inputFieldName: 'inputOne' }).example).to.eql($.processedExample)

      // ...queries and mutations DO NOT
      expect($.introspectionManipulator.getQuery({ name: 'myQuery' })).be.an('object').that.does.not.have.any.keys('example')
      expect($.introspectionManipulator.getMutation({ name: 'myMutation' })).be.an('object').that.does.not.have.any.keys('example')

      // Arguments on all things have an example
      expect($.introspectionManipulator.getArg({ typeName: 'MyType', fieldName: 'myField', argName: 'myArg' }).example).to.eql($.processedExample)
      expect($.introspectionManipulator.getArg({ typeName: 'Query', fieldName: 'myQuery', argName: 'myArg' }).example).to.eql($.processedExample)
      expect($.introspectionManipulator.getArg({ typeName: 'Mutation', fieldName: 'myMutation', argName: 'myArg' }).example).to.eql($.processedExample)
    }

    context('"example" is in metadata', function () {
      def('example', "fooey")
      def('processedExample', () => addSpecialTags($.example, { placeholdQuotes: true }))
      def('theMetadata', () => ({ example: $.example }))

      it('adds example to Introspection Query Response', function () {
        commonTests()
      })

      context('"examples" is *also* in metadata', function () {
        // Yes, weird that this is a scalar/single value and not an array, but it will be arrayed below
        def('examplesExample', "barrey")
        def('processedExample', () => addSpecialTags($.examplesExample, { placeholdQuotes: true }))
        def('theMetadata', () => ({
          example: $.example,
          examples: [$.examplesExample]
        }))

        it('adds one of the examples to JSON Schema', function () {
          commonTests()
        })
      })
    })

    context('examples in metadata', function () {
      // Yes, weird that this is a scalar/single value and not an array
      def('examplesExample', "barrey")
      def('processedExample', () => addSpecialTags($.examplesExample, { placeholdQuotes: true }))
      def('theMetadata', () => ({ examples: [$.examplesExample] }))

      it('adds one of the examples to JSON Schema', function () {
        commonTests()
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
