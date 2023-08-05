import isEmpty from 'lodash/isEmpty'
import set from 'lodash/set'

import { DirectiveLocation } from 'graphql'

import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils'

import { Microfiber as IntrospectionManipulator, KINDS } from 'microfiber'

export const DEFAULT_DIRECTIVE_NAME = 'spectaql'
export const DEFAULT_DIRECTIVE_OPTION_NAME = 'SpectaQLOption'

const MICROFIBER_OPTIONS = Object.freeze({
  fixQueryAndMutationAndSubscriptionTypes: false,
  removeUnusedTypes: false,
  removeFieldsWithMissingTypes: false,
  removeArgsWithMissingTypes: false,
  removeInputFieldsWithMissingTypes: false,
  removePossibleTypesOfMissingTypes: false,
  cleanupSchemaImmediately: false,
})

/** attempt to parse one example value */
function parseExample(val) {
  try {
    return JSON.parse(val)
  } catch {
    return String(val)
  }
}

const OPTION_TO_CONVERTER_FN = {
  undocumented: (val) => val === true || val === 'true',
  documented: (val) => val === true || val === 'true',
  example: (val) => parseExample(val),
  examples: (vals) => JSON.parse(vals),
}

export function generateSpectaqlSdl({
  directiveName = DEFAULT_DIRECTIVE_NAME,
  optionsTypeName = DEFAULT_DIRECTIVE_OPTION_NAME,
} = {}) {
  return (
    generateDirectiveSdl({ directiveName, optionsTypeName }) +
    '\n' +
    generateOptionsSdl({ optionsTypeName }) +
    '\n'
  )
}

export function generateDirectiveSdl({
  directiveName = DEFAULT_DIRECTIVE_NAME,
  optionsTypeName = DEFAULT_DIRECTIVE_OPTION_NAME,
} = {}) {
  // https://www.apollographql.com/docs/apollo-server/schema/creating-directives/#supported-locations
  // QUERY | MUTATION | SUBSCRIPTION | FIELD | FRAGMENT_DEFINITION | FRAGMENT_SPREAD | INLINE_FRAGMENT |
  // VARIABLE_DEFINITION | SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE |
  // UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
  return `directive @${directiveName}(options: [${optionsTypeName}]) on ${Object.values(
    DirectiveLocation
  ).join(' | ')}`
}

export function generateOptionsSdl({
  optionsTypeName = DEFAULT_DIRECTIVE_OPTION_NAME,
} = {}) {
  return `input ${optionsTypeName} { key: String!, value: String! }`
}

function processDirective(directive) {
  return (directive?.options || []).reduce((acc, { key: option, value }) => {
    if (OPTION_TO_CONVERTER_FN[option]) {
      acc[option] = OPTION_TO_CONVERTER_FN[option](value)
    }
    return acc
  }, {})
}

export function generateSpectaqlDirectiveSupport({
  options: spectaqlDirectiveOptions = {},
  userSdl = '',
} = {}) {
  const directables = []

  const {
    onlyAddIfMissing,
    directiveName = DEFAULT_DIRECTIVE_NAME,
    optionsTypeName = DEFAULT_DIRECTIVE_OPTION_NAME,
  } = spectaqlDirectiveOptions

  let { directiveSdl, optionsSdl } = spectaqlDirectiveOptions

  if (
    !directiveSdl &&
    (!userSdl.includes(`directive @${directiveName}`) || !onlyAddIfMissing)
  ) {
    directiveSdl = generateSpectaqlSdl(spectaqlDirectiveOptions)
  }

  if (
    !optionsSdl &&
    (!userSdl.includes(`input ${optionsTypeName}`) || !onlyAddIfMissing)
  ) {
    optionsSdl = generateOptionsSdl(spectaqlDirectiveOptions)
  }

  function typeHandler(type, schema, mapperKind) {
    const directive = getDirective(schema, type, 'spectaql')?.[0]
    if (!isEmpty(directive)) {
      directables.push({
        directive: processDirective(directive),
        type,
        mapperKind,
      })
    }
  }

  function configHandler(config, fieldName, typeName, schema, mapperKind) {
    const directive = getDirective(schema, config, 'spectaql')?.[0]

    if (!isEmpty(directive)) {
      directables.push({
        directive: processDirective(directive),
        config,
        fieldName,
        typeName,
        mapperKind,
      })
    }
  }

  function enumValueHandler(
    config,
    typeName,
    schema,
    externalValue,
    mapperKind
  ) {
    const directive = getDirective(schema, config, 'spectaql')?.[0]

    if (!isEmpty(directive)) {
      directables.push({
        directive: processDirective(directive),
        config,
        typeName,
        externalValue,
        mapperKind,
      })
    }
  }

  const HANDLER_MAP = {
    [MapperKind.TYPE]: (...args) => typeHandler(...args, MapperKind.TYPE),
    [MapperKind.SCALAR_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.SCALAR_TYPE),
    [MapperKind.ENUM_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.ENUM_TYPE),
    [MapperKind.COMPOSITE_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.COMPOSITE_TYPE),
    [MapperKind.OBJECT_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.OBJECT_TYPE),
    [MapperKind.INPUT_OBJECT_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.INPUT_OBJECT_TYPE),
    [MapperKind.ABSTRACT_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.ABSTRACT_TYPE),
    [MapperKind.UNION_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.UNION_TYPE),
    [MapperKind.INTERFACE_TYPE]: (...args) =>
      typeHandler(...args, MapperKind.INTERFACE_TYPE),
    [MapperKind.ROOT_OBJECT]: (...args) =>
      typeHandler(...args, MapperKind.ROOT_OBJECT),
    [MapperKind.QUERY]: (...args) => typeHandler(...args, MapperKind.QUERY),
    [MapperKind.MUTATION]: (...args) =>
      typeHandler(...args, MapperKind.MUTATION),
    [MapperKind.SUBSCRIPTION]: (...args) =>
      typeHandler(...args, MapperKind.SUBSCRIPTION),
    [MapperKind.ENUM_VALUE]: (...args) =>
      enumValueHandler(...args, MapperKind.ENUM_VALUE),
    [MapperKind.FIELD]: (...args) => configHandler(...args, MapperKind.FIELD),
    [MapperKind.OBJECT_FIELD]: (...args) =>
      configHandler(...args, MapperKind.OBJECT_FIELD),
    [MapperKind.ROOT_FIELD]: (...args) =>
      configHandler(...args, MapperKind.ROOT_FIELD),
    [MapperKind.QUERY_ROOT_FIELD]: (...args) =>
      configHandler(...args, MapperKind.QUERY_ROOT_FIELD),
    [MapperKind.MUTATION_ROOT_FIELD]: (...args) =>
      configHandler(...args, MapperKind.MUTATION_ROOT_FIELD),
    [MapperKind.SUBSCRIPTION_ROOT_FIELD]: (...args) =>
      configHandler(...args, MapperKind.SUBSCRIPTION_ROOT_FIELD),
    [MapperKind.INTERFACE_FIELD]: (...args) =>
      configHandler(...args, MapperKind.INTERFACE_FIELD),
    [MapperKind.COMPOSITE_FIELD]: (...args) =>
      configHandler(...args, MapperKind.COMPOSITE_FIELD),
    [MapperKind.INPUT_OBJECT_FIELD]: (...args) =>
      configHandler(...args, MapperKind.INPUT_OBJECT_FIELD),
    [MapperKind.ARGUMENT]: (...args) =>
      configHandler(...args, MapperKind.ARGUMENT),
    // [MapperKind.DIRECTIVE]: (...args) => configHandler(...args, MapperKind.DIRECTIVE),
  }

  return {
    directables,
    directiveName,
    directiveSdl,
    optionsTypeName,
    optionsSdl,
    transformer: (schema) => {
      return mapSchema(schema, HANDLER_MAP)
    },
  }
}

const MAPPER_KIND_TO_KIND_MAP = Object.freeze({
  [MapperKind.OBJECT_FIELD]: KINDS.OBJECT,
  [MapperKind.QUERY_ROOT_FIELD]: KINDS.OBJECT,
  [MapperKind.MUTATION_ROOT_FIELD]: KINDS.OBJECT,
  [MapperKind.SUBSCRIPTION_ROOT_FIELD]: KINDS.OBJECT,
  [MapperKind.INTERFACE_FIELD]: KINDS.INTERFACE,
  [MapperKind.ENUM_VALUE]: KINDS.ENUM,
})

const MAPPER_KIND_TO_STUFF_MAP = Object.freeze({
  [MapperKind.ARGUMENT]: {
    fnName: 'getArg',
    typeKind: KINDS.OBJECT,
  },
  [MapperKind.INPUT_OBJECT_FIELD]: {
    fnName: 'getField',
    typeKind: KINDS.INPUT_OBJECT,
  },
})

export const addMetadataFromDirectables = ({
  directables,
  directiveName,
  optionsTypeName,
  introspectionQueryResponse,
  metadatasWritePath,
}) => {
  const microfiber = new IntrospectionManipulator(
    introspectionQueryResponse,
    MICROFIBER_OPTIONS
  )

  const typeFnMap = {
    ObjectTypeDefinition: ({ type }) =>
      microfiber.getType({ kind: KINDS.OBJECT, name: type.name }),
    ScalarTypeDefinition: ({ type }) =>
      microfiber.getType({ kind: KINDS.SCALAR, name: type.name }),
    EnumTypeDefinition: ({ type }) =>
      microfiber.getType({ kind: KINDS.ENUM, name: type.name }),
    InterfaceTypeDefinition: ({ type }) =>
      microfiber.getType({ kind: KINDS.INTERFACE, name: type.name }),
    UnionTypeDefinition: ({ type }) =>
      microfiber.getType({ kind: KINDS.UNION, name: type.name }),
    InputObjectTypeDefinition: ({ type }) =>
      microfiber.getType({ kind: KINDS.INPUT_OBJECT, name: type.name }),
  }

  const configFnMap = {
    FieldDefinition: ({ type, config, typeName, fieldName, mapperKind }) => {
      const typeKind = MAPPER_KIND_TO_KIND_MAP[mapperKind]
      if (!typeKind) {
        console.error(new Error('Unsupported mapperKind'), {
          type,
          config,
          mapperKind,
          typeName,
          fieldName,
        })
        return
      }
      return microfiber.getField({ typeKind, typeName, fieldName })
    },
    InputValueDefinition: ({
      type,
      config,
      typeName,
      fieldName,
      mapperKind,
      astNode,
    }) => {
      const { fnName, typeKind } = MAPPER_KIND_TO_STUFF_MAP[mapperKind] || {}
      if (!typeKind) {
        console.error(new Error('Unsupported mapperKind'), {
          type,
          config,
          mapperKind,
          typeName,
          fieldName,
        })
        return
      }

      return microfiber[fnName]({
        typeKind,
        typeName,
        fieldName,
        argName: astNode.name.value,
      })
    },
    EnumValueDefinition: ({
      type,
      config,
      typeName,
      externalValue,
      mapperKind,
    }) => {
      const typeKind = MAPPER_KIND_TO_KIND_MAP[mapperKind]
      if (!typeKind) {
        console.error(new Error('Unsupported mapperKind'), {
          type,
          config,
          mapperKind,
          typeName,
          externalValue,
        })
        return
      }
      return microfiber.getField({
        typeKind,
        typeName,
        fieldName: externalValue,
      })
    },
  }

  for (const {
    directive,
    type,
    config,
    fieldName,
    typeName,
    externalValue,
    mapperKind,
  } of directables) {
    if (!directive || !Object.keys(directive).length) {
      continue
    }

    const map = type ? typeFnMap : config ? configFnMap : {}
    const astNode = (type || config).astNode

    const fn = map[astNode.kind]
    if (fn) {
      const typeDef = fn({
        type,
        config,
        typeName,
        fieldName,
        externalValue,
        mapperKind,
        astNode,
      })
      if (typeDef) {
        set(typeDef, metadatasWritePath, directive)
      } else {
        console.error(new Error('Unsupported typeDef'), {
          type,
          config,
          typeName,
          fieldName,
          externalValue,
          mapperKind,
          astNode,
        })
      }
    } else {
      console.error(new Error('Unsupported astNode.kind'), {
        type,
        config,
        typeName,
        fieldName,
        externalValue,
        astNode,
      })
    }
  }

  // Bye-bye directive, and any types you may have only been the one who cared about...
  microfiber.removeDirective({ name: directiveName })
  microfiber.removeType({ kind: KINDS.INPUT_OBJECT, name: optionsTypeName })

  return microfiber.getResponse()
}
