
module.exports = (...values) => {
  // eslint-disable-next-line no-unused-vars
  const _options = values.pop()
  return values.length && values.every((value) => value)
}
