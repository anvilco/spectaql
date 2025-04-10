import { introspectionTypeToString } from './type-helpers'
import { KINDS, Microfiber as IntrospectionManipulator } from 'microfiber'
import {
  introspectionArgsToVariables,
  introspectionQueryOrMutationToResponse,
} from '../lib/common'
import {
  capitalizeFirstLetter,
  capitalize,
  camelCase,
  snakeCase,
  upperCase,
  lowerCase,
} from './utils'

const QUERY_NAME_STRATEGY_NONE = 'none'
const QUERY_NAME_STRATEGY_CAPITALIZE_FIRST = 'capitalizeFirst'
const QUERY_NAME_STRATEGY_CAPITALIZE = 'capitalize'
const QUERY_NAME_STRATEGY_CAMELCASE = 'camelCase'
const QUERY_NAME_STRATEGY_SNAKECASE = 'snakeCase'
const QUERY_NAME_STRATEGY_UPPERCASE = 'upperCase'
const QUERY_NAME_STRATEGY_LOWERCASE = 'lowerCase'

// Create a sane/friendly indentation of args based on how many there are, and the depth
function friendlyArgsString({ args, depth }) {
  if (!args.length) {
    return ''
  }
  const outerSpace = '  '.repeat(depth)
  let argsStr
  if (args.length === 1) {
    argsStr = args[0]
    return `(${argsStr})`
  } else {
    argsStr = '\n'
    const innerSpace = '  '.repeat(depth + 1)
    argsStr += args.map((piece) => innerSpace + piece).join(',\n')
    argsStr += '\n'
    return `(${argsStr}${outerSpace})`
  }
}

export function generateQuery({
  prefix,
  field,
  introspectionResponse,
  graphQLSchema,
  extensions,
  queryNameStrategy,
  allOptions,
}) {
  let fieldExpansionDepth =
    allOptions?.specData?.introspection?.fieldExpansionDepth
  if (typeof fieldExpansionDepth === 'undefined') {
    fieldExpansionDepth = 1
  }
  const introspectionManipulator = new IntrospectionManipulator(
    introspectionResponse
  )

  const queryResult = generateQueryInternal({
    field,
    introspectionManipulator,
    introspectionResponse,
    graphQLSchema,
    fieldExpansionDepth,
    depth: 1,
  })

  const args = queryResult.args
    .filter((item, pos) => queryResult.args.indexOf(item) === pos)
    .map((arg) => `$${arg.name}: ${introspectionTypeToString(arg.type)}`)

  const argStr = friendlyArgsString({ args, depth: 0 })

  const cleanedQuery = queryResult.query.replace(/ : [\w![\]]+/g, '')

  let queryName = field.name
  if (!queryNameStrategy || queryNameStrategy === QUERY_NAME_STRATEGY_NONE) {
    // no op
  } else if (queryNameStrategy === QUERY_NAME_STRATEGY_CAPITALIZE_FIRST) {
    queryName = capitalizeFirstLetter(queryName)
  } else if (queryNameStrategy === QUERY_NAME_STRATEGY_CAPITALIZE) {
    queryName = capitalize(queryName)
  } else if (queryNameStrategy === QUERY_NAME_STRATEGY_CAMELCASE) {
    queryName = camelCase(queryName)
  } else if (queryNameStrategy === QUERY_NAME_STRATEGY_SNAKECASE) {
    queryName = snakeCase(queryName)
  } else if (queryNameStrategy === QUERY_NAME_STRATEGY_UPPERCASE) {
    queryName = upperCase(queryName)
  } else if (queryNameStrategy === QUERY_NAME_STRATEGY_LOWERCASE) {
    queryName = lowerCase(queryName)
  }

  const query = `${prefix} ${queryName}${
    argStr ? `${argStr}` : ''
  } {\n${cleanedQuery}}`

  const variables = introspectionArgsToVariables({
    args: queryResult.args,
    introspectionResponse,
    introspectionManipulator,
    extensions,
  })

  const response = {
    data: {
      [field.name]: introspectionQueryOrMutationToResponse({
        field,
        introspectionResponse,
        introspectionManipulator,
        extensions,
      }),
    },
  }

  return {
    query, // The Query/Mutation string/markdown
    variables, // The Variables
    response, // The Response
  }
}

function generateQueryInternal({
  field,
  args = [],
  fieldExpansionDepth,
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
    queryStr += friendlyArgsString({ args: argsStrPieces, depth })
  }

  const returnType = introspectionManipulator.getType(
    IntrospectionManipulator.digUnderlyingType(field.type)
  )

  // Unions get inline fragments for each possibleType
  if (returnType.kind === KINDS.UNION) {
    try {
      const subQuery = returnType.possibleTypes
        .map((possibleType) => {
          const returnType = introspectionManipulator.getType(possibleType)
          const subQuery = generateQueryInternal({
            field: {
              name: returnType.name,
              type: possibleType,
            },
            fieldExpansionDepth,
            depth: depth + 1,
            introspectionManipulator,
          }).query
          return `${space}  ... on ${subQuery.trim()}`
        })
        .join('\n')

      queryStr += ` {\n${subQuery}\n${space}}`
    } catch (err) {
      console.warn('Problem generating inline fragments for UNION type.')
      console.warn(
        'Please file an issue with SpectaQL at https://github.com/anvilco/spectaql/issues'
      )
      console.warn('The error:')
      console.warn(err)
    }
  }

  // If it is an expandable thing...i.e. not a SCALAR, take this path
  else if (returnType?.fields?.length) {
    if (depth > fieldExpansionDepth) {
      return {
        query: `${queryStr} {\n${space}  ...${returnType.name}Fragment\n${space}}\n`,
        args: fieldArgs,
      }
    }

    const subQuery = returnType.fields
      .map((childField) => {
        return generateQueryInternal({
          field: childField,
          args: fieldArgs,
          fieldExpansionDepth,
          depth: depth + 1,
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
