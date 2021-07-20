
function scalarProcessor (argz = {}) {
  const {
    name,
  } = argz

  switch (name) {
    case 'String': {
      return "42: Life, the Universe and Everything"
    }
  }
}

function fieldProcessor(argz = {}) {
  const {
    parentName,
    // parentType,
    name,
    // definition,
    // typeName,
    returnType,
    // Give 'em all the args'
    // args,
  } = argz

  const example = `${parentName}.${name}.${returnType}.example`
  switch (parentName) {
    // Each of these are fully exampled...
    case 'MyType':
    case 'OtherType': {
      return example
    }
    case 'YetAnotherType': {
      switch (name) {
        case 'fieldWithExample': {
          return example
        }
        default: {
          return
        }
      }
    }
  }
}

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

module.exports = {
  scalarProcessor,
  fieldProcessor,
  argumentProcessor,
}