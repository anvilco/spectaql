const htmlId = require('../helpers/htmlId')
const generateQueryExample = require('./generate-graphql-example-data')
const {
  generateIntrospectionTypeExample,
} = require('../lib/common')

const {
  analyzeTypeIntrospection,
} = require('./type-helpers')

function preProcess ({ orderedDataWithHeaders, introspectionResponse, graphQLSchema }, extensionOptions) {
  handleItems(orderedDataWithHeaders, { introspectionResponse, graphQLSchema }, extensionOptions)
}

function handleItems (items, { depth = 0, names = [], introspectionResponse, graphQLSchema } = {}, extensionOptions) {
  if (!Array.isArray(items)) {
    return
  }

  for (const item of items) {
    handleItem(item, { depth, names, introspectionResponse, graphQLSchema }, extensionOptions)
  }
}

function handleItem (item, { depth, names, introspectionResponse, graphQLSchema }, extensionOptions) {
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

    return handleItems(item.items, { depth: depth + 1, names, introspectionResponse, graphQLSchema }, extensionOptions)
  }

  // It's a leaf node

  let anchorPrefix
  if (item.isQuery) {
    anchorPrefix = 'query'
    addQueryToItem({ item, introspectionResponse, graphQLSchema }, extensionOptions)
  } else if (item.isMutation) {
    anchorPrefix = 'mutation'
    addMutationToItem({ item, introspectionResponse, graphQLSchema })
  } else if (item.isSubscription) {
    anchorPrefix = 'subscription'
    addSubscriptionToItem({ item, introspectionResponse, graphQLSchema })
  } else {
    // It's a definition
    anchorPrefix = 'definition'
    addDefinitionToItem({ item, introspectionResponse, graphQLSchema })
  }
  // Assign a standardized ID to it
  item.htmlId = htmlId([anchorPrefix, item.name].join('-'))
}

function addQueryToItem ({ item, introspectionResponse, graphQLSchema }, extensionOptions) {
  return _addQueryToItem({ item, flavor: 'query', introspectionResponse, graphQLSchema }, extensionOptions)
}

function addMutationToItem ({ item, introspectionResponse, graphQLSchema }, extensionOptions) {
  return _addQueryToItem({ item, flavor: 'mutation', introspectionResponse, graphQLSchema }, extensionOptions)
}

function addSubscriptionToItem ({ item, introspectionResponse, graphQLSchema }, extensionOptions) {
  return _addQueryToItem({ item, flavor: 'subscription', introspectionResponse, graphQLSchema }, extensionOptions)
}

function _addQueryToItem ({ item, flavor, introspectionResponse, graphQLSchema }, extensionOptions) {
  const stuff = generateQueryExample({ prefix: flavor, field: item, introspectionResponse, graphQLSchema }, extensionOptions)
  const {
    query,
    variables,
    response,
  } = stuff

  item[flavor] = query
  item.variables = variables

  const {
      underlyingType,
      isRequired,
      isArray,
      itemsRequired,
    } = analyzeTypeIntrospection(item.type)

  item.response = {
    underlyingType,
    isRequired,
    isArray,
    itemsRequired,
    data: response
  }
}

function addDefinitionToItem ({ item, introspectionResponse, graphQLSchema }) {
  item.example = generateIntrospectionTypeExample({ type: item, introspectionResponse, graphQLSchema })
}

module.exports = preProcess
