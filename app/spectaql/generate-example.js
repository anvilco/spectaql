const {
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLList
} = require("graphql")

// const SCALARS = {
//     Int: 'integer',
//     Float: 'number',
//     String: 'string',
//     Boolean: 'boolean',
//     ID: 'string'
// };

function generateQueryInternal({
    field,
    expandGraph,
    args = [],
    allowedArgNames = [],
    depth,
    typeCounts = [],
    // examplesByArgName = {},
    // log = false,
} = {}) {
    const {
        name,
    } = field

    const space = '  '.repeat(depth)
    var queryStr = space + name

    // It's important to clone the array here. Otherwise we would
    // be pushing arguments into the array passed by reference,
    // which results in arguments from one query being incorrectly
    // shown on another query's example.
    const fieldArgs = [...args];

    // Only include arguments that should not be filtered out
    const argsStrPieces = []
    for (const arg of (field.args || [])) {
        if (!allowedArgNames.includes(arg.name)) {
            continue
        }
        fieldArgs.push(arg)
        argsStrPieces.push(`${arg.name}: $${arg.name}`)
    }

    if (argsStrPieces.length > 0) {
        const argsStr = argsStrPieces.join(', ')
        queryStr += `(${argsStr})`
    }

    var returnType = field.type;

    while (returnType.ofType) {
        returnType = returnType.ofType;
    }

    // if (log) {
    //     console.log(JSON.stringify({
    //         log,
    //         field,
    //         fieldArgs,
    //         returnType,
    //         // getFields: returnType.getFields(),
    //         expandGraph,
    //         depth,
    //     }))
    // }

    // If it is an expandable thing...i.e. not a SCALAR, take this path
    if (returnType.getFields) {
        var subQuery = null;
        const expandedField = expandGraph.find(_ => _.field == name)


        // If we should not expand it, but it's an expandable type, then just show this generic
        // query fragment placeholder
        if (!expandedField) {
            return {
                query: `${queryStr} {\n${space}  ...${returnType.name}Fragment\n${space}}\n`,
                args: fieldArgs
            }
        }

        // Check for recursive expansion
        if (depth > 1) {
            const typeKey = `${name}->${returnType.name}`;
            if (typeCounts.includes(typeKey)) {
                subQuery = space + "  ...Recursive" + returnType.name + "Fragment\n"
            }
            typeCounts.push(typeKey)
        }

        var childFields = returnType.getFields();
        var keys = Object.keys(childFields);
        const toExpand = expandGraph.map(_ => _.field);
        const toSelect = expandedField ? expandedField.select : null;

        // Preprare to go through things that we want to expand
        keys = toSelect ? keys.filter(key => toSelect.includes(key) || toExpand.includes(key)) : keys;

        let log = false
        // if (['foo'].includes(field.name)) {
        //     log = true
        //     console.log('\n\n\n\n',JSON.stringify({
        //         generateQueryInternal: true,
        //         field,
        //         fieldArgs,
        //         expandGraph,
        //         expandedField,
        //         typeCounts,
        //         childFields,
        //         toExpand,
        //         toSelect,
        //         subQuery,
        //         keys,
        //         depth,
        //     }))
        // }

        subQuery = subQuery || keys.map(key => {
            return generateQueryInternal({
                field: childFields[key],
                expandGraph,
                args: fieldArgs,
                depth: depth + 1,
                typeCounts,
                log,
            }).query
        }).join("");

        queryStr += ` {\n${subQuery}${space}}`
    }

    return {
        query: queryStr + "\n",
        args: fieldArgs
    };
}

function generateResponseSchema({ name, type, expandGraph, examplesByFieldName = {}, depth }) {
    if (depth > 10) {
        return {
            type: "object"
        }
    }

    const {
        name: typeName,
    } = type

    // Log things with examples...for debugging fun
    // if (examplesByFieldName[name]) {
    //     console.log({
    //         name,
    //         type,
    //         // typeName,
    //         examplesByFieldName,
    //         expandGraph,
    //     })
    // }

    const defaultResponse = {
        // type: SCALARS[type.name],
        // This will cause the Example Response field to have a better value, namely the Type's name, which is nice
        type: typeName,
        // ...unless we have an example to use, then it will be used instead...which is nicer
        // type: examplesByFieldName[name] || typeName,
        example: examplesByFieldName[name],
    }

    const expandedField = expandGraph.find(_ => _.field == name)

    // Is this a complex/non-Scalar/expandable type?
    if (type instanceof GraphQLObjectType) {
        // Nothing more to expand? Then just send back the default
        if (!expandedField) {
            return defaultResponse
        }

        const result = {
            type: "object",
        }

        const fields = type.getFields()

        let keys = Object.keys(fields);

        const toExpand = expandGraph.map(_ => _.field)

        const toSelect = expandedField ? expandedField.select : null;

        keys = toSelect ? keys.filter(key => toSelect.includes(key) || toExpand.includes(key)) : keys;

        result.properties = keys.reduce((p, key) => {
            var schema = generateResponseSchema({
                name: key,
                type: fields[key].type,
                expandGraph: expandGraph.filter(_=>_ !== expandedField),
                examplesByFieldName,
                depth: depth + 1,
            })
            if (schema)
                p[key] = schema;

            return p;
        }, {})

        return result;
    }

    if (type instanceof GraphQLNonNull) {
        return generateResponseSchema({
            name,
            type: type.ofType,
            expandGraph,
            examplesByFieldName,
            depth: depth + 1,
        })
    }

    if (type instanceof GraphQLList) {
        var schema = generateResponseSchema({
            name,
            type: type.ofType,
            expandGraph,
            examplesByFieldName,
            depth, // do not increment depth
        })

        return schema ? {
            type: 'array',
            items: schema
        } : null;
    }

    return defaultResponse
}

function generateQuery({ parentType, field, allowedArgNames, expandGraph, examplesByFieldName }) {
    const {
        name,
        type,
    } = field

    const responseDataSchema = generateResponseSchema({ name, type, expandGraph, examplesByFieldName, depth: 1 })

    const queryResult = generateQueryInternal({
        field,
        expandGraph,
        args: [],
        allowedArgNames,
        depth: 1,
    })

    const argStr = queryResult.args
        .filter((item, pos) => queryResult.args.indexOf(item) === pos)
        .map(arg => `$${arg.name}: ${arg.type}`)
        .join(', ')

    const cleanedQuery = queryResult.query.replace(/ : [\w![\]]+/g, "")

    const query = `${parentType} ${field.name}${argStr ? `(${argStr})` : ''} {\n${cleanedQuery}}`

    const responseSchema = {
        type: "object",
        properties: {
            data: {
                type: "object",
                properties: {
                    [field.name]: responseDataSchema,
                },
            },
        },
    }

    return {
        query, // The Query/Mutation sring/markdown
        args: queryResult.args, // The Variables
        schema: responseSchema, // The Response
    };
}


module.exports = generateQuery
