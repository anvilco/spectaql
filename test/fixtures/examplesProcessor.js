// const _ = require('lodash')

const LIFE_THE_UNIVERSE_AND_EVERYTHING = 42

function processor ({ type, field, arg, inputField, underlyingType, isRequired, isArray, itemsRequired }) {
  // console.log({ type, field, arg })
  // Handle Args
  if (arg) {
    if (typeof arg.example !== 'undefined') {
      return
    }

    const example = `${type.name}.${field.name}.${arg.name}.${underlyingType.name}.example`

    switch (type.name) {
      case 'Query': {
        return example
      }
      case 'Mutation': {
        return example
      }
      // Each of these are fully exampled...
      case 'MyType':
      case 'OtherType': {
        return example
      }
      case 'YetAnotherType': {
        switch (field.name) {
          // Any fields
          default: {
            switch (arg.name) {
              // With this argument name
              case 'argWithExample': {
                // Get an example
                return example
              }
              default: {
                return
              }
            }
          }
        }
      }
      default: {
        return
      }
    }
  }

  // Handle Fields
  if (field) {
    if (typeof field.example !== 'undefined') {
      return
    }

    const example = `${type.name}.${field.name}.${underlyingType.name}.example`
    switch (type.name) {
      // Each of these are fully exampled...
      case 'MyType':
      case 'OtherType': {
        return example
      }
      case 'YetAnotherType': {
        switch (field.name) {
          case 'fieldWithExample': {
            return example
          }
          default: {
            return
          }
        }
      }
    }

    return
  }

  // Handle InputFields
  if (inputField) {
    if (typeof inputField.example !== 'undefined') {
      return
    }

    if (type.name === 'AnotherInput') {
      console.log({ type, field, arg, inputField, underlyingType, isRequired, isArray, itemsRequired })
      return `${type.name}.${inputField.name}.${underlyingType.name}.${isArray}.${itemsRequired}.example`
    }

    return
  }

    // const inputFieldType = underlyingType

    // if (inputFieldType.kind === 'SCALAR' && inputFieldType.name === 'Int') {
    //   return isArray ? [LIFE_THE_UNIVERSE_AND_EVERYTHING] : LIFE_THE_UNIVERSE_AND_EVERYTHING
    // }

    // return
  // }

  // Handle Types
  if (type) {
    if (typeof type.example !== 'undefined') {
      return
    }

    if (type.kind === 'SCALAR') {
      console.log({
        type,
      })
      switch (type.name) {
        case 'String': {
          return "42: Life, the Universe and Everything"
        }
      }
    }

    return
  }
}


module.exports = processor

function argumentProcessor(argz = {}) {
  const {
    grandParentName,
    grandParentType,
    parentName,
    parentType,
    name,
    // definition,
    type,
    // returnType,
    // Give 'em all the args'
    // args,
  } = argz

  const example = `${grandParentName}.${grandParentType}.${parentName}.${parentType}.${name}.${type}.example`

  switch (grandParentType) {
    case 'Type': {
      switch (grandParentName) {
        // Each of these are fully exampled...
        case 'MyType':
        case 'OtherType': {
          return example
        }
        case 'YetAnotherType': {
          switch (parentName) {
            // Any fields
            default: {
              switch (name) {
                // With this argument name
                case 'argWithExample': {
                  // Get an example
                  return example
                }
                default: {
                  return
                }
              }
            }
          }
        }
        default: {
          return
        }
      }
    }
    case 'Query': {
      return example
    }
    case 'Mutation': {
      return example
    }

    default: {
      return
    }
  }
}

module.exports = processor
