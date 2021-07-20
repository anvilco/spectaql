// This will use the "schema.gql" + "metadata.json" as the source of truth, and
// generate various other possible input examples that should all result in the
// same starting point for the documentation
const path = require('path')
const fs = require('fs')

const root = path.resolve(__dirname, '..')
const pathToExamplesDir = path.resolve(root, 'examples/data')

const pathToExampleSchema = path.resolve(pathToExamplesDir, 'schema.gql')
const pathToMetadata = path.resolve(pathToExamplesDir, 'metadata.json')

const pathToIntrospectionWithMetadata = path.resolve(pathToExamplesDir, 'introspection-with-metadata.json')
const pathToIntrospectionWithoutMetadata = path.resolve(pathToExamplesDir, 'introspection-without-metadata.json')

const {
  loadSchemaFromSDLFile,
  introspectionResponseFromSchema,
} = require('../app/spectaql/graphql-loaders')

const {
  addMetadataFromFile
} = require('../app/spectaql/metadata-loaders')

const schema = loadSchemaFromSDLFile({ pathToFile: pathToExampleSchema })
const introspectionResponse = introspectionResponseFromSchema({ schema })

if (introspectionResponse.errors) {
  console.error(introspectionResponse.errors)
  throw new Error('Problem with Introspection Query Response')
}

fs.writeFileSync(pathToIntrospectionWithoutMetadata, JSON.stringify(introspectionResponse, null, 4))

addMetadataFromFile({
  pathToFile: pathToMetadata,
  introspectionQueryResponse: introspectionResponse,
  metadatasReadPath: 'documentation',
  metadatasWritePath: 'documentation',
})

fs.writeFileSync(pathToIntrospectionWithMetadata, JSON.stringify(introspectionResponse, null, 4))

console.log("Done!")
