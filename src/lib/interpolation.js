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
  const matches = valueIn.match(/(.?\${*[\w]*(?::-[\w/]*)?}*)/g) || []

  return matches.reduce((newValue, match, index) => {
    const parts = /(.?)\${*([\w]*(?::-[\w/]*)?)?}*/g.exec(match)
    if (!parts || parts.length === 0) {
      return newValue
    }

    const prefix = parts[1]
    let value, replacePart

    if (prefix === '\\') {
      replacePart = parts[0]
      value = replacePart.replace('\\$', '$')
    } else {
      const keyParts = parts[2].split(':-')
      const key = keyParts[0]
      const defautValue = keyParts[1] || ''

      replacePart = parts[0].substring(prefix.length)
      value = Object.prototype.hasOwnProperty.call(process.env, key)
        ? process.env[key]
        : defautValue

      // If the value is found, remove nested expansions.
      if (keyParts.length > 1 && value) {
        const replaceNested = matches[index + 1]
        matches[index + 1] = ''

        newValue = newValue.replace(replaceNested, '')
      }
      // Resolve recursive substitutesions
      value = substituteEnv(value)
    }

    return newValue.replace(replacePart, value)
  }, valueIn)
}
