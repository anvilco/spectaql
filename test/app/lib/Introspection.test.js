const isEqual = require('lodash/isEqual')

const Introspection = require('app/lib/Introspection')
const {
  KIND_SCALAR,
  KIND_OBJECT,
  KIND_INPUT_OBJECT,
  KIND_UNION,
  KIND_ENUM,
} = Introspection

const {
  introspectionResponseFromSchemaSDL,
} = require('app/spectaql/graphql-loaders')

const {
  addMetadata
} = require('app/spectaql/metadata-loaders')


describe.only('Introspection', function () {
  def('QueryType', () => `type Query {
      myTypes: [MyType!]
    }`)

  def('MutationType', () => `type Mutation {
      createYetAnotherType(name: String!): YetAnotherType!
    }`)

  def('schemaSDLBase', () => `

    # From the GraphQL docs:
    #
    # https://graphql.org/graphql-js/mutations-and-input-types/
    # Input types can't have fields that are other objects, only basic scalar types, list types,
    # and other input types.

    scalar SecretScalar

    enum SecretEnum {
      ENUM1
      ENUM2
      ENUM3
    }

    input InputWithSecretScalar {
      string: String
      secretScalar: [SecretScalar]
    }

    input InputWithSecretEnum {
      string: String
      secretEnum: [SecretEnum]
    }

    union SecretUnion =
      MyType
      | MyOtherType

    ${$.QueryType}

    ${$.MutationType}

    type MyType {
      # The control
      fieldString(argString: String): String

      # SecretScalar stuff

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


      # SecretEnum stuff

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

      fieldStringWithSecretEnumArrayArg(
        argString: String,
        argSecretEnum: [SecretEnum]
      ): String

      fieldStringWithSecretEnumNonNullArrayArg(
        argString: String,
        argSecretEnum: [SecretEnum]!
      ): String

      fieldStringWithSecretEnumNonNullArrayOfNonNullsArg(
        argString: String,
        argSecretEnum: [SecretEnum!]!
      ): String


      # SecretUnion stuff

      # Fields returning SecretUnion
      fieldSecretUnion: SecretUnion
      fieldSecretUnionArray: [SecretUnion]
      fieldSecretUnionNonNullArray: [SecretUnion]!
      fieldSecretUnionNonNullArrayOfNonNulls: [SecretUnion!]!
    }

    type MyOtherType {
      fieldString(argString: String): String
    }

    type YetAnotherType {
      fieldString: String
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

  it.only('works', function () {
    const introspection = new Introspection($.response)
    let response = introspection.getResponse()

    // Sanity checks
    expect(isEqual($.response, response)).to.be.true
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok

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

    let secretEnum = findType({ kind: KIND_ENUM, name: 'SecretEnum', response })
    expect(secretEnum).to.be.ok
    expect(secretEnum.enumValues).to.be.an('array').of.length(3)

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnum', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArrayOfNonNulls', response })).to.be.ok

    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumArg', argName: 'argSecretEnum', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumArrayArg', argName: 'argSecretEnum', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumNonNullArrayArg', argName: 'argSecretEnum', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumNonNullArrayOfNonNullsArg', argName: 'argSecretEnum', response })).to.be.ok


    expect(findType({ kind: KIND_UNION, name: 'SecretUnion', response})).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnion', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArrayOfNonNulls', response })).to.be.ok

    // OK, let's do some things

    // Remove SecretScalar
    introspection.removeType({ kind: KIND_SCALAR, name: 'SecretScalar' })
    response = introspection.getResponse()
    expect(isEqual($.response, response)).to.be.false
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok

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

    // Remove a specific SecretEnum value

    secretEnum = findType({ kind: KIND_ENUM, name: 'SecretEnum', response })
    expect(secretEnum).to.be.ok
    expect(secretEnum.enumValues).to.be.an('array').of.length(3)

    introspection.removeEnumValue({ name: 'SecretEnum', value: 'ENUM2' })
    response = introspection.getResponse()
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok

    // Removed that value so only 2 left
    secretEnum = findType({ kind: KIND_ENUM, name: 'SecretEnum', response })
    expect(secretEnum).to.be.ok
    expect(secretEnum.enumValues).to.be.an('array').of.length(2)

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnum', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArrayOfNonNulls', response })).to.be.ok

    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumArg', argName: 'argSecretEnum', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumArrayArg', argName: 'argSecretEnum', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumNonNullArrayArg', argName: 'argSecretEnum', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumNonNullArrayOfNonNullsArg', argName: 'argSecretEnum', response })).to.be.ok


    // Remove SecretEnum completely

    introspection.removeType({ kind: KIND_ENUM, name: 'SecretEnum' })
    response = introspection.getResponse()
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok

    expect(findType({ kind: KIND_ENUM, name: 'SecretEnum', response })).to.not.be.ok

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnum', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretEnumNonNullArrayOfNonNulls', response })).to.not.be.ok

    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumArg', argName: 'argSecretEnum', response })).to.not.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumArrayArg', argName: 'argSecretEnum', response })).to.not.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumNonNullArrayArg', argName: 'argSecretEnum', response })).to.not.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldStringWithSecretEnumNonNullArrayOfNonNullsArg', argName: 'argSecretEnum', response })).to.not.be.ok

    // Remove an Arg from a Field

    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', argName: 'argString', response })).to.be.ok
    introspection.removeArg({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', argName: 'argString' })
    response = introspection.getResponse()
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok
    expect(findArgOnFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', argName: 'argString', response })).to.not.be.ok

    // Remove a Field from a Type

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', response })).to.be.ok
    introspection.removeField({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString' })
    response = introspection.getResponse()
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldString', response })).to.not.be.ok

    // Remove possible type from a Union Type

    let unionType = findType({ kind: KIND_UNION, name: 'SecretUnion', response })
    expect(unionType).to.be.ok
    expect(unionType.possibleTypes).to.be.an('array').of.length(2)

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnion', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArrayOfNonNulls', response })).to.be.ok

    introspection.removePossibleTypesOfType({ kind: KIND_OBJECT, name: 'MyType' })
    response = introspection.getResponse()
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok

    unionType = findType({ kind: KIND_UNION, name: 'SecretUnion', response })
    expect(unionType).to.be.ok
    expect(unionType.possibleTypes).to.be.an('array').of.length(1)
    // Only MyOtherType is left
    expect(unionType.possibleTypes.map((possibleType) => possibleType.name)).to.eql(['MyOtherType'])

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnion', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArray', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArrayOfNonNulls', response })).to.be.ok

    // Remove a Union Type completely

    introspection.removeType({ kind: KIND_UNION, name: 'SecretUnion' })
    response = introspection.getResponse()
    expect(findType({ kind: KIND_OBJECT, name: 'Query', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'Mutation', response })).to.be.ok

    expect(findType({ kind: KIND_UNION, name: 'SecretUnion', response})).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnion', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArray', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'MyType', fieldName: 'fieldSecretUnionNonNullArrayOfNonNulls', response })).to.not.be.ok

    // Remove the myTypes Query...which should remove MyType as well now that there are no references to it

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'Query', fieldName: 'myTypes', response })).to.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'MyType', response })).to.be.ok

    introspection.removeQuery({ name: 'myTypes' })
    response = introspection.getResponse()

    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'Query', fieldName: 'myTypes', response })).to.not.be.ok
    expect(findType({ kind: KIND_OBJECT, name: 'MyType', response })).to.not.be.ok

    // Remove YetAnotherType...which should remove the createYetAnotherType Mutation as well now that there are no
    // references to it

    expect(findType({ kind: KIND_OBJECT, name: 'YetAnotherType', response })).to.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'Mutation', fieldName: 'createYetAnotherType', response })).to.be.ok

    introspection.removeType({ kind: KIND_OBJECT, name: 'YetAnotherType' })
    response = introspection.getResponse()

    expect(findType({ kind: KIND_OBJECT, name: 'YetAnotherType', response })).to.not.be.ok
    expect(findFieldOnType({ typeKind: KIND_OBJECT, typeName: 'Mutation', fieldName: 'createYetAnotherType', response })).to.not.be.ok

    // console.log(introspection.inputFieldsOfTypeMap)
    // console.log(JSON.stringify(response))
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
