const {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
} = require('app/spectaql/graphql-loaders')

const pathToSimpleSchema = './test/fixtures/simple-schema.gql'
const pathToSimpleSchemaSupplement = './test/fixtures/simple-schema-supplement.txt'
const pathToNonStandardQueryMutationSchema = './test/fixtures/non-standard-query-mutation-schema.gql'

const generateIntrospectionQueryResult = ({
  schemaType = 'simple',
}) => {

  switch (schemaType) {
    case 'non-standard-query-mutation-schema': {
      const schema = loadSchemaFromSDLFile({ pathToFile: pathToNonStandardQueryMutationSchema })
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
  pathToNonStandardQueryMutationSchema,
}
