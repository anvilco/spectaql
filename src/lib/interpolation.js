export function substituteEnvOnObject(obj) {
  if (obj?.constructor.name !== 'Object') {
    return obj
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[substituteEnv(key)] = substituteEnv(value)
    return acc
  }, {})
}

export function substituteEnv(valueIn) {
  if (Array.isArray(valueIn)) {
    return valueIn.map(substituteEnv)
  }
  if (valueIn.constructor.name === 'Object') {
    return substituteEnvOnObject(valueIn)
  }
  if (!valueIn || typeof valueIn !== 'string') {
    return valueIn
  }

  // Quite heavily borrowed from https://github.com/motdotla/dotenv-expand
  // which has over 10mm weekly downloads, so this feels solid.

  // This regex will match ENV variables in the form of:
  // - $ENV_VAR
  // - ${ENV_VAR}
  // - ${ENV_VAR:-fallback}
  // To achieve this and not also match something like `${ENV_VAR` or `$ENV_VAR}`,
  // there are two alternatives in the following regex, first for ${ENV} and second for $ENV
  const regex = /(.?)\$({([\w]*(?::-[^}]+)?)}|([\w])*)/g
  const matches = valueIn.match(regex) || []

  return matches.reduce((newValue, match) => {
    const parts = regex.exec(match)
    if (!parts || parts.length === 0) {
      return newValue
    }

    const prefix = parts[1]
    let value, replacePart

    if (prefix === '\\') {
      replacePart = parts[0]
      value = replacePart.replace('\\$', '$')
    } else {
      // We can have a match in parts[3] (syntax with ${ENV}) or parts[2] for a syntax like $ENV
      const keyParts = (parts[3] || parts[2]).split(':-')
      const key = keyParts[0]
      const defaultValue = keyParts[1] || ''

      replacePart = parts[0].substring(prefix.length)
      value = Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : defaultValue

      // Resolve recursive substitutions
      value = substituteEnv(value)
    }

    return newValue.replace(replacePart, value)
  }, valueIn)
}
