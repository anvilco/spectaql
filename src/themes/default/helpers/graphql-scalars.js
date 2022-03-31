// https://www.npmjs.com/package/graphql-scalars
import { mocks } from 'graphql-scalars'

// Map GraphQL Scalar types to example data to use from them
const GRAPHQL_SCALAR_TO_EXAMPLE = Object.freeze(
  Object.entries(mocks).reduce((acc, [k, v]) => {
    acc[k] = v()
    return acc
  }, {})
)

export function getExampleForGraphQLScalar(scalarName) {
  return GRAPHQL_SCALAR_TO_EXAMPLE[scalarName]
}
