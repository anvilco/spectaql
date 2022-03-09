import { introspectionTypeToString } from './type-helpers'
import IntrospectionManipulator from 'microfiber'
import {
  introspectionArgsToVariables,
  introspectionQueryOrMutationToResponse,
} from '../lib/common'

export function generateQuery({
  prefix,
  field,
  introspectionResponse,
  graphQLSchema,
}) {
  const introspectionManipulator = new IntrospectionManipulator(
    introspectionResponse
  )
  const queryResult = generateQueryInternal({
    field,
    introspectionManipulator,
    introspectionResponse,
    graphQLSchema,
    depth: 1,
  })

  const argStr = queryResult.args
    .filter((item, pos) => queryResult.args.indexOf(item) === pos)
    .map((arg) => `$${arg.name}: ${introspectionTypeToString(arg.type)}`)
    .join(', ')

  const cleanedQuery = queryResult.query.replace(/ : [\w![\]]+/g, '')

  const query = `${prefix} ${field.name}${
    argStr ? `(${argStr})` : ''
  } {\n${cleanedQuery}}`

  const variables = introspectionArgsToVariables({
    args: queryResult.args,
    introspectionResponse,
    introspectionManipulator,
  })

  const response = {
    data: {
      [field.name]: introspectionQueryOrMutationToResponse({
        field,
        introspectionResponse,
        introspectionManipulator,
      }),
    },
  }

  return {
    query, // The Query/Mutation sring/markdown
    variables, // The Variables
    response, // The Response
  }
}

function generateQueryInternal({
  field,
  args = [],
  depth,
  // typeCounts = [],
  introspectionManipulator,
} = {}) {
  const { name } = field

  const space = '  '.repeat(depth)
  let queryStr = space + name

  // Clone the array
  const fieldArgs = [...args]

  // Only include arguments that should not be filtered out
  const argsStrPieces = []
  for (const arg of field.args || []) {
    fieldArgs.push(arg)
    argsStrPieces.push(`${arg.name}: $${arg.name}`)
  }

  // Only if top-level for now
  if (argsStrPieces.length > 0 && depth === 1) {
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
        args: fieldArgs,
      }
    }

    const subQuery = returnType.fields
      .map((childField) => {
        return generateQueryInternal({
          field: childField,
          // expandGraph,
          args: fieldArgs,
          depth: depth + 1,
          // typeCounts,
          // log,
          introspectionManipulator,
        }).query
      })
      .join('')

    queryStr += ` {\n${subQuery}${space}}`
  }

  return {
    query: queryStr + '\n',
    args: fieldArgs,
  }
}

export default generateQuery
