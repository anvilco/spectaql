// https://www.npmjs.com/package/graphql-scalars
import { mocks } from 'graphql-scalars'

const ADAPTERS_BY_SCALAR_NAME = {
  URL: (val) => val.toString(),
  Byte: (val) => JSON.parse(`[${val.toString()}]`),
}

// Map GraphQL Scalar types to example data to use from them
const GRAPHQL_SCALAR_TO_EXAMPLE = Object.freeze(
  Object.entries(mocks).reduce((acc, [k, v]) => {
    acc[k] = v()
    return acc
  }, {})
)

export function getExampleForGraphQLScalar(scalarName) {
  const value = GRAPHQL_SCALAR_TO_EXAMPLE[scalarName]
  if (ADAPTERS_BY_SCALAR_NAME[scalarName]) {
    return ADAPTERS_BY_SCALAR_NAME[scalarName](value)
  }

  return value
}
