const htmlId = require('../helpers/htmlId')
const generateQueryExample = require('./generate-graphql-example-data')

const {
  analyzeTypeIntrospection,
} = require('./type-helpers')

function preProcess ({ orderedDataWithHeaders, introspectionResponse, graphQLSchema }) {
  console.log({introspectionResponse})
  handleItems(orderedDataWithHeaders, { introspectionResponse, graphQLSchema })
}

function handleItems (items, { depth = 0, names = [], introspectionResponse, graphQLSchema } = {}) {
  if (!Array.isArray(items)) {
    return
  }

  for (const item of items) {
    handleItem(item, { depth, names, introspectionResponse, graphQLSchema })
  }
}

function handleItem (item, { depth, names, introspectionResponse, graphQLSchema }) {
  if (!item) {
    return
  }

  names = names.filter(Boolean)
  if (!item.hideInContent && names.length) {
    item.parentName = names[names.length - 1]
    item.parentHtmlId = htmlId(names.join('-'))
  }

  item.makeSection = false
  item.depth = depth

  if (Array.isArray(item.items)) {
    // If we're still on a branch of the tree, we assign our own ID to it
    names.push(item.name)
    item.htmlId = htmlId(names.join('-'))
    if (depth > 0) {
      item.makeSection = true
    }

    return handleItems(item.items, { depth: depth + 1, names, introspectionResponse, graphQLSchema })
  }

  // It's a leaf node

  let anchorPrefix
  if (item.isQuery) {
    anchorPrefix = 'query'
    addQueryToItem({ item, introspectionResponse, graphQLSchema })
  } else if (item.isMutation) {
    anchorPrefix = 'mutation'
    addMutationToItem({ item, introspectionResponse, graphQLSchema })
  } else {
    // It's a definition
    anchorPrefix = 'definition'
  }
  // Assign a standardized ID to it
  item.htmlId = htmlId([anchorPrefix, item.name].join('-'))
}

function addQueryToItem ({ item, introspectionResponse, graphQLSchema }) {
  return addQueryOrMutationToItem({ item, queryOrMutationIndicator: 'query', introspectionResponse, graphQLSchema })
}

function addMutationToItem ({ item, introspectionResponse, graphQLSchema }) {
  return addQueryOrMutationToItem({ item, queryOrMutationIndicator: 'mutation', introspectionResponse, graphQLSchema })
}

function addQueryOrMutationToItem ({ item, queryOrMutationIndicator, introspectionResponse, graphQLSchema }) {
  const stuff = generateQueryExample({ prefix: queryOrMutationIndicator, field: item, introspectionResponse, graphQLSchema })
  const {
    query,
    variables,
    response,
  } = stuff

  item[queryOrMutationIndicator] = query
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

module.exports = preProcess
