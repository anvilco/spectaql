const {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList
} = require("graphql")

const {
  introspectionTypeToString
} = require('./type-helpers')

const IntrospectionManipulator = require('../lib/Introspection')

const {
  introspectionArgToVariable
} = require('../lib/common')

function generateQueryInternal({
  field,
  // expandGraph,
  args = [],
  // allowedArgNames = [],
  depth,
  typeCounts = [],
  // examplesByArgName = {},
  // log = false,
  introspectionManipulator,
} = {}) {
  const {
    name,
  } = field

  const space = '  '.repeat(depth)
  let queryStr = space + name

  // Clone the array
  const fieldArgs = [...args];

  // Only include arguments that should not be filtered out
  const argsStrPieces = []
  for (const arg of (field.args || [])) {
    fieldArgs.push(arg)
    argsStrPieces.push(`${arg.name}: $${arg.name}`)
  }

  if (argsStrPieces.length > 0) {
    const argsStr = argsStrPieces.join(', ')
    queryStr += `(${argsStr})`
  }

  const returnType = introspectionManipulator.getType(
    IntrospectionManipulator.digUnderlyingType(field.type)
  )

  // If it is an expandable thing...i.e. not a SCALAR, take this path
  if (returnType.fields) {
    if (depth > 1) {
      return {
        query: `${queryStr} {\n${space}  ...${returnType.name}Fragment\n${space}}\n`,
        args: fieldArgs
      }
    }

    const subQuery = returnType.fields.map((childField) => {
      return generateQueryInternal({
        field: childField,
        // expandGraph,
        args: fieldArgs,
        depth: depth + 1,
        // typeCounts,
        // log,
        introspectionManipulator,
      }).query
    }).join("");

    queryStr += ` {\n${subQuery}${space}}`
  }

  return {
    query: queryStr + "\n",
    args: fieldArgs
  };
}

function generateResponseSchema({
  name,
  type,
  expandGraph,
  examplesByFieldName = {},
  depth,
}) {
  if (depth > 10) {
    return {
      type: "object"
    }
  }

  const defaultResponse = {
    // This will cause the Example Response field to have a better value, namely the Type's name, which is nice
    type: type.name,
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

function generateQuery({ prefix, field, introspectionResponse, graphQLSchema }) {
  console.log({
    prefix,
    field,
    introspectionResponse,
  })
  const {
    name,
    type,
  } = field

  const introspectionManipulator = new IntrospectionManipulator(introspectionResponse)

  // const responseDataSchema = generateResponseSchema({
  //   name,
  //   type,
  //   // expandGraph,
  //   // examplesByFieldName,
  //   depth: 1,
  // })

  const queryResult = generateQueryInternal({
    field,
    // expandGraph,
    // args: [],
    // allowedArgNames,
    depth: 1,
    introspectionManipulator,
    introspectionResponse,
    graphQLSchema,
  })

  console.log(JSON.stringify(queryResult))

  const argStr = queryResult.args
    .filter((item, pos) => queryResult.args.indexOf(item) === pos)
    .map(arg => `$${arg.name}: ${introspectionTypeToString(arg.type)}`)
    .join(', ')

  const cleanedQuery = queryResult.query.replace(/ : [\w![\]]+/g, "")

  const query = `${prefix} ${field.name}${argStr ? `(${argStr})` : ''} {\n${cleanedQuery}}`

  const variables = queryResult.args.length ? queryResult.args.reduce(
    (acc, arg) => {
      acc[arg.name] = introspectionArgToVariable({ arg, introspectionResponse, introspectionManipulator })
      return acc
    },
    {},
  ) : null

  const responseSchema = {
    type: "object",
    properties: {
      data: {
        type: "object",
        properties: {
          // [field.name]: responseDataSchema,
        },
      },
    },
  }

  return {
    query, // The Query/Mutation sring/markdown
    variables, // The Variables
    response: responseSchema, // The Response
  };
}


module.exports = generateQuery
