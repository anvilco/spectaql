import _ from 'lodash'
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
    addThingsToDefinitionItem({
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

// Normalize operation example format to handle both request.query and direct query formats
function normalizeOperationExample(example) {
  if (!example) {
    return null
  }

  // Handle format with request wrapper: { request: { query, variables }, response }
  if (example.request) {
    let variables = example.request.variables
    if (variables === undefined) {
      variables = null
    } else if (variables === null || (typeof variables === 'object' && Object.keys(variables).length === 0)) {
      // Empty object or null should be treated as null
      variables = null
    }
    return {
      query: example.request.query,
      variables,
      response: example.response || null,
      name: example.name || null,
    }
  }

  // Handle direct format: { query, variables, response }
  if (example.query) {
    let variables = example.variables
    if (variables === undefined) {
      variables = null
    } else if (variables === null || (typeof variables === 'object' && Object.keys(variables).length === 0)) {
      // Empty object or null should be treated as null
      variables = null
    }
    return {
      query: example.query,
      variables,
      response: example.response || null,
      name: example.name || null,
    }
  }

  return null
}

// Extract operation-level examples from metadata
// Supports both OBJECT format (after merge) and queries/mutations format (from original metadata)
function getOperationExamples({
  item,
  flavor,
  introspectionResponse,
  allOptions,
}) {
  if (!item || !item.name) {
    return null
  }

  const metadatasPath =
    allOptions?.specData?.introspection?.metadatasPath || 'documentation'

  // Try OBJECT format first (metadata merged into introspection response)
  // Examples would be at item.documentation.examples (or whatever metadatasPath is)
  // Note: This might have been removed by removeMetadata, so we also check originalMetadata
  const fieldExamples = _.get(item, `${metadatasPath}.examples`)

  if (fieldExamples && Array.isArray(fieldExamples) && fieldExamples.length > 0) {
    return fieldExamples.map(normalizeOperationExample).filter(Boolean)
  }

  // Try original metadata (both OBJECT format and queries/mutations format)
  const originalMetadata = allOptions?.specData?.originalMetadata
  if (originalMetadata) {
    // First try OBJECT format in original metadata
    const operationTypeName = flavor === 'query' ? 'Query' : flavor === 'mutation' ? 'Mutation' : 'Subscription'
    const objExamples = _.get(
      originalMetadata,
      `OBJECT.${operationTypeName}.fields.${item.name}.${metadatasPath}.examples`
    )

    if (objExamples && Array.isArray(objExamples) && objExamples.length > 0) {
      return objExamples.map(normalizeOperationExample).filter(Boolean)
    }

    // Then try alternative format: queries/mutations from original metadata structure
    const altOperationType = flavor === 'query' ? 'queries' : flavor === 'mutation' ? 'mutations' : 'subscriptions'
    const altExamples = _.get(originalMetadata, `${altOperationType}.${item.name}.examples`)

    if (altExamples && Array.isArray(altExamples) && altExamples.length > 0) {
      return altExamples.map(normalizeOperationExample).filter(Boolean)
    }
  }

  return null
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
  // Check for custom examples first
  const customExamples = getOperationExamples({
    item,
    flavor,
    introspectionResponse,
    allOptions,
  })

  if (customExamples && customExamples.length > 0) {
    // Use first custom example
    const example = customExamples[0]

    item[flavor] = example.query
    item.variables = example.variables

    const { underlyingType, isRequired, isArray, itemsRequired } =
      analyzeTypeIntrospection(item.type)

    // Extract response data from example.response
    // Support both { data: {...} } and direct object formats
    let responseData = null
    if (example.response) {
      responseData = example.response.data || example.response
    }

    item.response = {
      underlyingType,
      isRequired,
      isArray,
      itemsRequired,
      data: responseData,
    }

    // Store all examples for potential future use (e.g., showing multiple examples)
    item.examples = customExamples
  } else {
    // Fall back to auto-generation (existing behavior)
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
}

function addThingsToDefinitionItem({
  item,
  introspectionResponse,
  graphQLSchema,
  extensions,
  // allOptions,
}) {
  // Only if not already present
  if (typeof item.example === 'undefined') {
    item.example = generateIntrospectionTypeExample({
      type: item,
      introspectionResponse,
      graphQLSchema,
      extensions,
    })
  }
}
