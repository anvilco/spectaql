import _ from 'lodash'
import {
  Microfiber as IntrospectionManipulator,
  KINDS,
  isReservedType,
  typesAreSame,
} from 'microfiber'

import { isUndef } from './utils'
import { analyzeTypeIntrospection } from './type-helpers'
import { addSpecialTags, addQuoteTags } from '../lib/common'
import stripTrailing from '../themes/default/helpers/stripTrailing'

export const calculateShouldDocument = ({ undocumented, documented, def }) => {
  return undocumented !== true && (documented === true || def === true)
}

export function augmentData(args) {
  const introspectionManipulator = createIntrospectionManipulator(args)

  args = {
    ...args,
    introspectionManipulator,
  }

  hideThingsBasedOnMetadata(args)

  addExamples(args)

  removeMetadata(args)

  return introspectionManipulator.getResponse()
}

export function createIntrospectionManipulator(args) {
  const {
    introspectionResponse,
    introspectionOptions: { microfiberOptions },
  } = args

  return new IntrospectionManipulator(introspectionResponse, microfiberOptions)
}

// TODO: Separate out the metadata copying into JSON Schema results into its own thing?
export function hideThingsBasedOnMetadata({
  introspectionManipulator,
  introspectionOptions,
}) {
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

function hideTypes({ introspectionManipulator, introspectionOptions }) {
  const {
    metadatasPath,
    queriesDocumentedDefault,
    mutationsDocumentedDefault,
    subscriptionsDocumentedDefault,
    objectsDocumentedDefault,
    objectDocumentedDefault,
    inputsDocumentedDefault,
    inputDocumentedDefault,
    unionsDocumentedDefault,
    unionDocumentedDefault,
    enumsDocumentedDefault,
    enumDocumentedDefault,
  } = introspectionOptions

  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const subscriptionType = introspectionManipulator.getSubscriptionType()

  const types = introspectionManipulator.getAllTypes({
    includeReserved: false,
    includeQuery: true,
    includeMutation: true,
    includeSubscription: true,
  })

  for (const type of types) {
    let allThingsDocumentedDefault = objectsDocumentedDefault
    let individualThingsDocumentedDefault = !!objectDocumentedDefault
    if (typesAreSame(type, queryType)) {
      allThingsDocumentedDefault = queriesDocumentedDefault
      individualThingsDocumentedDefault = true
    } else if (typesAreSame(type, mutationType)) {
      allThingsDocumentedDefault = !!mutationsDocumentedDefault
      individualThingsDocumentedDefault = true
    } else if (typesAreSame(type, subscriptionType)) {
      allThingsDocumentedDefault = !!subscriptionsDocumentedDefault
      individualThingsDocumentedDefault = true
    } else if (type.kind === KINDS.INPUT_OBJECT) {
      allThingsDocumentedDefault = !!inputsDocumentedDefault
      individualThingsDocumentedDefault = !!inputDocumentedDefault
    } else if (type.kind === KINDS.ENUM) {
      allThingsDocumentedDefault = !!enumsDocumentedDefault
      individualThingsDocumentedDefault = !!enumDocumentedDefault
    } else if (type.kind === KINDS.UNION) {
      allThingsDocumentedDefault = !!unionsDocumentedDefault
      individualThingsDocumentedDefault = !!unionDocumentedDefault
    }

    const metadata = _.get(type, metadatasPath, {})
    const shouldDocument =
      !!allThingsDocumentedDefault &&
      calculateShouldDocument({
        ...metadata,
        def: !!individualThingsDocumentedDefault,
      })

    if (!shouldDocument) {
      introspectionManipulator.removeType({
        kind: type.kind,
        name: type.name,
      })
    }
  }
}

// This handles fields on Types, as well as individual queries
// and mutations.
//
// ** Should be called after hideTypes so that fields can be hidden
// if their return Type is also hidden - if the options say to do that **
function hideFields(options = {}) {
  const { introspectionManipulator, introspectionOptions } = options

  const {
    metadatasPath,
    queryDocumentedDefault,
    mutationDocumentedDefault,
    subscriptionDocumentedDefault,
    fieldDocumentedDefault,
    inputFieldDocumentedDefault,
  } = introspectionOptions

  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const subscriptionType = introspectionManipulator.getSubscriptionType()

  const types = introspectionManipulator.getAllTypes({
    includeReserved: false,
    includeQuery: true,
    includeMutation: true,
    includeSubscription: true,
  })

  for (const type of types) {
    // Don't mess with reserved GraphQL types
    // if (isReservedType(type)) {
    //   continue
    // }

    let defaultShowHide =
      type.kind === KINDS.INPUT_OBJECT
        ? inputFieldDocumentedDefault
        : fieldDocumentedDefault

    if (queryType && typesAreSame(type, queryType)) {
      defaultShowHide = !!queryDocumentedDefault
    } else if (mutationType && typesAreSame(type, mutationType)) {
      defaultShowHide = !!mutationDocumentedDefault
    } else if (subscriptionType && typesAreSame(type, subscriptionType)) {
      defaultShowHide = !!subscriptionDocumentedDefault
    }

    // Handle OBJECT.fields AND INPUT_OBJECT.inputFields
    for (const field of type.fields ||
      type.inputFields ||
      type.enumValues ||
      []) {
      const metadata = _.get(field, metadatasPath, {})
      const shouldDocument = calculateShouldDocument({
        ...metadata,
        def: defaultShowHide,
      })
      if (!shouldDocument) {
        introspectionManipulator.removeField({
          typeKind: type.kind,
          typeName: type.name,
          fieldName: field.name,
        })
      }
    }
  }
}

function hideArguments(args = {}) {
  const { introspectionManipulator, introspectionOptions } = args

  const {
    metadatasPath,
    queryArgDocumentedDefault,
    mutationArgDocumentedDefault,
    subscriptionArgDocumentedDefault,
    argDocumentedDefault,
  } = introspectionOptions

  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const subscriptionType = introspectionManipulator.getSubscriptionType()

  const types = introspectionManipulator.getAllTypes({
    includeReserved: false,
    includeQuery: true,
    includeMutation: true,
    includeSubscription: true,
  })

  for (const type of types) {
    // Don't mess with reserved GraphQL types
    // if (isReservedType(type)) {
    //   continue
    // }

    let defaultShowHide = argDocumentedDefault
    if (queryType && typesAreSame(type, queryType)) {
      defaultShowHide = !!queryArgDocumentedDefault
    } else if (mutationType && typesAreSame(type, mutationType)) {
      defaultShowHide = !!mutationArgDocumentedDefault
    } else if (subscriptionType && typesAreSame(type, subscriptionType)) {
      defaultShowHide = !!subscriptionArgDocumentedDefault
    }

    for (const field of type.fields || []) {
      for (const arg of field.args || []) {
        const metadata = _.get(arg, metadatasPath, {})
        const shouldDocument = calculateShouldDocument({
          ...metadata,
          def: defaultShowHide,
        })
        if (!shouldDocument) {
          introspectionManipulator.removeArg({
            typeKind: type.kind,
            typeName: type.name,
            fieldName: field.name,
            argName: arg.name,
          })
        }
      }
    }
  }
}

export function addExamples(args = {}) {
  const dynamicExamplesProcessingModule = _.get(
    args,
    'introspectionOptions.dynamicExamplesProcessingModule'
  )

  let processor = () => {}
  if (dynamicExamplesProcessingModule) {
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
    } catch (e) {
      if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
        console.warn('\n\n\nCOULD NOT LOAD EXAMPLE PROCESSOR\n\n\n')
        return args
      } else {
        throw e
      }
    }
  }

  const { introspectionManipulator, introspectionOptions } = args

  const { metadatasPath } = introspectionOptions

  const introspectionResponse = introspectionManipulator.getResponse()

  const types = introspectionResponse.__schema.types

  const queryType = introspectionManipulator.getQueryType()
  const mutationType = introspectionManipulator.getMutationType()
  const subscriptionType = introspectionManipulator.getSubscriptionType()

  for (const type of types) {
    // Don't mess with reserved GraphQL types at all
    if (isReservedType(type)) {
      continue
    }

    const isQueryOrMutationOrSubscription =
      !!(queryType && typesAreSame(type, queryType)) ||
      !!(mutationType && typesAreSame(type, mutationType)) ||
      !!(subscriptionType && typesAreSame(type, subscriptionType))

    if (!isQueryOrMutationOrSubscription) {
      handleExamples({ type })
    }

    for (const field of type.fields || []) {
      // Don't add examples to fields on the Query or Mutation types...because they are actually
      // queries or mutations, and we don't support that.
      if (!isQueryOrMutationOrSubscription) {
        handleExamples({ type, field })
      }

      for (const arg of field.args || []) {
        handleExamples({ type, field, arg })
      }
    }

    for (const inputField of type.inputFields || []) {
      handleExamples({ type, inputField })
    }
  }

  // Update the manipulator for other parts of the process that will use the manipulator
  // as the source of truth
  introspectionManipulator.setResponse(introspectionResponse)

  return {
    introspectionManipulator,
    introspectionOptions,
  }

  function getExistingExample(thing) {
    let { example, examples } = _.get(thing, metadatasPath, {})
    if (examples && examples.length) {
      example = examples[Math.floor(Math.random() * examples.length)]
    }

    return example
  }

  function handleExamples({ type, field, inputField, arg }) {
    const thing = arg || inputField || field || type
    const typeForAnalysis = thing === type ? type : thing.type
    const typeAnalysis = analyzeTypeIntrospection(typeForAnalysis)

    let example = getExistingExample(thing)
    if (!isUndef(example)) {
      thing.example = example
    }

    example = processor({ ...typeAnalysis, type, field, arg, inputField })

    if (!isUndef(example)) {
      thing.example = example
    }

    if (thing.kind === KINDS.SCALAR && typeof thing.example === 'string') {
      thing.example = addSpecialTags(addQuoteTags(thing.example))
    }
  }
}

// Get rid of all the metadata entries
function removeMetadata(args = {}) {
  const { introspectionManipulator, introspectionOptions } = args

  const { metadatasPath } = introspectionOptions

  const introspectionResponse = introspectionManipulator.getResponse()

  const types = introspectionResponse.__schema.types

  for (const type of types) {
    // Don't mess with reserved GraphQL types
    if (isReservedType(type)) {
      continue
    }

    _.unset(type, metadatasPath)

    for (const field of type.fields || []) {
      _.unset(field, metadatasPath)

      for (const arg of field.args || []) {
        _.unset(arg, metadatasPath)
      }
    }

    for (const inputField of type.inputFields || []) {
      _.unset(inputField, metadatasPath)
    }
  }

  // Update the manipulator for other parts of the process that will use the manipulator
  // as the source of truth
  introspectionManipulator.setResponse(introspectionResponse)
}

function iterateOverObject(obj, fn) {
  for (const key in obj) {
    const val = obj[key]

    if (typeof val !== 'undefined') {
      const newVal = fn({ key, val, parent: obj })
      if (typeof newVal !== 'undefined') {
        obj[key] = newVal
        continue
      } else if (typeof val === 'object') {
        iterateOverObject(val, fn)
        continue
      }
    }
  }
}

export function removeTrailingPeriodsFromDescriptions(obj) {
  iterateOverObject(obj, ({ key, val }) => {
    if (key === 'description' && typeof val === 'string') {
      return stripTrailing(val, '.', {})
    }
  })

  return obj
}
