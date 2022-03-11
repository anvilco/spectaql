import htmlId from '../helpers/htmlId'
import generateQueryExample from './generate-graphql-example-data'
import { generateIntrospectionTypeExample } from '../lib/common'
import { analyzeTypeIntrospection } from './type-helpers'

export default preProcess

function preProcess(
  { orderedDataWithHeaders, introspectionResponse, graphQLSchema },
  { scalarGraphql }
) {
  handleItems(orderedDataWithHeaders, {
    introspectionResponse,
    graphQLSchema,
    scalarGraphql,
  })
}

function handleItems(
  items,
  {
    depth = 0,
    names = [],
    introspectionResponse,
    graphQLSchema,
    scalarGraphql,
  } = {}
) {
  if (!Array.isArray(items)) {
    return
  }

  for (const item of items) {
    handleItem(item, {
      depth,
      names,
      introspectionResponse,
      graphQLSchema,
      scalarGraphql,
    })
  }
}

function handleItem(
  item,
  { depth, names, introspectionResponse, graphQLSchema, scalarGraphql }
) {
  if (!item) {
    return
  }

  names = names.filter(Boolean)
  if (!item.hideInContent && names.length) {
    item.parentName = names[names.length - 1]
    item.parentHtmlId = htmlId(names.join('-'))
  }

  item.depth = depth

  if (Array.isArray(item.items)) {
    // If we're still on a branch of the tree, we assign our own ID to it
    names.push(item.name)
    item.htmlId = htmlId(names.join('-'))

    return handleItems(item.items, {
      depth: depth + 1,
      names,
      introspectionResponse,
      graphQLSchema,
      scalarGraphql,
    })
  }

  // It's a leaf node

  let anchorPrefix
  if (item.isQuery) {
    anchorPrefix = 'query'
    addQueryToItem(
      { item, introspectionResponse, graphQLSchema },
      { scalarGraphql }
    )
  } else if (item.isMutation) {
    anchorPrefix = 'mutation'
    addMutationToItem(
      { item, introspectionResponse, graphQLSchema },
      { scalarGraphql }
    )
  } else if (item.isSubscription) {
    anchorPrefix = 'subscription'
    addSubscriptionToItem(
      { item, introspectionResponse, graphQLSchema },
      { scalarGraphql }
    )
  } else {
    // It's a definition
    anchorPrefix = 'definition'
    addDefinitionToItem({
      item,
      introspectionResponse,
      graphQLSchema,
      scalarGraphql,
    })
  }
  // Assign a standardized ID to it
  item.htmlId = htmlId([anchorPrefix, item.name].join('-'))
}

function addQueryToItem({ item, introspectionResponse, graphQLSchema }) {
  return _addQueryToItem({
    item,
    flavor: 'query',
    introspectionResponse,
    graphQLSchema,
  })
}

function addMutationToItem({ item, introspectionResponse, graphQLSchema }) {
  return _addQueryToItem({
    item,
    flavor: 'mutation',
    introspectionResponse,
    graphQLSchema,
  })
}

function addSubscriptionToItem({ item, introspectionResponse, graphQLSchema }) {
  return _addQueryToItem({
    item,
    flavor: 'subscription',
    introspectionResponse,
    graphQLSchema,
  })
}

function _addQueryToItem({
  item,
  flavor,
  introspectionResponse,
  graphQLSchema,
}) {
  const stuff = generateQueryExample({
    prefix: flavor,
    field: item,
    introspectionResponse,
    graphQLSchema,
  })
  const { query, variables, response } = stuff

  item[flavor] = query
  item.variables = variables

  const { underlyingType, isRequired, isArray, itemsRequired } =
    analyzeTypeIntrospection(item.type)

  item.response = {
    underlyingType,
    isRequired,
    isArray,
    itemsRequired,
    data: response,
  }
}

function addDefinitionToItem({ item, introspectionResponse, graphQLSchema }) {
  // if (item.name === 'AddressInput') {
  //   console.log(JSON.stringify({
  //     item,
  //   }))
  // }
  item.example = generateIntrospectionTypeExample({
    type: item,
    introspectionResponse,
    graphQLSchema,
  })
}
