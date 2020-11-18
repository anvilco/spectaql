const {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
} = require('app/spectaql/graphql-loaders')

const generateIntrospectionQueryResult = ({
  schemaType = 'simple',
}) => {

  switch (schemaType) {
    case 'simple':
    default: {
      const schema = loadSchemaFromSDLFile({ pathToFile: './test/fixtures/simple-schema.txt' })
      return introspectionResponseFromSchema({ schema })
    }
  }
}

module.exports = {
  generateIntrospectionQueryResult,
}
