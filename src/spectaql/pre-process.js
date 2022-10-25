import htmlId from '../themes/default/helpers/htmlId'
import generateQueryExample from './generate-graphql-example-data'
import { generateIntrospectionTypeExample } from '../lib/common'
import { analyzeTypeIntrospection } from './type-helpers'

export default function preProcess({
  items,
  introspectionResponse,
  graphQLSchema,
  extensions = {},
  queryNameStrategy,
  allOptions,
}) {
  handleItems(items, {
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
  })
}

function handleItems(
  items,
  {
    depth = 0,
    names = [],
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
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
      extensions,
      queryNameStrategy,
      allOptions,
    })
  }
}

function handleItem(
  item,
  {
    depth,
    names,
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
  }
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
      extensions,
      queryNameStrategy,
      allOptions,
    })
  }

  // It's a leaf node

  let anchorPrefix
  if (item.isQuery) {
    anchorPrefix = 'query'
    addQueryToItem({
      item,
      introspectionResponse,
      graphQLSchema,
      extensions,
      queryNameStrategy,
      allOptions,
    })
  } else if (item.isMutation) {
    anchorPrefix = 'mutation'
    addMutationToItem({
      item,
      introspectionResponse,
      graphQLSchema,
      extensions,
      queryNameStrategy,
      allOptions,
    })
  } else if (item.isSubscription) {
    anchorPrefix = 'subscription'
    addSubscriptionToItem({
      item,
      introspectionResponse,
      graphQLSchema,
      extensions,
      queryNameStrategy,
      allOptions,
    })
  } else {
    // It's a definition
    anchorPrefix = 'definition'
    addDefinitionToItem({
      item,
      introspectionResponse,
      graphQLSchema,
      extensions,
      allOptions,
    })
  }
  // Assign a standardized ID to it
  item.htmlId = htmlId([anchorPrefix, item.name].join('-'))
}

function addQueryToItem({
  item,
  introspectionResponse,
  graphQLSchema,
  extensions,
  queryNameStrategy,
  allOptions,
}) {
  return _addQueryToItem({
    item,
    flavor: 'query',
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
  })
}

function addMutationToItem({
  item,
  introspectionResponse,
  graphQLSchema,
  extensions,
  queryNameStrategy,
  allOptions,
}) {
  return _addQueryToItem({
    item,
    flavor: 'mutation',
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
  })
}

function addSubscriptionToItem({
  item,
  introspectionResponse,
  graphQLSchema,
  extensions,
  queryNameStrategy,
  allOptions,
}) {
  return _addQueryToItem({
    item,
    flavor: 'subscription',
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
  })
}

function _addQueryToItem({
  item,
  flavor,
  introspectionResponse,
  graphQLSchema,
  extensions,
  queryNameStrategy,
  allOptions,
}) {
  const stuff = generateQueryExample({
    prefix: flavor,
    field: item,
    introspectionResponse,
    graphQLSchema,
    extensions,
    queryNameStrategy,
    allOptions,
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

function addDefinitionToItem({
  item,
  introspectionResponse,
  graphQLSchema,
  extensions,
  // allOptions,
}) {
  item.example = generateIntrospectionTypeExample({
    type: item,
    introspectionResponse,
    graphQLSchema,
    extensions,
  })
}
