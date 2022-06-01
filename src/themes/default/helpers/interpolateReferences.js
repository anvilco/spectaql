const PATH_TO_PREFIX_MAP = {
  Types: 'definition',
  Queries: 'query',
  Mutations: 'mutation',
  Subscriptions: 'subscription',
}

module.exports = function interpolateReferences(value, options) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/{{(.*?)}}/g, (match, value) => {
    const [path, name] = value.split('.')
    const prefix = PATH_TO_PREFIX_MAP[path]
    if (!prefix) {
      const msg = `Unsupported interpolation encountered: "${match}"`
      if (
        options?.data?.root?.allOptions?.specData?.spectaql
          ?.errorOnInterpolationReferenceNotFound !== false
      ) {
        throw new Error(msg)
      } else {
        console.warn('WARNING: ' + msg)
        return match
      }
    }

    return `#${prefix}-${name}`
  })
}
