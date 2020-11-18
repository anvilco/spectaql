// Takes any number values and returns the first one that's truthy

module.exports = (...values) => {
  // eslint-disable-next-line no-unused-vars
  const options = values.pop()

  return values.find((value) => value) || values[0]
}
