module.exports = function interpolateReferences (value, _options) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(/{{(.*?)}}/g,
    (_match, value) => {
      const [path, name] = value.split('.')
      if (['Queries', 'Mutations'].includes(path)) {
        return `#operation-${name.toLowerCase()}-${path}`
      } else if (path === 'Types') {
        return `#definition-${name}`
      }

      throw new Error(`Unsupported interpolation encountered: ${value}`)
    }
  )
}
