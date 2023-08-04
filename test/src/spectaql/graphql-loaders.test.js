import {
  pathToSimpleSchema,
  pathToSimpleSchemaWithDirectives,
  pathToSimpleSchemaSupplement,
  pathToNonStandardQueryMutationSchema,
} from 'test/helpers'

import {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
  graphQLSchemaFromIntrospectionResponse,
} from 'dist/spectaql/graphql-loaders'

describe('graphql-loaders', function () {
  describe('loadSchemaFromSDLFile', function () {
    it('works with string .gql path', function () {
      const result = loadSchemaFromSDLFile({ pathToFile: pathToSimpleSchema })
      expect(result).to.be.ok
      const { schema, directables } = result
      expect(schema._typeMap.MyType.getFields()).to.have.property('myField')
      expect(schema._typeMap.MyType.getFields()).to.not.have.property(
        'mySupplementalField'
      )
      expect(directables).to.be.an('array').of.length(0)
    })

    it('works with string .txt path', function () {
      const result = loadSchemaFromSDLFile({
        pathToFile: pathToSimpleSchemaSupplement,
      })
      expect(result).to.be.ok
      expect(result).to.be.ok
      const { schema, directables } = result
      expect(schema._typeMap.MyType.getFields()).to.not.have.property('myField')
      expect(schema._typeMap.MyType.getFields()).to.have.property(
        'mySupplementalField'
      )
      expect(directables).to.be.an('array').of.length(0)
    })

    it('works with array of paths containing .gql and .txt', function () {
      const result = loadSchemaFromSDLFile({
        pathToFile: [pathToSimpleSchema, pathToSimpleSchemaSupplement],
      })
      expect(result).to.be.ok
      expect(result).to.be.ok
      const { schema, directables } = result
      expect(schema._typeMap.MyType.getFields()).to.have.property('myField')
      expect(schema._typeMap.MyType.getFields()).to.have.property(
        'mySupplementalField'
      )
      expect(directables).to.be.an('array').of.length(0)
    })

    it('works with @spectaql directive', function () {
      const result = loadSchemaFromSDLFile({
        pathToFile: pathToSimpleSchemaWithDirectives,
        spectaqlDirectiveOptions: {
          enable: true,
        },
      })
      expect(result).to.be.ok
      const { schema, directables } = result
      expect(schema._typeMap.MyType.getFields()).to.have.property('myField')
      expect(schema._typeMap.MyType.getFields()).to.not.have.property(
        'mySupplementalField'
      )
      expect(directables).to.be.an('array').of.length(24)
    })
  })

  describe('non-standard query or mutation type name', function () {
    it('works', async function () {
      const { schema, directables } = loadSchemaFromSDLFile({
        pathToFile: pathToNonStandardQueryMutationSchema,
      })
      expect(schema).to.be.ok
      const introspectionResponse = introspectionResponseFromSchema({ schema })
      expect(introspectionResponse).to.be.ok
      const graphQLSchema = graphQLSchemaFromIntrospectionResponse(
        introspectionResponse
      )
      expect(graphQLSchema).to.be.ok
      expect(directables).to.be.an('array').of.length(0)
    })
  })
})
