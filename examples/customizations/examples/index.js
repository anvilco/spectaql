// const _ = require('lodash')

const LIFE_THE_UNIVERSE_AND_EVERYTHING = 42

//
function processor ({
  // The type should always be provided
  type,
  // If the thing is a field or the argument on a field, field will be present
  field,
  // If the thing is an argument on a field, argument will be present
  arg,
  // If the thing being processed is an inputField on an input type, inputField will be present
  inputField,
  // This will be an object containing (at least) the 'kind' and 'name' properties of the "underlying type"
  // of the thing being processed. "Underlying type" meaning whatever is at the bottom of any "LIST" and
  // "NON_NULL" nesting. If the thing being processed is actually a Type, this object will be the entire
  // Type.
  //
  // Eg: [String] => { kind: 'SCALAR', name: 'String' }
  underlyingType,
  // Is the thing required or not? Eg: String! or [String]! => true
  isRequired,
  // Is the thing an array/list? Eg: [String] => true
  isArray,
  // Are the items in the array/list required? Eg: [String!] => true
  itemsRequired,
}) {

  // If "arg" is present, we know the thing being processed is an arg
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

  // If we know it's not an arg, but "field" is present, we know the thing being processed is a field
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

  // If we know it's not an arg or a field, but "inputField" is present, we know the thing
  // being processed is an inputField
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

  // If we know it's not an arg, field, or inputType, but "type" is present, we know the thing
  // being processed is a type
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
