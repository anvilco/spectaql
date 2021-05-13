const {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
} = require('app/spectaql/graphql-loaders')

const pathToSimpleSchema = './test/fixtures/simple-schema.txt'

const generateIntrospectionQueryResult = ({
  schemaType = 'simple',
}) => {

  switch (schemaType) {
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
}
