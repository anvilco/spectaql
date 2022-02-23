

function preProcess ({ orderedDataWithHeaders, introspectionResponse }) {
  handleItems(orderedDataWithHeaders)
}

function handleItems (items, { depth = 0 } = {}) {
  if (!Array.isArray(items)) {
    return
  }

  for (const item of items) {
    handleItem(item, { depth })
  }
}

function handleItem (item, { depth }) {
  if (!item) {
    return
  }

  item.makeSection = false
  item.depth = depth

  if (Array.isArray(item.items)) {
    if (depth > 0) {
      item.makeSection = true
    }

    return handleItems(item.items, { depth: depth + 1 })
  }

  if (item.isQuery) {
    addQueryToItem(item)
  } else if (item.isMutation) {
    addMutationToItem(item)
  } else {

  }
}

function addQueryToItem ({ item, introspectionResponse }) {
  // item.query = generateQueryExample({ name: 'query', field: item, introspectionResponse })
}

function addMutationToItem ({ item, introspectionResponse }) {
  // item.mutation = generateQueryExample({ name: 'query', field: item, introspectionResponse })
}

module.exports = preProcess
