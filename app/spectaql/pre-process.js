const htmlId = require('../helpers/htmlId')
const generateQueryExample = require('./generate-graphql-example-data')


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
  names.push(item.name)
  item.htmlId = htmlId(names.join('-'))

  item.makeSection = false
  item.depth = depth


  if (Array.isArray(item.items)) {
    if (depth > 0) {
      item.makeSection = true
    }

    return handleItems(item.items, { depth: depth + 1, names, introspectionResponse, graphQLSchema })
  }

  if (item.isQuery) {
    addQueryToItem({ item, introspectionResponse, graphQLSchema })
  } else if (item.isMutation) {
    addMutationToItem({ item, introspectionResponse, graphQLSchema })
  } else {

  }
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
  item.response = response
}

module.exports = preProcess
