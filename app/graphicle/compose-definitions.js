const graphql = require('graphql')
const transform = require('graphql-json-schema');

module.exports = function(graphQLSchema) {
    const printedSchema = graphql.printSchema(graphQLSchema)

    const jsonSchema = transform(printedSchema)

    return jsonSchema.definitions;
}