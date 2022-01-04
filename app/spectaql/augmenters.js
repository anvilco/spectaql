const _ = require('lodash')

const IntrospectionManipulator = require('../lib/Introspection')
const {
  KIND_SCALAR,
} = IntrospectionManipulator

const {
  analyzeTypeIntrospection,
} = require('./type-helpers')

const {
  addSpecialTags,
  // replaceQuotesWithTags,
} = require('../lib/common')

const stripTrailing = require('../helpers/stripTrailing')

// const METADATA_OUTPUT_PATH = 'metadata'

const calculateShouldDocument = ({ undocumented, documented, def }) => {
  return undocumented !== true && (documented === true || def === true)
}

function augmentData (args) {
  // const {
  //   introspectionOptions
  // } = args

  // const {
  //   hideFieldsWithUndocumentedReturnType,
  //   hideQueriesWithUndocumentedReturnType,
  //   hideMutationsWithUndocumentedReturnType,
  // } = introspectionOptions

  const introspectionManipulator = new IntrospectionManipulator(
    args.introspectionResponse,
    // Get this from options? More granular from options?
    { removeUnusedTypes: false },
  )

  args = {
    ...args,
    introspectionManipulator,
  }

  hideThingsBasedOnMetadata(args)

  addExamples(args)

  removeMetadata(args)

  return introspectionManipulator.getResponse()
}

// TODO: Separate out the metadata copying into JSON Schema results into its own thing?
function hideThingsBasedOnMetadata ({
  introspectionManipulator,
  introspectionOptions,
}) {

  // Hide them Query/Mutation Properties
  hideQueriesAndMutations({
    introspectionManipulator,
    introspectionOptions,
  })

  // Hide the Type Definitions
  hideTypes({
    introspectionManipulator,
    introspectionOptions,
  })

  // This hides fields on Types as well as individual queries and mutations.
  //
  // ** Should be called after hideTypes so that fields can be hidden
  // if their return Type is also hidden - if the options say to do that **
  hideFields({
    introspectionManipulator,
    introspectionOptions,
  })

  // This hides arguments on Type Fields as well as on individual queries and mutationsa.
  //
  // ** Should be called after hideTypes so that arguments can be hidden
  // if their return Type is also hidden - if the options say to do that **
  //
  // Actually, the return Type based Arg hiding is not yet implemented, but this should still
  // run after hideTypes
  hideArguments({
    introspectionManipulator,
    introspectionOptions,
  })

  return {
    introspectionManipulator,
    introspectionOptions,
  }
}

function hideQueriesAndMutations ({
  introspectionManipulator,
  introspectionOptions,
}) {
  const {
    metadatasPath,
    queriesDocumentedDefault,
    mutationsDocumentedDefault,
  } = introspectionOptions

  const {
    queryType: {
      name: queryTypeName,
    },
    mutationType: {
      name: mutationTypeName,
    },
  } = introspectionManipulator.getResponse().__schema

  ;[
    [queryTypeName, queriesDocumentedDefault],
    [mutationTypeName, mutationsDocumentedDefault],
  ].forEach(([name, documentedDefault]) => {
    const type = introspectionManipulator.getType({ name })
    if (!type) {
      return
    }
    const metadata = _.get(type, metadatasPath, {})
    const shouldDocument = calculateShouldDocument({ ...metadata, def: documentedDefault })
    if (!shouldDocument) {
      introspectionManipulator.removeType({ name })
    }
  })
}

function hideTypes ({
  introspectionManipulator,
  introspectionOptions,
}) {
  const {
    metadatasPath,
    typesDocumented,
    typeDocumentedDefault: documentedDefault,
    hideFieldsOfUndocumentedType: removeFieldsOfType,
    // I'm new
    hideArgsOfUndocumentedType: removeArgsOfType,
    hideInputFieldsOfUndocumentedType: removeInputFieldsOfType,
    // I'm new
    hideUnionTypesOfUndocumentedType: removePossibleTypesOfType,
    hideQueriesWithUndocumentedReturnType,
    hideMutationsWithUndocumentedReturnType,
  // } = introspectionOptions
  } = introspectionOptions


  const types = introspectionManipulator.getResponse().__schema.types

  for (const type of types) {
    const metadata = _.get(type, metadatasPath, {})
    const shouldDocument = !!typesDocumented && calculateShouldDocument({ ...metadata, def: documentedDefault })

    if (!shouldDocument) {
      introspectionManipulator.removeType({
        kind: type.kind,
        name: type.name,
        removeFieldsOfType,
        removeArgsOfType,
        removeInputFieldsOfType,
        removePossibleTypesOfType,
      })
    }
  }
}

// This handles fields on Types, as well as individual queries
// and mutations.
//
// ** Should be called after hideTypes so that fields can be hidden
// if their return Type is also hidden - if the options say to do that **
function hideFields(args = {}) {
  const {
    introspectionManipulator,
    introspectionOptions,
  } = args

  const {
    metadatasPath,
    queryDocumentedDefault,
    mutationDocumentedDefault,
    fieldDocumentedDefault,
  } = introspectionOptions

  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()

  const types = introspectionManipulator.getResponse().__schema.types

  for (const type of types) {
    let defaultShowHide = fieldDocumentedDefault
    if (queryType && type === queryType) {
      defaultShowHide = queryDocumentedDefault
    } else if (mutationType && type === mutationType) {
      defaultShowHide = mutationDocumentedDefault
    }

    for (const field of (type.fields || [])) {
      const metadata = _.get(field, metadatasPath, {})
      const shouldDocument = calculateShouldDocument({ ...metadata, def: defaultShowHide })
      if (!shouldDocument) {
        introspectionManipulator.removeField({ typeKind: type.kind, typeName: type.name, fieldName: field.name })
      }
    }
  }
}

function hideArguments(args = {}) {
  const {
    introspectionManipulator,
    introspectionOptions,
  } = args

  const {
    metadatasPath,
    queryArgDocumentedDefault,
    mutationArgDocumentedDefault,
    argDocumentedDefault,
  } = introspectionOptions


  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()

  const types = introspectionManipulator.getResponse().__schema.types

  for (const type of types) {
    let defaultShowHide = argDocumentedDefault
    if (queryType && type === queryType) {
      defaultShowHide = queryArgDocumentedDefault
    } else if (mutationType && type === mutationType) {
      defaultShowHide = mutationArgDocumentedDefault
    }

    for (const field of (type.fields || [])) {
      for (const arg of (field.args || [])) {
        const metadata = _.get(arg, metadatasPath, {})
        const shouldDocument = calculateShouldDocument({ ...metadata, def: defaultShowHide })
        if (!shouldDocument) {
          introspectionManipulator.removeArg({ typeKind: type.kind, typeName: type.name, fieldName: field.name, argName: arg.name })
        }
      }
    }
  }
}

function addExamples (args = {}) {
  const dynamicExamplesProcessingModule = _.get(args, 'introspectionOptions.dynamicExamplesProcessingModule')

  let processor = (() => {})
  if (!dynamicExamplesProcessingModule) {
    console.warn('\n\n\nNO EXAMPLE PROCESSOR PATH PROVIDED\n\n\n')
    // return args
  } else {
    try {
      processor = require(dynamicExamplesProcessingModule)
      if (!processor) {
        console.warn('\n\n\nNO EXAMPLE PROCESSOR FOUND AT PATH\n\n\n')
        return args
      }

      if (typeof processor !== 'function') {
        console.warn('\n\n\nPROCESSOR EXPORT MUST BE A FUNCTION\n\n\n')
        return args
      }
    } catch(e) {
      if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
        console.warn('\n\n\nCOULD NOT LOAD EXAMPLE PROCESSOR\n\n\n')
        return args
      }
      else {
        throw e
      }
    }
  }

  const {
    introspectionManipulator,
    introspectionOptions,
  } = args

  const {
    metadatasPath,
  } = introspectionOptions

  const introspectionResponse = introspectionManipulator.getResponse()

  const types = introspectionResponse.__schema.types

  for (const type of types) {
    handleExamples({ type })

    for (const field of (type.fields || [])) {
      handleExamples({ type, field })

      for (const arg of (field.args || [])) {
        handleExamples({ type, field, arg })
      }
    }

    for (const inputField of (type.inputFields || [])) {
      handleExamples({ type, inputField })
    }
  }

  // Update the manipulator for other parts of the process that will use the manipulator
  // as the source of truth
  introspectionManipulator.setResponse(introspectionResponse)

  function getExistingExample (thing) {
    let {
      example,
      examples,
    } = _.get(thing, metadatasPath, {})

    if (examples && examples.length) {
      example = examples[Math.floor(Math.random() * examples.length)]
    }

    return example
  }

  function massageExample ({
    example,
    type,
  }) {
    if (isUndef(example)) {
      return example
    }

    const placeholdQuotes = type.kind === KIND_SCALAR && ['String', 'Date'].includes(type.name)

    return Array.isArray(example)
      ? example.map((val) => addSpecialTags(val, { placeholdQuotes }))
      : addSpecialTags(example, { placeholdQuotes })
  }

  function handleExamples ({ type, field, arg, inputField }) {
    const thing = arg || inputField || field || type
    const typeForAnalysis = (thing === type) ? type : thing.type
    const typeAnalysis = analyzeTypeIntrospection(typeForAnalysis)

    let example = getExistingExample(thing)
    if (!isUndef(example)) {
      thing.example = massageExample({ example, type: typeAnalysis.underlyingType })
    }

    example = processor({ ...typeAnalysis, type, field, arg, inputField })
    if (!isUndef(example)) {
      thing.example = massageExample({ example, type: typeAnalysis.underlyingType })
    }
  }
}


// Get rid of all the metadata entries
function removeMetadata (args = {}) {
  const {
    introspectionManipulator,
    introspectionOptions,
  } = args

  const {
    metadatasPath,
  } = introspectionOptions

  const introspectionResponse = introspectionManipulator.getResponse()

  const types = introspectionResponse.__schema.types

  for (const type of types) {
    _.unset(type, metadatasPath)

    for (const field of (type.fields || [])) {
      _.unset(field, metadatasPath)

      for (const arg of (field.args || [])) {
        _.unset(arg, metadatasPath)
      }
    }

    for (const inputField of (type.inputFields || [])) {
      _.unset(inputField, metadatasPath)
    }
  }

  // Update the manipulator for other parts of the process that will use the manipulator
  // as the source of truth
  introspectionManipulator.setResponse(introspectionResponse)
}


function iterateOverObject (obj, fn) {
  for (const key in obj) {
    const val = obj[key]

    if (typeof val !== 'undefined') {
      const newVal = fn({ key, val, parent: obj })
      if (typeof newVal !== 'undefined') {
        obj[key] = newVal
        continue
      } else if (typeof val === 'object') {
        iterateOverObject (val, fn)
        continue
      }
    }
  }
}

function removeTrailingPeriodsFromDescriptions (obj) {
  iterateOverObject(
    obj,
    ({ key, val }) => {
      if (key === 'description' && typeof val === 'string') {
        return stripTrailing(val, '.', {})
      }
    },
  )

  return obj
}


function isUndef(item) {
  return typeof item === 'undefined'
}

module.exports = {
  hideThingsBasedOnMetadata,
  addExamples,
  calculateShouldDocument,
  augmentData,
  removeTrailingPeriodsFromDescriptions,
}
