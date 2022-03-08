const _ = require('lodash')

const generateQuery = require("./generate-example")
const { digNonNullTypeGraphQL, convertGraphQLType } = require("./type-helpers")

function getExpandField(expandNotation) {
    const subExpandIndex = expandNotation.indexOf("(")

    var result = {
        field: subExpandIndex == -1 ? expandNotation : expandNotation.substring(0, subExpandIndex),
        select: subExpandIndex == -1 ?
            null :
            expandNotation.substring(subExpandIndex + 1, expandNotation.length - 1).split(" ")
    }

    return result;
}

function sortByProperty (property) {
    return ({[property]: a}, {[property]: b}) => (
        (a > b) ? 1 : ((a < b) ? -1 : 0)
    )
}

// Take the domains, etc, and return a Swagger-compliant-esque `paths` thing.
// In the GraphQL case, this makes all the Queries and Mutations stuff happen.
module.exports = function composePaths ({ domains, graphQLSchema, jsonSchema, scalarGraphql }) {
    const {
        properties,
        // definitions,
    } = jsonSchema

    // This is a bit of a crazy way to write this, but basically we are just defining
    // and identifying the way that Query and Mutation are defined in the provided
    // GraphQL schema. It's not necessarily under 'Query' and 'Mutation' names...but
    // probably is.
    const {
        graphQLQueryType,
        graphQLQueryType: {
            name: graphQLQueryTypeName,
        },
        graphQLMutationType,
        graphQLMutationType: {
            name: graphQLMutationTypeName,
        },
    } = {
        graphQLQueryType: graphQLSchema.getQueryType() || {},
        graphQLMutationType: graphQLSchema.getMutationType() || {},
    }

    // The processing of Queries is the same as the processing of Mutations, except for a few names
    // and paths of things. This map will help us to extract and define these variables easily
    // depending on if it's a Query vs Mutation
    const queryOrMutationNameToThingsWeNeed = {
        [graphQLQueryTypeName]: {
            plural: 'Queries',
            path: 'query',
            gqlType: graphQLQueryType,
        },
        [graphQLMutationTypeName]: {
            plural: 'Mutations',
            path: 'mutation',
            gqlType: graphQLMutationType,
        },
    }

    // This code will find the Query or Mutation object, and then create paths for every query or
    // mutation they contain...as long as the metadata has not instructed them to NOT be documented.
    //
    // Go through all the properties of the JSON schema (read: GraphQL types) looking for the Query
    // or Mutation type(s).
    domains = Object.entries(properties).reduce(
        (domains, [queryOrMutationName, def]) => {
            const {
                plural: pluralName,
                path: pathName,
                gqlType,
            } = (queryOrMutationNameToThingsWeNeed[queryOrMutationName] || {})

            // If this didn't come out in the map, then it's not a Query or Mutation type
            // so just move along.
            if (!pluralName) {
                return domains
            }

            const {
                description,
                properties: queriesOrMutations,
            } = def

            if (_.isEmpty(queriesOrMutations)) {
                return domains
            }

            // A "domain" acts like a group of things together. In this case we want to group all
            // queries into a Queries domain...and all mutations into a Mutations domain.
            const domain = {
                name: pluralName,
                description,
                // Each usecase is an actual query or mutation to display
                usecases: Object.entries(queriesOrMutations).map(([name, def]) => {
                    const {
                        description,
                    } = def

                    // Get the GraphQLField that represents this Query/Mutation
                    const gqlField = gqlType.getFields()[name] || {}
                    // Get its return type so that we can figure out what fields to put in the example.
                    const returnTypeName = (digNonNullTypeGraphQL(gqlField.type) || {}).name
                    // Get the properties for that return type. If the return type is not documented, this will
                    // be undefined
                    const returnTypeProperties = _.get(jsonSchema, `definitions.${returnTypeName}.properties`)

                    // Let's select all the fields that are in the JSON Schema (and therefore were not sripped
                    // out by documentation metadata instructions)
                    const select = returnTypeProperties ? Object.keys(returnTypeProperties) : null

                    // For building up a map of response type fields to their examples
                    const examplesByFieldName = {}

                    // Build up a map of query/mutation arguments to their examples
                    const {
                        allowedArgNames,
                        examplesByArgName,
                        defaultsByArgName,
                    } = Object.entries(_.get(def, 'properties.arguments.properties') || {}).reduce(
                        (acc, [name, { example, default: dfault }]) => {
                            // If it's still in the schema, then it's not supposed to be hidden
                            acc.allowedArgNames.push(name)

                            if (typeof example !== 'undefined') {
                                acc.examplesByArgName[name] = example
                            }

                            if (typeof dfault !== 'undefined') {
                                acc.defaultsByArgName[name] = dfault
                            }

                            return acc
                        },
                        {
                            allowedArgNames: [],
                            examplesByArgName: {},
                            defaultsByArgName: {},
                        }
                    )

                    if (returnTypeProperties && select && select.length) {
                        // Go through each field in the response type and look for an example to add
                        // to the map
                        select.forEach((fieldName) => {
                            // On Fields, examples have been placed in their Return types/schemas
                            const example = _.get(returnTypeProperties, `${fieldName}.properties.return.example`)
                            if (example) {
                                examplesByFieldName[fieldName] = example
                            }
                        })
                    }

                    // This helps control what exapandable, non-SCALAR things we should expand...and how we should
                    // expand them. Support is a bit weak and hard to follow, so for now we'll leave this out
                    // and not pass it along, but this is a good start to what things might look like.
                    //
                    // Things currently "work" because everything in the top-level response type gets put
                    // into the `selects`, and that will display at least the top-level, so this isn't necessary
                    // to make things look "OK"
                    //
                    // eslint-disable-next-line no-unused-vars
                    // const expand = typeof _.get(gqlField, 'type.getFields') === 'function'
                    //     ? Object.values(gqlField.type.getFields()).reduce(
                    //         (acc, field) => {
                    //             const {
                    //                 name,
                    //                 type,
                    //             } = field

                    //             if (typeof type.getFields === 'function') {
                    //                 // Maybe also filter the 'select' by the fields that are in the returnTypeProperties?
                    //                 // They will presumably have already respected the undocumentedness.
                    //                 //
                    //                 // Note to self on the above statement: I think it is already done.
                    //                 acc.push({
                    //                     field: name,
                    //                     select: Object.keys(type.getFields()),
                    //                 })
                    //             }

                    //             return acc
                    //         },
                    //         [],
                    //     )
                    //     : []

                    // OK, so let's put together this usecase and return it!
                    const usecase = {
                        name,
                        description,
                        select,
                        // The world is not ready for this, but it will be back some day?
                        // expand,
                        query: [pathName, name].join('.'),
                        allowedArgNames,
                        examplesByFieldName,
                        examplesByArgName,
                        defaultsByArgName,
                    }

                    return usecase
                }).sort(sortByProperty('name'))
            }

            // Add this domain
            domains.push(domain)

            return domains
        },
        [],
    )

    const paths = []

    domains.forEach(domain => {
        domain.usecases.forEach(u => paths.push(composePath(domain.name, u)));
    });

    return paths

    function composePath(tag, usecase) {
        const {
            name,
            query,
            description,
            select,
            // expand,
            allowedArgNames,
            examplesByFieldName,
            examplesByArgName,
            defaultsByArgName,
        } = usecase

        const operationId = name.replace(/ /g, '_').toLowerCase();

        const queryTokens = query.split(".");
        if (queryTokens.length < 2) {
            throw new TypeError(`Domain: ${tag}. Usecase query '${usecase.query}' is not well formed.\nExpected 'query.<fieldName>' or 'mutation.<mutationName>'`)
        }

        const typeDict = queryTokens[0] == "query" ?
            graphQLSchema.getQueryType() :
            graphQLSchema.getMutationType()

        var target = typeDict;

        queryTokens.forEach((token, i) => {
            if (i != 0) {
                target = target.getFields()[token]
            }
        });

        const expandFields = []

        // This is not currently going to be passed to us yet
        // if (expand) {
        //     if (Array.isArray(expand)) {
        //         // If we do things, it will be an array already
        //         expandFields.push(...expand)
        //     } else {
        //         // Original code did this below. I cannot understand how the heck getExpandField
        //         // did its job properly
        //         expandFields.push(...expand.split(",").map(getExpandField))
        //     }
        // }

        // What fields to put into the select example? Original code split a string, but we can do
        // better...but will still leave this supporting code for now.
        const selectFields = select
            ? (
                Array.isArray(select)
                ? select
                : select.split(" ")
            )
            : null; // null = select all

        // Add the query/mutation itself to the expansions so that we at least get the top-level stuff
        // by default.
        expandFields.push({
            field: target.name,
            select: selectFields
        })


        // This `generateQuery` call does A LOT of important stuff
        const exampleData = generateQuery({
            parentType: queryTokens[0].toLowerCase(),
            field: target,
            expandGraph: expandFields,
            examplesByFieldName,
            allowedArgNames,
            scalarGraphql
        })

        const responseSchema = {
            ...convertGraphQLType(target.type).schema,
            example: exampleData.schema,
        }

        const args = exampleData.args ? exampleData.args.map(_ => ({
            in: "query",
            name: _.name,
            description: _.description,
            isDeprecated: _.isDeprecated,
            deprecationReason: _.deprecationReason,
            schema: {
                ...convertGraphQLType(_.type).schema,
                example: examplesByArgName[_.name],
                default: defaultsByArgName[_.name],
            },
        })) : [];

        const bodyArg = {
            in: "body",
            example: exampleData.query,
            schema: args.length == 0 ?
                null :
                {
                    type: "object",
                    properties: args.reduce(
                        (cur, next) => {
                            cur[next.name] = Object.assign({}, next.schema)
                            return cur;
                        },
                        {},
                    ),
                }
        }

        args.push(bodyArg);

        return {
            post: {
                tags: [tag],
                summary: name,
                description: description,
                isDeprecated: target.isDeprecated,
                deprecationReason: target.deprecationReason,
                operationId: operationId,
                // Display some dumb stuff about the request format?
                // consumes: ["application/json"],
                // Display some dumb stuff about the response format?
                // produces: ["application/json"],
                parameters: args,
                responses: {
                    '200': {
                        // TODO: figure out how to get return type descriptions in there
                        // description: "Successful operation",
                        schema: responseSchema
                    },
                }
            }
        }
    }
}
