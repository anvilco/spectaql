import _ from 'lodash'

import {
  introspectionResponseFromSchemaSDL,
  graphQLSchemaFromIntrospectionResponse,
} from 'dist/spectaql/graphql-loaders'

import { introspectionOptionsToMicrofiberOptions } from 'dist'
import { addMetadata } from 'dist/spectaql/metadata-loaders'

import {
  createIntrospectionManipulator,
  hideThingsBasedOnMetadata,
  addExamples,
  // addExamplesFromMetadata,
  // addExamplesDynamically,
} from 'dist/spectaql/augmenters'

import { KINDS } from 'microfiber'

describe('augmenters', function () {
  def(
    'schemaSDLBase',
    () => `
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

    enum MyEnum {
      ENUM1
      ENUM2
      ENUM3
    }

    type UnusedType {
      id: String
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

    type Subscription {
      mySubscription(input: ID): MyType
      myOtherSubscription: MyType
    }

    input MyInput {
      inputOne: String
      inputTwo: Int
    }
  `
  )
  def('schemaSDL', () => $.schemaSDLBase)

  def('metadataBase', () => ({
    OBJECT: {
      MyType: {},
      OtherType: {},
      Query: {},
      Mutation: {},
    },
    INPUT_OBJECT: {
      MyInput: {},
    },
  }))
  def('metadata', () => $.metadataBase)

  def('doMetadata', true)
  def('metadatasPath', 'metadata')

  def('hideUnusedTypes', false)

  def('objectsDocumentedDefault', true)
  def('objectDocumentedDefault', true)

  def('inputsDocumentedDefault', true)
  def('inputDocumentedDefault', true)

  def('unionsDocumentedDefault', true)
  def('unionDocumentedDefault', true)

  def('enumsDocumentedDefault', true)
  def('enumDocumentedDefault', true)

  def('fieldDocumentedDefault', true)
  def('hideFieldsOfUndocumentedType', true)

  def('inputFieldDocumentedDefault', true)
  def('hideInputFieldsOfUndocumentedType', true)

  def('argDocumentedDefault', true)

  def('queriesDocumentedDefault', true)
  def('queryDocumentedDefault', true)
  def('queryArgDocumentedDefault', true)
  def('hideQueriesWithUndocumentedReturnType', true)

  def('mutationsDocumentedDefault', true)
  def('mutationDocumentedDefault', true)
  def('mutationArgDocumentedDefault', true)
  def('hideMutationsWithUndocumentedReturnType', true)

  def('subscriptionsDocumentedDefault', true)
  def('subscriptionDocumentedDefault', true)
  def('subscriptionArgDocumentedDefault', true)
  def('hideSubscriptionsWithUndocumentedReturnType', true)

  def('introspectionOptionsBase', () => {
    const base = {
      metadata: $.doMetadata,
      metadatasPath: $.metadatasPath,

      hideUnusedTypes: $.hideUnusedTypes,

      objectsDocumentedDefault: $.objectsDocumentedDefault,
      objectDocumentedDefault: $.objectDocumentedDefault,

      inputsDocumentedDefault: $.inputsDocumentedDefault,
      inputDocumentedDefault: $.inputDocumentedDefault,

      unionsDocumentedDefault: $.unionsDocumentedDefault,
      unionDocumentedDefault: $.unionDocumentedDefault,

      enumsDocumentedDefault: $.enumsDocumentedDefault,
      enumDocumentedDefault: $.enumDocumentedDefault,

      fieldDocumentedDefault: $.fieldDocumentedDefault,
      hideFieldsOfUndocumentedType: $.hideFieldsOfUndocumentedType,

      inputFieldDocumentedDefault: $.inputFieldDocumentedDefault,
      hideInputFieldsOfUndocumentedType: $.hideInputFieldsOfUndocumentedType,

      argDocumentedDefault: $.argDocumentedDefault,

      queriesDocumentedDefault: $.queriesDocumentedDefault,
      queryDocumentedDefault: $.queryDocumentedDefault,
      queryArgDocumentedDefault: $.queryArgDocumentedDefault,
      hideQueriesWithUndocumentedReturnType:
        $.hideQueriesWithUndocumentedReturnType,

      mutationsDocumentedDefault: $.mutationsDocumentedDefault,
      mutationDocumentedDefault: $.mutationDocumentedDefault,
      mutationArgDocumentedDefault: $.mutationArgDocumentedDefault,
      hideMutationsWithUndocumentedReturnType:
        $.hideMutationsWithUndocumentedReturnType,

      subscriptionsDocumentedDefault: $.subscriptionsDocumentedDefault,
      subscriptionDocumentedDefault: $.subscriptionDocumentedDefault,
      subscriptionArgDocumentedDefault: $.subscriptionArgDocumentedDefault,
      hideSubscriptionsWithUndocumentedReturnType:
        $.hideSubscriptionsWithUndocumentedReturnType,
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

  def('graphQLSchema', () =>
    graphQLSchemaFromIntrospectionResponse($.introspectionResponse)
  )

  def('args', () => ({
    introspectionResponse: $.introspectionResponse,
    introspectionOptions: $.introspectionOptions,
  }))

  def('introspectionManipulator', () => createIntrospectionManipulator($.args))

  def('response', () => $.result.introspectionManipulator.getResponse())

  describe('hideThingsBasedOnMetadata', function () {
    def('result', () =>
      hideThingsBasedOnMetadata({
        introspectionManipulator: $.introspectionManipulator,
        introspectionOptions: $.introspectionOptions,
      })
    )

    it('shows everything when nothing was told to be hidden', function () {
      const responseBefore = _.cloneDeep($.introspectionResponse)
      const response = $.response
      expect(response).to.eql(responseBefore)
    })

    describe('Types', function () {
      it('shows at least some things by default', function () {
        expect($.introspectionManipulator.getType({ name: 'MyType' })).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'MyType',
            fieldName: 'myField',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getArg({
            typeName: 'MyType',
            fieldName: 'myField',
            argName: 'myArg',
          })
        ).to.be.ok

        expect($.introspectionManipulator.getType({ name: 'OtherType' })).to.be
          .ok
        // This thing is not used, but we told it not to remove things that are not used
        expect($.introspectionManipulator.getType({ name: 'UnusedType' })).to.be
          .ok
      })

      context('hideUnusedTypes is true', function () {
        def('hideUnusedTypes', () => true)

        it('shows some things but hides some unused things', function () {
          expect(
            $.introspectionManipulator.getType({ name: 'MyType' })
          ).to.be.ok
          expect(
            $.introspectionManipulator.getField({
              typeName: 'MyType',
              fieldName: 'myField',
            })
          ).to.be.ok
          expect(
            $.introspectionManipulator.getArg({
              typeName: 'MyType',
              fieldName: 'myField',
              argName: 'myArg',
            })
          ).to.be.ok

          // This thing is not used, but we told it not to remove things that are not used
          expect(
            $.introspectionManipulator.getType({ name: 'UnusedType' })
          ).to.not.be.ok
        })
      })

      // These are the plural versions in case it's hard to tell/read
      context(
        'objectsDocumentedDefault and unionsDocumentedDefault and inputsDocumentedDefault is false',
        function () {
          def('objectsDocumentedDefault', false)
          def('enumsDocumentedDefault', false)
          def('unionsDocumentedDefault', false)
          def('inputsDocumentedDefault', false)

          it('does not show any types', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect($.introspectionManipulator.getAllTypes({})).to.eql([])
            expect($.introspectionManipulator.getType({ name: 'MyType' })).to
              .not.be.ok
          })

          context('metadata says MyType should be documented', function () {
            def('metadata', () => {
              return _.set($.metadataBase, `OBJECT.MyType.${$.metadatasPath}`, {
                documented: true,
              })
            })

            it('still does not show any types', function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)
              expect($.introspectionManipulator.getAllTypes({})).to.eql([])
              expect(
                $.introspectionManipulator.getType({ name: 'MyType' })
              ).to.not.be.ok
            })
          })
        }
      )

      // These are the singular versions in case it's hard to tell/read
      context(
        'objectDocumentedDefault and enumDocumentedDefault and unionDocumentedDefault and inputDocumentedDefault is false',
        function () {
          def('objectDocumentedDefault', false)
          def('enumDocumentedDefault', false)
          def('unionDocumentedDefault', false)
          def('inputDocumentedDefault', false)

          it('does not show any types', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect($.introspectionManipulator.getAllTypes({})).to.eql([])
            expect($.introspectionManipulator.getType({ name: 'MyType' })).to
              .not.be.ok
          })

          context(
            'metadata directive says MyType should be documented',
            function () {
              def('metadata', () => {
                return _.set(
                  $.metadataBase,
                  `OBJECT.MyType.${$.metadatasPath}`,
                  {
                    documented: true,
                  }
                )
              })

              it('only documents MyType', function () {
                const responseBefore = _.cloneDeep($.introspectionResponse)
                const response = $.response
                expect(response).to.not.eql(responseBefore)

                expect($.introspectionManipulator.getAllTypes({}))
                  .to.be.an('array')
                  .of.length(1)
                expect($.introspectionManipulator.getType({ name: 'MyType' }))
                  .to.be.ok
              })
            }
          )
        }
      )

      describe('undocumented metadata directive', function () {
        context(
          'metadata directive says MyType should NOT be documented',
          function () {
            def('metadata', () => {
              return _.set($.metadataBase, `OBJECT.MyType.${$.metadatasPath}`, {
                undocumented: true,
              })
            })

            it('does not document MyType', function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              expect($.introspectionManipulator.getType({ name: 'MyType' })).to
                .not.be.ok
            })

            // Removal of Types fields, Mutations and Queries that have a return type that is not
            // documented.

            it('removes some Type Fields, Queries and Mutations due to MyType not existing', function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              // myField is gone b/c it was MyType
              expect(
                $.introspectionManipulator.getField({
                  typeName: 'OtherType',
                  fieldName: 'myField',
                })
              ).to.not.be.ok

              expect(
                $.introspectionManipulator.getField({
                  typeName: 'OtherType',
                  fieldName: 'myOtherField',
                })
              ).to.be.ok
              expect(
                $.introspectionManipulator.getField({
                  typeName: 'OtherType',
                  fieldName: 'nonRequiredArrayOfNonNullables',
                })
              ).to.be.ok
              expect(
                $.introspectionManipulator.getField({
                  typeName: 'OtherType',
                  fieldName: 'nonRequiredArrayOfNullables',
                })
              ).to.be.ok
              expect(
                $.introspectionManipulator.getField({
                  typeName: 'OtherType',
                  fieldName: 'requiredArrayOfNonNullables',
                })
              ).to.be.ok
              expect(
                $.introspectionManipulator.getField({
                  typeName: 'OtherType',
                  fieldName: 'requiredArrayOfNullables',
                })
              ).to.be.ok

              // myOtherQuery is gone b/c its return type was MyType
              expect(
                $.introspectionManipulator.getQuery({ name: 'myOtherQuery' })
              ).to.not.be.ok

              expect($.introspectionManipulator.getQuery({ name: 'myQuery' }))
                .to.be.ok

              // myOtherMutation is gone b/c its return type was MyType
              expect(
                $.introspectionManipulator.getMutation({
                  name: 'myOtherMutation',
                })
              ).to.not.be.ok

              expect(
                $.introspectionManipulator.getMutation({ name: 'myMutation' })
              ).to.be.ok
            })
          }
        )
      })
    })

    describe('Fields/EnumValues', function () {
      afterEach(() => {
        // Make sure it does not mess up Query or Mutation
        expect($.introspectionManipulator.getQueryType()).to.be.ok
        expect($.introspectionManipulator.getQuery({ name: 'myOtherQuery' })).to
          .be.ok
        expect($.introspectionManipulator.getQuery({ name: 'myQuery' })).to.be
          .ok
        expect($.introspectionManipulator.getMutationType()).to.be.ok
        expect(
          $.introspectionManipulator.getMutation({ name: 'myOtherMutation' })
        ).to.be.ok
        expect($.introspectionManipulator.getMutation({ name: 'myMutation' }))
          .to.be.ok
      })

      it('shows at least some things by default', function () {
        expect(
          $.introspectionManipulator.getField({
            typeName: 'MyType',
            fieldName: 'myField',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'MyType',
            fieldName: 'myOtherField',
          })
        ).to.be.ok

        expect(
          $.introspectionManipulator.getField({
            typeName: 'OtherType',
            fieldName: 'myField',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'OtherType',
            fieldName: 'myOtherField',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'OtherType',
            fieldName: 'nonRequiredArrayOfNonNullables',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'OtherType',
            fieldName: 'nonRequiredArrayOfNullables',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'OtherType',
            fieldName: 'requiredArrayOfNonNullables',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getField({
            typeName: 'OtherType',
            fieldName: 'requiredArrayOfNullables',
          })
        ).to.be.ok

        expect(
          $.introspectionManipulator.getEnumValue({
            typeName: 'MyEnum',
            fieldName: 'ENUM1',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getEnumValue({
            typeName: 'MyEnum',
            fieldName: 'ENUM2',
          })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getEnumValue({
            typeName: 'MyEnum',
            fieldName: 'ENUM3',
          })
        ).to.be.ok
      })

      context('fieldDocumentedDefault is false', function () {
        def('fieldDocumentedDefault', false)

        it('does not show any fields on types', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)

          let fields = $.introspectionManipulator.getType({
            name: 'MyType',
          }).fields
          expect(fields).to.eql([])

          fields = $.introspectionManipulator.getType({
            name: 'OtherType',
          }).fields
          expect(fields).to.eql([])
        })

        context(
          'metadata directive says MyType should be documented',
          function () {
            def('metadata', () => {
              return _.set(
                $.metadataBase,
                `OBJECT.MyType.fields.myField.${$.metadatasPath}`,
                { documented: true }
              )
            })

            it('only documents myField', function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              let fields = $.introspectionManipulator.getType({
                name: 'MyType',
              }).fields
              // myField is the only one there
              expect(fields).to.be.an('array').of.length(1)
              expect(fields[0].name).to.eql('myField')

              // No fields on OtherType
              fields = $.introspectionManipulator.getType({
                name: 'OtherType',
              }).fields
              expect(fields).to.eql([])
            })
          }
        )
      })

      describe('enumValues', function () {
        context(
          'metadata directive says MyEnum.ENUM2 should NOT be documented',
          function () {
            def('metadata', () => {
              return _.set(
                $.metadataBase,
                `ENUM.MyEnum.enumValues.ENUM2.${$.metadatasPath}`,
                { undocumented: true }
              )
            })

            it('only documents the other enumValues', function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              const enumValues = $.introspectionManipulator.getType({
                kind: KINDS.ENUM,
                name: 'MyEnum',
              }).enumValues
              // Only ENUM1 and ENUM3 are there
              expect(enumValues).to.be.an('array').of.length(2)
              expect(enumValues.map((enumValue) => enumValue.name)).to.eql([
                'ENUM1',
                'ENUM3',
              ])

              for (const enumValue of ['ENUM1', 'ENUM3']) {
                const enumValueDef = $.introspectionManipulator.getEnumValue({
                  typeName: 'MyEnum',
                  fieldName: enumValue,
                })

                expect(enumValueDef).to.be.ok
                expect(enumValueDef.name).to.eql(enumValue)
              }

              expect(
                $.introspectionManipulator.getEnumValue({
                  typeName: 'MyEnum',
                  fieldName: 'ENUM2',
                })
              ).to.not.be.ok
            })
          }
        )
      })
    })

    describe('Queries, Mutations and Subscriptions', function () {
      afterEach(() => {
        // Make sure it does not mess up Types
        expect($.introspectionManipulator.getAllTypes({}))
          .to.be.an('array')
          .of.length.gt(4)
      })

      it('shows at least some things by default', function () {
        expect($.introspectionManipulator.getQuery({ name: 'myQuery' })).to.be
          .ok
        expect($.introspectionManipulator.getQuery({ name: 'myOtherQuery' })).to
          .be.ok

        expect($.introspectionManipulator.getMutation({ name: 'myMutation' }))
          .to.be.ok
        expect(
          $.introspectionManipulator.getMutation({ name: 'myOtherMutation' })
        ).to.be.ok
        expect(
          $.introspectionManipulator.getSubscription({ name: 'mySubscription' })
        ).to.be.ok
      })

      // Tests for top-level "should we document this at all" options
      ;[
        ['queriesDocumentedDefault', 'Query', ['Mutation', 'Subscription']],
        ['mutationsDocumentedDefault', 'Mutation', ['Query', 'Subscription']],
        [
          'subscriptionsDocumentedDefault',
          'Subscription',
          ['Query', 'Mutation'],
        ],
      ].forEach(([option, thing, otherThings]) => {
        context(`${option} is false`, function () {
          def(option, false)

          it(`does not show any ${thing}s`, function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            expect($.introspectionManipulator[`get${thing}Type`]()).to.not.be.ok
            for (const otherThing of otherThings) {
              expect($.introspectionManipulator[`get${otherThing}Type`]()).to.be
                .ok
            }
          })
        })
      })

      // Tests for 1-by-1 undocumentedness
      ;[
        [
          'queryDocumentedDefault',
          'Query',
          ['Mutation', 'Subscription'],
          'myOtherQuery',
          ['myMutation', 'mySubscription'],
        ],
        [
          'mutationDocumentedDefault',
          'Mutation',
          ['Query', 'Subscription'],
          'myOtherMutation',
          ['myQuery', 'mySubscription'],
        ],
        [
          'subscriptionDocumentedDefault',
          'Subscription',
          ['Query', 'Mutation'],
          'myOtherSubscription',
          ['myQuery', 'myMutation'],
        ],
      ].forEach(
        ([option, thing, otherThings, exceptionName, otherThingsTest]) => {
          context(`${option} is false`, function () {
            def(option, false)

            afterEach(() => {
              for (let i = 0; i < otherThings.length; i++) {
                const otherThing = otherThings[i]
                const otherThingTest = otherThingsTest[i]
                // Make sure that at least 1 thing from the other thing is OK
                expect(
                  $.introspectionManipulator[`get${otherThing}`]({
                    name: otherThingTest,
                  })
                ).to.be.ok
              }
            })

            it(`does not show any ${thing}s`, function () {
              const responseBefore = _.cloneDeep($.introspectionResponse)
              const response = $.response
              expect(response).to.not.eql(responseBefore)

              const thingType = $.introspectionManipulator[`get${thing}Type`]()
              const otherThingType =
                $.introspectionManipulator[`get${otherThings[0]}Type`]()

              // Both things should be there
              expect(thingType).to.be.ok
              expect(otherThingType).to.be.ok

              // But only 1 should have any fields
              expect(thingType.fields).to.eql([])
              expect(otherThingType.fields).to.be.an('array').of.length(2)
            })

            context(
              `metadata directive says ${exceptionName} should be documented`,
              function () {
                def('metadata', () => {
                  return _.set(
                    $.metadataBase,
                    `OBJECT.${thing}.fields.${exceptionName}.${$.metadatasPath}`,
                    { documented: true }
                  )
                })

                it(`only documents ${exceptionName}`, function () {
                  const responseBefore = _.cloneDeep($.introspectionResponse)
                  const response = $.response
                  expect(response).to.not.eql(responseBefore)

                  const thingType =
                    $.introspectionManipulator[`get${thing}Type`]()
                  const otherThingType =
                    $.introspectionManipulator[`get${otherThings[0]}Type`]()

                  // Both things should be there
                  expect(thingType).to.be.ok
                  expect(otherThingType).to.be.ok

                  // Thing should have just the 1 field, and it should be the exception
                  expect(thingType.fields).to.be.an('array').of.length(1)
                  expect(
                    $.introspectionManipulator[`get${thing}`]({
                      name: exceptionName,
                    })
                  ).to.be.ok

                  // OtherThing should be normal
                  expect(otherThingType.fields).to.be.an('array').of.length(2)
                })
              }
            )
          })
        }
      )
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
            expect(
              $.introspectionManipulator.getArg({
                typeName,
                fieldName,
                argName,
              })
            ).to.be.ok
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
              expect($.introspectionManipulator.getField(notAffected).args)
                .to.be.an('array')
                .of.length(2)
              for (const argName of ['myArg', 'myOtherArg']) {
                expect(
                  $.introspectionManipulator.getArg({ ...notAffected, argName })
                ).to.be.ok
              }
            }
          })

          it(`does not show any ${name}s`, function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            // Affected thing should be empty of arguments
            expect($.introspectionManipulator.getField(affected).args).to.eql(
              []
            )
          })

          context(
            `metadata directive says myOtherArg should be documented`,
            function () {
              const exceptionName = 'myOtherArg'

              def('metadata', () => {
                return _.set(
                  $.metadataBase,
                  `OBJECT.${affected.typeName}.fields.${affected.fieldName}.args.${exceptionName}.${$.metadatasPath}`,
                  { documented: true }
                )
              })

              it(`only documents ${exceptionName}`, function () {
                const responseBefore = _.cloneDeep($.introspectionResponse)
                const response = $.response
                expect(response).to.not.eql(responseBefore)

                // Affected thing should have just the exceptional argument
                expect($.introspectionManipulator.getField(affected).args)
                  .to.be.an('array')
                  .of.length(1)
                expect(
                  $.introspectionManipulator.getArg({
                    ...affected,
                    argName: exceptionName,
                  })
                ).to.be.ok
              })
            }
          )
        })
      })
    })

    // TODO: Properly support INPUT_TYPEs, and then test those things
    it('removes arguments whose input types have been hidden')
  })

  describe('addExamples', function () {
    def('metadataBase', () => ({
      OBJECT: {
        MyType: {
          // Should have an impact, example-wise
          metadata: $.theMetadata,
          fields: {
            myField: {
              metadata: $.theMetadata,
              args: {
                myArg: {
                  metadata: $.theMetadata,
                },
              },
            },
          },
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
                },
              },
            },
          },
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
                },
              },
            },
          },
        },
        Subscription: {
          // Should have no impact, example-wise
          metadata: $.theMetadata,
          fields: {
            myQuery: {
              metadata: $.theMetadata,
              args: {
                myArg: {
                  metadata: $.theMetadata,
                },
              },
            },
          },
        },
      },
      INPUT_OBJECT: {
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
      },
    }))

    def('metadata', () => $.metadataBase)

    def('result', () =>
      addExamples({
        introspectionManipulator: $.introspectionManipulator,
        introspectionOptions: $.introspectionOptions,
      })
    )

    // Common stuff across both tests, if you define things properly
    function commonTests() {
      const responseBefore = _.cloneDeep($.introspectionResponse)
      const response = $.response
      expect(response).to.not.eql(responseBefore)

      expect($.introspectionManipulator.getType({ name: 'MyType' }))
        .to.be.an('object')
        .that.does.have.any.keys('example')

      expect(
        $.introspectionManipulator.getType({
          name: 'MyInput',
          kind: KINDS.INPUT_OBJECT,
        })
      )
        .to.be.an('object')
        .that.does.have.any.keys('example')

      // No top-level examples, even if ther was something in the metadata for them
      expect($.introspectionManipulator.getType({ name: 'Query' }))
        .to.be.an('object')
        .that.does.not.have.any.keys('example')
      expect($.introspectionManipulator.getType({ name: 'Mutation' }))
        .to.be.an('object')
        .that.does.not.have.any.keys('example')

      expect($.introspectionManipulator.getType({ name: 'Subscription' }))
        .to.be.an('object')
        .that.does.not.have.any.keys('example')

      // Type Fields have example...
      expect(
        $.introspectionManipulator.getField({
          typeName: 'MyType',
          fieldName: 'myField',
        }).example
      ).to.eql($.processedExample)

      // Input Fields have example...
      expect(
        $.introspectionManipulator.getInputField({
          typeName: 'MyInput',
          fieldName: 'inputOne',
        }).example
      ).to.eql($.processedExample)

      // ...queries and mutations DO NOT
      expect($.introspectionManipulator.getQuery({ name: 'myQuery' }))
        .be.an('object')
        .that.does.not.have.any.keys('example')
      expect($.introspectionManipulator.getMutation({ name: 'myMutation' }))
        .be.an('object')
        .that.does.not.have.any.keys('example')

      // Arguments on all things have an example
      expect(
        $.introspectionManipulator.getArg({
          typeName: 'MyType',
          fieldName: 'myField',
          argName: 'myArg',
        }).example
      ).to.eql($.processedExample)
      expect(
        $.introspectionManipulator.getArg({
          typeName: 'Query',
          fieldName: 'myQuery',
          argName: 'myArg',
        }).example
      ).to.eql($.processedExample)
      expect(
        $.introspectionManipulator.getArg({
          typeName: 'Mutation',
          fieldName: 'myMutation',
          argName: 'myArg',
        }).example
      ).to.eql($.processedExample)
    }

    context('"example" is in metadata', function () {
      def('example', 'fooey')
      def('processedExample', () => $.example)
      def('theMetadata', () => ({ example: $.example }))

      it('adds example to Introspection Query Response', function () {
        commonTests()
      })

      context('"examples" is *also* in metadata', function () {
        // Yes, weird that this is a scalar/single value and not an array, but it will be arrayed below
        def('examplesExample', 'barrey')
        def('processedExample', () => $.examplesExample)
        def('theMetadata', () => ({
          example: $.example,
          examples: [$.examplesExample],
        }))

        it('adds one of the examples to JSON Schema', function () {
          commonTests()
        })
      })
    })

    context('examples in metadata', function () {
      // Yes, weird that this is a scalar/single value and not an array
      def('examplesExample', 'barrey')
      def('processedExample', () => $.examplesExample)
      def('theMetadata', () => ({ examples: [$.examplesExample] }))

      it('adds one of the examples to JSON Schema', function () {
        commonTests()
      })
    })

    context('example added by processor', function () {
      def(
        'schemaSDL',
        () => `
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
      `
      )

      def('metadata', () => ({}))

      // This from-the-root path works due to appModulePath in testing setup
      def('dynamicExamplesProcessingModule', 'test/fixtures/examplesProcessor')
      def('introspectionOptions', () => ({
        ...$.introspectionOptionsBase,
        dynamicExamplesProcessingModule: $.dynamicExamplesProcessingModule,
      }))

      describe('Scalars', function () {
        it('adds example when it should', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)

          // OK, WTF were special tags again? And placeholding quotes?
          expect(
            $.introspectionManipulator.getType({
              kind: KINDS.SCALAR,
              name: 'String',
            }).example
          ).to.include('42: Life, the Universe and Everything')
        })

        context('example already exists in metadata', function () {
          def('metadata', () => {
            const metadata = {
              ...$.metadataBase,
            }

            metadata.SCALAR = {
              String: {
                metadata: {
                  example: 'Fourty-two: Life, the Universe and Everything',
                },
              },
            }

            return metadata
          })

          it('leaves example alone when it already exists from metadata', function () {
            const responseBefore = _.cloneDeep($.introspectionResponse)
            const response = $.response
            expect(response).to.not.eql(responseBefore)

            // OK, WTF were special tags again? And placeholding quotes?
            expect(
              $.introspectionManipulator.getType({
                kind: KINDS.SCALAR,
                name: 'String',
              }).example
            ).to.include('Fourty-two: Life, the Universe and Everything')
          })
        })
      })

      describe('Fields', function () {
        it('adds example when it should', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)
          ;[
            ['MyType', 'myField', 'String', true],
            ['MyType', 'myOtherField', 'OtherType', false],

            ['OtherType', 'myField', 'MyType', false],
            ['OtherType', 'myOtherField', 'String', true],

            // This field should have an example
            ['YetAnotherType', 'fieldWithExample', 'String', true],
          ].forEach(
            ([typeName, fieldName, returnTypeName /*placeholdQuotes*/]) => {
              expect(
                $.introspectionManipulator.getField({ typeName, fieldName })
                  .example
              ).to.eql(
                // addSpecialTags(
                [typeName, fieldName, returnTypeName, 'example'].join('.')
                // { placeholdQuotes }
                // )
              )
            }
          )

          // This field should NOT have an example
          const fieldWithoutExample = $.introspectionManipulator.getField({
            typeName: 'YetAnotherType',
            fieldName: 'fieldWithoutExample',
          })
          expect(fieldWithoutExample).to.be.ok
          expect(fieldWithoutExample.example).to.not.be.ok
        })
      })

      describe('Input Fields', function () {
        it('adds example when it should', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)
          ;[
            ['AnotherInput', 'inputOne', 'Int', false, false],
            ['AnotherInput', 'inputTwo', 'Int', true, false],
            ['AnotherInput', 'inputThree', 'Int', false, false],
            ['AnotherInput', 'inputFour', 'Int', true, true],
            ['AnotherInput', 'inputFive', 'Int', true, true],
          ].forEach(
            ([typeName, fieldName, inputFieldType, isArray, itemsRequired]) => {
              expect(
                $.introspectionManipulator.getInputField({
                  typeName,
                  fieldName,
                }).example
              ).to.eql(
                // addSpecialTags(
                [
                  typeName,
                  fieldName,
                  inputFieldType,
                  isArray,
                  itemsRequired,
                  'example',
                ].join('.')
                // )
              )
            }
          )
          ;['inputOne', 'inputTwo'].forEach((fieldWithoutExample) => {
            // This field should NOT have an example
            const inputField = $.introspectionManipulator.getInputField({
              typeName: 'MyInput',
              fieldName: fieldWithoutExample,
            })
            expect(inputField).to.be.ok
            expect(inputField.example).to.not.be.ok
          })
        })
      })

      describe('Arguments', function () {
        it('adds example when it should', function () {
          const responseBefore = _.cloneDeep($.introspectionResponse)
          const response = $.response
          expect(response).to.not.eql(responseBefore)
          ;[
            ['MyType', 'myField', 'myArg', 'String', true],
            ['MyType', 'myField', 'myOtherArg', 'String', true],

            [
              'YetAnotherType',
              'fieldWithExample',
              'argWithExample',
              'String',
              true,
            ],
            [
              'YetAnotherType',
              'fieldWithoutExample',
              'argWithExample',
              'Boolean',
              false,
            ],

            ['Query', 'myQuery', 'myArg', 'String', true],
            ['Query', 'myQuery', 'myOtherArg', 'String', true],

            ['Mutation', 'myMutation', 'myArg', 'String', true],
            ['Mutation', 'myMutation', 'myOtherArg', 'String', true],
          ].forEach(
            ([typeName, fieldName, argName, argType /*placeholdQuotes*/]) => {
              expect(
                $.introspectionManipulator.getArg({
                  typeName,
                  fieldName,
                  argName,
                }).example
              ).to.eql(
                // addSpecialTags(
                [typeName, fieldName, argName, argType, 'example'].join('.')
                // { placeholdQuotes }
                // )
              )
            }
          )

          // There are no arguments on these, so they should not have arguments, nor examples
          ;[
            ['MyType', 'myOtherField'],
            ['OtherType', 'myField'],
            ['OtherType', 'myOtherField'],
            ['Query', 'myOtherQuery'],
            ['Mutation', 'myOtherMutation'],
          ].forEach(([typeName, fieldName]) => {
            const field = $.introspectionManipulator.getField({
              typeName,
              fieldName,
            })
            expect(field).to.be.ok
            expect(field.args).to.eql([])
          })
        })
      })
    })
  })
})
