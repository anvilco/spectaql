// const util = require('util')
const get = require('lodash.get')
const isEqual = require('lodash/isEqual')

const Introspection = require('app/lib/Introspection')
const {
  KIND_SCALAR,
  KIND_OBJECT,
  KIND_INPUT_OBJECT,
  KIND_ENUM,
} = Introspection

const {
  introspectionResponseFromSchemaSDL,
  graphQLSchemaFromIntrospectionResponse,
} = require('app/spectaql/graphql-loaders')

const {
  addMetadata
} = require('app/spectaql/metadata-loaders')


describe.only('Introspection', function () {
  def('QueryType', () => `type Query {
      myTypes: [MyType!]
    }`)

  def('schemaSDLBase', () => `

    # From the GraphQL docs:
    #
    # https://graphql.org/graphql-js/mutations-and-input-types/
    # Input types can't have fields that are other objects, only basic scalar types, list types,
    # and other input types.

    scalar SecretScalar

    input InputWithSecretScalar {
      string: String
      secretScalar: [SecretScalar]
    }

    enum SecretEnum {
      ENUM1
      ENUM2
      ENUM3
    }

    input InputWithSecretEnum {
      string: String
      secretEnum: [SecretEnum]
    }

    ${$.QueryType}

    type MyType {
      # The control
      fieldString(argString: String): String

      # Fields returning SecretScalar
      fieldSecretScalar: SecretScalar
      fieldSecretScalarArray: [SecretScalar]
      fieldSecretScalarNonNullArray: [SecretScalar]!
      fieldSecretScalarNonNullArrayOfNonNulls: [SecretScalar!]!

      # Fields with args containing SecretScalars
      fieldStringWithSecretScalarArg(
        argString: String,
        argSecretScalar: SecretScalar
      ): String

      fieldStringWithSecretScalarArrayArg(
        argString: String,
        argSecretScalar: [SecretScalar]
      ): String

      fieldStringWithSecretScalarNonNullArrayArg(
        argString: String,
        argSecretScalar: [SecretScalar]!
      ): String

      fieldStringWithSecretScalarNonNullArrayOfNonNullsArg(
        argString: String,
        argSecretScalar: [SecretScalar!]!
      ): String

      # Fields with Inputs that contain SecretScalar
      fieldWithSecretScalarInputArg(input: InputWithSecretScalar): String



      # Fields returning SecretEnum
      fieldSecretEnum: SecretEnum
      fieldSecretEnumArray: [SecretEnum]
      fieldSecretEnumNonNullArray: [SecretEnum]!
      fieldSecretEnumNonNullArrayOfNonNulls: [SecretEnum!]!

      # Fields with args containing SecretEnum
      fieldStringWithSecretEnumArg(
        argString: String,
        argSecretEnum: SecretEnum
      ): String

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

  def('rawResponse', () => introspectionResponseFromSchemaSDL({
    schemaSDL: $.schemaSDL
  }))

  def('response', () => addMetadata({
    introspectionQueryResponse: $.rawResponse,
    metadata: $.metadata,
    metadatasReadPath: $.metadatasPath,
    metadatasWritePath: $.metadatasPath,
  }))

  def('schema', () => $.response.__schema)

  beforeEach(function () {
    // const schema = $.schema

    // console.log({schema})
    // console.log($.schemaSDLBase)
  })

  it('works', function () {
    // const response = $.response
    console.log(JSON.stringify($.response))
    const introspection = new Introspection($.response)
    console.log(introspection.inputFieldsOfTypeMap)
    let response = introspection.getResponse()
    // console.log(util.inspect(response, {depth: null}))
    // console.log(JSON.stringify(response))
    // let result = introspection.removeType({ kind: })
    // delete response.__schema.queryType

    // Sanity checks
    expect(isEqual($.response, response)).to.be.true
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', response })).to.be.ok
    expect(findType({ kind: KIND_SCALAR, name: 'SecretScalar', response })).to.be.ok

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalar', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalarArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalarNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalarNonNullArrayOfNonNulls', response })).to.be.ok

    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarArg', argName: 'argSecretScalar', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarArrayArg', argName: 'argSecretScalar', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarNonNullArrayArg', argName: 'argSecretScalar', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarNonNullArrayOfNonNullsArg', argName: 'argSecretScalar', response })).to.be.ok

    expect(findInputFieldOnInputType({ typeName: 'InputWithSecretScalar', inputFieldName: 'secretScalar', response })).to.be.ok

    expect(findType({ kind: KIND_ENUM, name: 'SecretEnum', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnum', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArrayOfNonNulls', response })).to.be.ok

    // OK do some things

    introspection.removeType({ kind: KIND_SCALAR, name: 'SecretScalar' })
    response = introspection.getResponse()
    expect(isEqual($.response, response)).to.be.false

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', response })).to.be.ok
    expect(findType({ kind: KIND_SCALAR, name: 'SecretScalar', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalar', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalarArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalarNonNullArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretScalarNonNullArrayOfNonNulls', response })).to.not.be.ok

    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarArg', argName: 'argSecretScalar', response })).to.not.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarArrayArg', argName: 'argSecretScalar', response })).to.not.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarNonNullArrayArg', argName: 'argSecretScalar', response })).to.not.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretScalarNonNullArrayOfNonNullsArg', argName: 'argSecretScalar', response })).to.not.be.ok

    expect(findInputFieldOnInputType({ typeName: 'InputWithSecretScalar', inputFieldName: 'secretScalar', response })).to.not.be.ok

    expect(findType({ kind: KIND_ENUM, name: 'SecretEnum', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnum', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArrayOfNonNulls', response })).to.be.ok

    introspection.removeType({ kind: KIND_ENUM, name: 'SecretEnum' })
    response = introspection.getResponse()
    expect(isEqual($.response, response)).to.be.false

    expect(findType({ kind: KIND_ENUM, name: 'SecretEnum', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnum', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArrayOfNonNulls', response })).to.not.be.ok

    // console.log(introspection.inputFieldsOfTypeMap)
    console.log(JSON.stringify(response))
  })
})


function findType({ kind, name, response }) {
  return (response.__schema.types || []).find((type) => type.kind === kind && type.name === name)
}

function findFieldOnType({ typeKind, typeName, fieldName, response }) {
  const type = findType({ kind: typeKind, name: typeName, response })
  if (!type) {
    return false
  }
  return (type.fields || []).find((field) => field.name === fieldName)
}

function findArgOnFieldOnType({ typeKind, typeName, fieldName, argName, response }) {
  const field = findFieldOnType({ typeKind, typeName, fieldName, response })
  if (!field) {
    return false
  }
  return (field.args || []).find((arg) => arg.name === argName)
}

function findInputFieldOnInputType({ typeName, inputFieldName, response }) {
  const type = findType({ kind: KIND_INPUT_OBJECT, name: typeName, response })
  if (!type) {
    return false
  }

  return (type.inputFields || []).find((inputField => inputField.name === inputFieldName ))
}