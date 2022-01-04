// const _ = require('lodash')

const LIFE_THE_UNIVERSE_AND_EVERYTHING = 42

function processor ({ type, field, arg, inputField, underlyingType, isRequired, isArray, itemsRequired }) {
  // Handle Args
  if (arg) {
    if (typeof arg.example !== 'undefined') {
      return
    }

    const argType = underlyingType

    // All String arguments on the myQuery Query get examples
    if (type.kind === 'OBJECT' && type.name  === 'Query' && field.name === 'myQuery' && argType.kind === 'SCALAR' && argType.name === 'String') {
      const val = `Special generated Argument example for ${field.name} ${arg.name}`
      // Might need to be an array
      return isArray ? [val] : val
    }

    // All String arguments everywhere else get examples
    if (argType.kind == 'SCALAR' && argType.name === 'String') {
      const val = `Generated Argument example for ${field.name} ${arg.name}`
      // Might need to be an array
      return isArray ? [val] : val
    }

    return
  }

  // Handle Fields
  if (field) {
    if (typeof field.example !== 'undefined') {
      return
    }

    const fieldType = underlyingType

    // All String fields on MyType get an example, unless they already had one from somewhere
    if (type.kind === 'OBJECT' && type.name === 'MyType' && fieldType.kind === 'SCALAR' && fieldType.name === 'String') {
      const val = `Generated Field example for ${field.name}`
      // Might need to be an array
      return isArray ? [val] : val
    }

    return
  }

  // Handle InputFields
  if (inputField) {
    if (typeof inputField.example !== 'undefined') {
      return
    }

    const inputFieldType = underlyingType

    if (inputFieldType.kind === 'SCALAR' && inputFieldType.name === 'Int') {
      return isArray ? [LIFE_THE_UNIVERSE_AND_EVERYTHING] : LIFE_THE_UNIVERSE_AND_EVERYTHING
    }

    return
  }

  // Handle Types
  if (type) {
    if (typeof type.example !== 'undefined') {
      return
    }

    switch (type.name) {
      case 'Int': {
        return LIFE_THE_UNIVERSE_AND_EVERYTHING
      }
    }

    return
  }
}


module.exports = processor
