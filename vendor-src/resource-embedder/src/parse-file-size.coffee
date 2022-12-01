###
  resource-embedder
  https://github.com/callumlocke/resource-embedder
  Copyright 2013 Callum Locke
  Licensed under the MIT license.
###

multipliers =
  kb: 1024
  KB: 1024
  b: 1
  bytes: 1

module.exports = (str) ->
  if typeof str is 'number'
    return str

  number = str.match(/^[0-9\.]+/)
  if !number? or !number.length
    throw new Error "Number not found in string: #{str}"
  number = number[0]

  unit = str.substring(number.length).trim()
  if unit is ''
    return +number

  if not multipliers[unit]? or (+number != +(+number).toString())
    throw new Error "Not understood: '#{str}'"

  Math.round(multipliers[unit] * number)
