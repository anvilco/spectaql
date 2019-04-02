const generateExample = require("./generate-example")
const convertTypeToSchema = require("./convert-type")

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

module.exports = function (domains, graphQLSchema) {

    function composePath(tag, usecase) {
        const result = {}

        const operationId = usecase.name.replace(/ /g, '_').toLowerCase();

        const queryTokens = usecase.query.split(".");
        if (queryTokens.length < 2)
            throw new TypeError(`Domain: ${tag}. Usecase query '${usecase.query}' is not well formed.\nExpected 'query.<fieldName>' or 'mutation.<mutationName>'`)
        const typeDict = queryTokens[0] == "query" ?
            graphQLSchema.getQueryType() :
            graphQLSchema.getMutationType()

        var target = typeDict;
        queryTokens.forEach((token, i) => {
            if (i != 0)
                target = target.getFields()[token]
        });        

        const expandFields = usecase.expand ?
            usecase.expand.split(",").map(getExpandField) :
            []; // [] - expand nothing
        const selectFields = usecase.select ? usecase.select.split(" ") : null; // null = select all                
        expandFields.push({
            field: target.name,
            select: selectFields
        })

        var examples = generateExample(queryTokens[0].toLowerCase(), target, expandFields)

        const responseSchema = convertTypeToSchema(target.type);
        responseSchema.example = examples.schema;

        var args = examples.args ? examples.args.map(_ => ({
            name: _.name,
            description: _.description,
            in: "query",
            schema: convertTypeToSchema(_.type)
        })) : [];

        const bodyArg = { in: "body",
            example: examples.query,
            schema: args.length == 0 ?
                null :
                {
                    type: "object",
                    properties: args.reduce((cur, next) => {
                        cur[next.name] = Object.assign({}, next.schema)     
                        return cur;                   
                    }, {})
                }
        }

        args.push(bodyArg);

        result[operationId] = {
            post: {
                tags: [tag],
                summary: usecase.name,
                description: usecase.description,
                operationId: operationId,
                consumes: ["application/json"],
                produces: ["application/json"],
                parameters: args,
                responses: {
                    '200': {
                        description: "Successful operation",
                        schema: responseSchema
                    },
                }
            }
        }

        return result;
    }

    const paths = {}

    domains.forEach(domain => {
        domain.usecases.forEach(u => Object.assign(paths, composePath(domain.name, u)));
    });

    return paths
}