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
    addMutationToItem(item)
  } else {

  }
}

function addQueryToItem ({ item, introspectionResponse, graphQLSchema }) {
  console.log({addQueryToItem: true, introspectionResponse})
  const stuff = generateQueryExample({ prefix: 'query', field: item, introspectionResponse, graphQLSchema })
  const {
    query,
    variables,
    response,
  } = stuff
  console.log({stuff})

  item.query = query
  item.variables = variables
  item.response = response
}

function addMutationToItem ({ item, introspectionResponse, graphQLSchema }) {
  // item.mutation = generateQueryExample({ name: 'query', field: item, introspectionResponse })
}

module.exports = preProcess
