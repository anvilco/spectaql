import JSON5 from 'json5'
// https://www.npmjs.com/package/json-stringify-pretty-compact
import stringify from 'json-stringify-pretty-compact'
import cheerio from 'cheerio'
import marked from 'marked'
import highlightJs from 'highlight.js'

import highlightGraphQlFunction from '../spectaql/graphql-hl'
import { analyzeTypeIntrospection } from '../spectaql/type-helpers'

import { Microfiber as IntrospectionManipulator } from 'microfiber'
const GraphQLScalars = require('../helpers/graphql-scalars')

// Some things that we want to display as a primitive/scalar are not able to be dealt with in some
// of the processes we go through. In those cases, we'll have to deal with them as strings and surround
// them with these crazy tags in order to then strip the tags out later when displaying
// them.
const SPECIAL_TAG = 'SPECIALTAG'
const SPECIAL_TAG_REGEX = new RegExp(`"?${SPECIAL_TAG}"?`, 'g')

const QUOTE_TAG = 'QUOTETAG'
const QUOTE_TAG_REGEX = new RegExp(QUOTE_TAG, 'g')

// Map Scalar types to example data to use fro them
const SCALAR_TO_EXAMPLE = {
  String: ['abc123', 'xyz789'],
  Int: [123, 987],
  Float: [123.45, 987.65],
  Boolean: [true, false],
  Date: [
    new Date(),
    new Date(new Date().setMonth(new Date().getMonth() - 6).valueOf()),
  ].map((date) => date.toISOString()),
  DateTime: [
    new Date(),
    new Date(new Date().setMonth(new Date().getMonth() - 6).valueOf()),
  ].map((date) => date.toISOString()),
  JSON: SPECIAL_TAG + '{}' + SPECIAL_TAG,
  ID: [4, '4'],
}

// Configure highlight.js
highlightJs.configure({
  // "useBR": true
})

highlightJs.registerLanguage('graphql', highlightGraphQlFunction)

// Create a custom renderer for highlight.js compatability
const renderer = new marked.Renderer()
renderer.code = highlight

// Configure marked.js
marked.setOptions({
  // highlight: highlight,
  renderer: renderer,
})

function unwindSpecialTags(str) {
  if (typeof str !== 'string') {
    return str
  }

  return str.replace(SPECIAL_TAG_REGEX, '').replace(QUOTE_TAG_REGEX, '"')
}

function jsonReplacer(name, value) {
  return value
  // return addSpecialTags(value)
}

function addSpecialTags(value) {
  if (typeof value !== 'string') return value
  return `${SPECIAL_TAG}${value}${SPECIAL_TAG}`
}

// Exported for testing?
export function addQuoteTags(value) {
  // Don't quote it if it's already been quoted or doesn't exist
  if (!value || typeof value !== 'string' || value.includes(QUOTE_TAG)) {
    return value
  }

  return `${QUOTE_TAG}${value}${QUOTE_TAG}`
}

/**
 * Render a markdown formatted text as HTML.
 * @param {string} `value` the markdown-formatted text
 * @param {boolean} `stripParagraph` the marked-md-renderer wraps generated HTML in a <p>-tag by default.
 *      If this options is set to true, the <p>-tag is stripped.
 * @returns {string} the markdown rendered as HTML.
 */
export function markdown(
  value,
  { stripParagraph = false, addClass = false } = {}
) {
  if (!value) {
    return value
  }

  var html = marked(value)
  // We strip the surrounding <p>-tag, if
  if (stripParagraph) {
    let $ = cheerio.load('<root>' + html + '</root>')('root')
    // Only strip <p>-tags and only if there is just one of them.
    if ($.children().length === 1 && $.children('p').length === 1) {
      html = $.children('p').html()
    }
  }

  if (addClass) {
    let $ = cheerio.load('<root>' + html + '</root>')('root')
    if ($.children().length === 1) {
      $.children().first().addClass(addClass)
      html = $.html()
    }
  }

  return html
}

export function highlight(code, lang) {
  var highlighted
  if (lang) {
    try {
      highlighted = highlightJs.highlight(lang, code).value
    } catch (e) {
      console.error(e)
    }
  }
  if (!highlighted) {
    highlighted = highlightJs.highlightAuto(code).value
  }

  return (
    '<pre><code' +
    (lang
      ? ' class="hljs ' + this.options.langPrefix + lang + '"'
      : ' class="hljs"') +
    '>' +
    highlighted + //code //
    '\n</code></pre>\n'
  )
}

export function getExampleForScalarDefinition(
  scalarDefinition,
  { scalarGraphql = false }
) {
  const { name, kind } = scalarDefinition

  if (kind !== 'SCALAR') {
    return
  }
  let replacement = SCALAR_TO_EXAMPLE[name]
  if (typeof replacement === 'undefined' && scalarGraphql) {
    replacement = GraphQLScalars.getExampleForGraphQLScalar(name)
  }
  if (typeof replacement === 'undefined') {
    return
  }
  replacement = Array.isArray(replacement)
    ? replacement[Math.floor(Math.random() * replacement.length)]
    : replacement
  return ['String', 'Date', 'DateTime'].includes(name)
    ? addSpecialTags(addQuoteTags(replacement))
    : replacement
}

export function introspectionArgsToVariables({
  args,
  introspectionResponse,
  introspectionManipulator,
}) {
  if (!(args && args.length)) {
    return null
  }

  return args.reduce((acc, arg) => {
    acc[arg.name] = introspectionArgToVariable({
      arg,
      introspectionResponse,
      introspectionManipulator,
    })
    return acc
  }, {})
}

// Take an Arg from the Introspection JSON, and figure out it's example variable representation
export function introspectionArgToVariable({
  arg,
  introspectionResponse,
  introspectionManipulator,
}) {
  if (!arg) {
    return null
  }

  // If there is an example, use it.
  if (arg.example) {
    return arg.example
  }

  if (arg.defaultValue) {
    const {
      underlyingType,
      // isRequired,
      isArray,
      // itemsRequired,
    } = analyzeTypeIntrospection(arg.type)

    // console.log({
    //   arg,
    //   // underlyingTypeDefinition,
    //   underlyingType,
    //   isArray,
    // })

    if (typeof arg.defaultValue === 'string') {
      if (underlyingType.kind !== 'ENUM') {
        return JSON5.parse(arg.defaultValue)
      }

      if (!isArray) {
        return arg.defaultValue
      }

      // Take a string like "[RED, GREEN]" and convert it to ["RED", "GREEN"]
      return arg.defaultValue
        .substr(1, arg.defaultValue.length - 2)
        .split(',')
        .map((val) => val.trim())
    }
  }

  introspectionManipulator =
    introspectionManipulator ||
    new IntrospectionManipulator(introspectionResponse)

  const underlyingTypeDefinition = introspectionManipulator.getType(
    IntrospectionManipulator.digUnderlyingType(arg.type)
  )

  return generateIntrospectionReturnTypeExample(
    {
      thing: arg,
      underlyingTypeDefinition,
      originalType: arg.type,
    },
    introspectionResponse.extensionOptions
  )
}

export function introspectionQueryOrMutationToResponse({
  field,
  introspectionResponse,
  introspectionManipulator,
}) {
  introspectionManipulator =
    introspectionManipulator ||
    new IntrospectionManipulator(introspectionResponse)
  const underlyingTypeDefinition = introspectionManipulator.getType(
    IntrospectionManipulator.digUnderlyingType(field.type)
  )

  // No fields? Just a Scalar then, so return a single value.
  if (!underlyingTypeDefinition.fields) {
    return generateIntrospectionReturnTypeExample(
      {
        thing: field,
        underlyingTypeDefinition,
        originalType: field.type,
      },
      introspectionResponse.extensionOptions
    )
  }

  // Fields? OK, it's a complex Object/Type, so we'll have to go through all the top-level fields build an object
  return underlyingTypeDefinition.fields.reduce((acc, field) => {
    const underlyingTypeDefinition = introspectionManipulator.getType(
      IntrospectionManipulator.digUnderlyingType(field.type)
    )
    acc[field.name] = generateIntrospectionReturnTypeExample(
      {
        thing: field,
        underlyingTypeDefinition,
        originalType: field.type,
      },
      introspectionResponse.extensionOptions
    )
    return acc
  }, {})
}

export function generateIntrospectionReturnTypeExample(
  { thing, underlyingTypeDefinition, originalType },
  options
) {
  let example =
    thing.example ||
    originalType.example ||
    underlyingTypeDefinition.example ||
    (underlyingTypeDefinition.kind === 'ENUM' &&
      underlyingTypeDefinition.enumValues.length &&
      addQuoteTags(underlyingTypeDefinition.enumValues[0].name)) ||
    (underlyingTypeDefinition.kind === 'UNION' &&
      underlyingTypeDefinition.possibleTypes.length &&
      addSpecialTags(underlyingTypeDefinition.possibleTypes[0].name)) ||
    getExampleForScalarDefinition(underlyingTypeDefinition, options)

  // console.log({example})
  if (typeof example !== 'undefined') {
    // example = unwindSpecialTags(example)
  } else {
    // example = underlyingTypeDefinition.name
    example = addSpecialTags(underlyingTypeDefinition.name)
  }

  const {
    // underlyingType,
    // isRequired,
    isArray,
    // itemsRequired,
  } = analyzeTypeIntrospection(originalType)

  return isArray && !Array.isArray(example) ? [example] : example
}

export function generateIntrospectionTypeExample({
  type,
  introspectionResponse,
  introspectionManipulator,
}) {
  introspectionManipulator =
    introspectionManipulator ||
    new IntrospectionManipulator(introspectionResponse)
  const fields = type.fields || type.inputFields
  // No fields? Just a Scalar then, so return a single value.
  if (!fields) {
    return generateIntrospectionReturnTypeExample(
      {
        thing: type,
        underlyingTypeDefinition: type,
        originalType: type,
      },
      introspectionResponse.extensionOptions
    )
  }

  // Fields? OK, it's a complex Object/Type, so we'll have to go through all the top-level fields build an object
  return fields.reduce((acc, field) => {
    const underlyingTypeDefinition = introspectionManipulator.getType(
      IntrospectionManipulator.digUnderlyingType(field.type)
    )
    acc[field.name] = generateIntrospectionReturnTypeExample(
      {
        thing: field,
        underlyingTypeDefinition,
        originalType: field.type,
      },
      introspectionResponse.extensionOptions
    )
    return acc
  }, {})
}

export function printSchema(value, _root) {
  if (!value) {
    return ''
  }

  let markedDown
  if (typeof value == 'string') {
    markedDown = marked('```gql\r\n' + value + '\n```')
  } else {
    const stringified = stringify(value, {
      indent: 2,
      replacer: jsonReplacer,
    })
    markedDown = marked('```json\r\n' + stringified + '\n```')
  }

  // There is an issue with `marked` not formatting a leading quote in a single,
  // quoted string value. By unwinding the special tags after converting to markdown
  // we can avoid that issue.
  return cheerio.load(unwindSpecialTags(markedDown)).html()
}
