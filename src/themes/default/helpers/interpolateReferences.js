const PATH_TO_PREFIX_MAP = {
  Types: 'definition',
  Queries: 'query',
  Mutations: 'mutation',
  Subscriptions: 'subscription',
}

module.exports = function interpolateReferences(value, _options) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/{{(.*?)}}/g, (_match, value) => {
    const [path, name] = value.split('.')
    const prefix = PATH_TO_PREFIX_MAP[path]
    if (!prefix) {
      throw new Error(`Unsupported interpolation encountered: ${value}`)
    }

    return `#${prefix}-${name}`
  })
}
