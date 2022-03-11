const path = require('path')
const {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
} = require('dist/spectaql/graphql-loaders')

const pathToSimpleSchema = path.resolve(
  __dirname,
  './fixtures/simple-schema.gql'
)
// For now, let's use the example schema as the complex one...I'm always adding things in there
// anyways to make sure they work
const pathToComplexSchema = path.resolve(
  __dirname,
  '../examples/data/schema.gql'
)
const pathToSimpleSchemaSupplement = path.resolve(
  __dirname,
  './fixtures/simple-schema-supplement.txt'
)
const pathToNonStandardQueryMutationSchema = path.resolve(
  __dirname,
  './fixtures/non-standard-query-mutation-schema.gql'
)

const generateIntrospectionQueryResult = ({ schemaType = 'simple' }) => {
  switch (schemaType) {
    case 'non-standard-query-mutation-schema': {
      const schema = loadSchemaFromSDLFile({
        pathToFile: pathToNonStandardQueryMutationSchema,
      })
      return introspectionResponseFromSchema({ schema })
    }
    case 'complex': {
      const schema = loadSchemaFromSDLFile({ pathToFile: pathToComplexSchema })
      return introspectionResponseFromSchema({ schema })
    }
    case 'simple':
    default: {
      const schema = loadSchemaFromSDLFile({ pathToFile: pathToSimpleSchema })
      return introspectionResponseFromSchema({ schema })
    }
  }
}

module.exports = {
  generateIntrospectionQueryResult,
  pathToSimpleSchema,
  pathToSimpleSchemaSupplement,
  pathToComplexSchema,
  pathToNonStandardQueryMutationSchema,
}
