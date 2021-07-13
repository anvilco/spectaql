const {
  pathToSimpleSchema,
  pathToSimpleSchemaSupplement,
} = require('test/helpers')

const {
  loadSchemaFromSDLFile,
} = require('app/spectaql/graphql-loaders')

describe('graphql-loaders', function () {
  describe('loadSchemaFromSDLFile', function () {
    it('works with string .gql path', function () {
      const result = loadSchemaFromSDLFile({ pathToFile: pathToSimpleSchema })
      expect(result).to.be.ok
      expect(result._typeMap.MyType.getFields()).to.have.property('myField')
      expect(result._typeMap.MyType.getFields()).to.not.have.property('mySupplementalField')
    })

    it('works with string .txt path', function () {
      const result = loadSchemaFromSDLFile({ pathToFile: pathToSimpleSchemaSupplement })
      expect(result).to.be.ok
      expect(result._typeMap.MyType.getFields()).to.not.have.property('myField')
      expect(result._typeMap.MyType.getFields()).to.have.property('mySupplementalField')
    })

    it('works with array of paths containing .gql and .txt', function () {
      const result = loadSchemaFromSDLFile({ pathToFile: [pathToSimpleSchema, pathToSimpleSchemaSupplement] })
      expect(result).to.be.ok
      expect(result._typeMap.MyType.getFields()).to.have.property('myField')
      expect(result._typeMap.MyType.getFields()).to.have.property('mySupplementalField')
    })
  })
})
