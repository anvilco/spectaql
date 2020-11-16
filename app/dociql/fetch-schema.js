const graphql = require('graphql')
const request = require("sync-request")

const converter = require('graphql-2-json-schema');

module.exports = function (graphUrl, authHeader) {

    const requestBody = {
        query: graphql.introspectionQuery
    };

    const responseBody = request("POST", graphUrl, {
        headers: {
            authorization: authHeader,
        },
        json: requestBody
    }).getBody('utf8');

    const introspectionResponse = JSON.parse(responseBody);    

    const jsonSchema = converter.fromIntrospectionQuery(introspectionResponse.data);
    const graphQLSchema = graphql.buildClientSchema(introspectionResponse.data, { assumeValid: true});

    return {
        jsonSchema,
        graphQLSchema
    }
}