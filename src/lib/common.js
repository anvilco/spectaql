import JSON5 from 'json5'
// https://www.npmjs.com/package/json-stringify-pretty-compact
import stringify from 'json-stringify-pretty-compact'
import { load as cheerioLoad } from 'cheerio'
import { marked } from 'marked'
import hljs from 'highlight.js'
import {
  ourFunction as hljsGraphqlLang,
  // hljsFunction as hljsGraphqlLang,
} from '../spectaql/graphql-hl'
import { analyzeTypeIntrospection } from '../spectaql/type-helpers'
import { isUndef, firstNonUndef } from '../spectaql/utils'
import { Microfiber as IntrospectionManipulator } from 'microfiber'
import { getExampleForGraphQLScalar } from '../themes/default/helpers/graphql-scalars'

// Configure highlight.js
hljs.configure({
  // "useBR": true
})

hljs.registerLanguage('graphql', hljsGraphqlLang)

// Create a custom renderer for highlight.js compatibility
const mdRenderer = new marked.Renderer()
mdRenderer.code = highlight

// Configure marked.js
marked.setOptions({
  // highlight: highlight,
  renderer: mdRenderer,
})

// Some things that we want to display as a primitive/scalar are not able to be dealt with in some
// of the processes we go through. In those cases, we'll have to deal with them as strings and surround
// them with these crazy tags in order to then strip the tags out later when displaying
// them.
const SPECIAL_TAG = 'SPECIALTAG'
const SPECIAL_TAG_REGEX = new RegExp(`"?${SPECIAL_TAG}"?`, 'g')

const QUOTE_TAG = 'QUOTETAG'
const QUOTE_TAG_REGEX = new RegExp(QUOTE_TAG, 'g')

const QUOTE_HTML = '&quot;'
const QUOTE_HTML_REGEX = new RegExp(QUOTE_HTML, 'g')

// Map Scalar types to example data to use from them
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

function unwindTags(str) {
  if (typeof str !== 'string') {
    return str
  }

  return replaceQuoteTags(removeSpecialTags(str))
}

function jsonReplacer(name, value) {
  return value
  // return addSpecialTags(value)
}

export function enumToJsonFriendly(str) {
  return (
    str
      // { foo: BAR } => { foo: "BAR" }
      .replace(
        /(:\s*)([a-zA-Z]\w*)/g,
        (match, keyPart, enumValue) => keyPart + '"' + enumValue + '"'
      )
      // { foo: [BAR, BAZ] } => { foo: ["BAR", "BAZ"] }
      .replace(/\[(([a-zA-Z]\w*)[,\s]*)*\]/g, (match) => {
        return (
          '[' +
          match
            .substr(1, match.length - 2)
            .split(',')
            .map((enumValue) => '"' + enumValue.trim() + '"')
            .join(', ') +
          ']'
        )
      })
  )
}

export function addSpecialTags(value) {
  if (typeof value !== 'string' || value.includes(SPECIAL_TAG)) return value
  return `${SPECIAL_TAG}${value}${SPECIAL_TAG}`
}

function removeSpecialTags(value) {
  if (typeof value !== 'string') return value
  return value.replace(SPECIAL_TAG_REGEX, '')
}

// Exported for testing?
export function addQuoteTags(value) {
  // Don't quote it if it's already been quoted or doesn't exist
  if (!value || typeof value !== 'string' || value.includes(QUOTE_TAG)) {
    return value
  }

  return `${QUOTE_TAG}${value}${QUOTE_TAG}`
}

function replaceQuoteTags(value) {
  if (typeof value !== 'string') {
    return value
  }

  return value.replace(QUOTE_TAG_REGEX, QUOTE_HTML)
}

function replaceHtmlQuotesWithQuotes(value) {
  if (typeof value !== 'string') return value
  return value.replace(QUOTE_HTML_REGEX, '"')
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

  let html = marked.parse(value)
  // We strip the surrounding <p>-tag, if
  if (stripParagraph) {
    let $ = cheerioLoad('<root>' + html + '</root>')('root')
    // Only strip <p>-tags and only if there is just one of them.
    if ($.children().length === 1 && $.children('p').length === 1) {
      html = $.children('p').html()
    }
  }

  if (addClass) {
    let $ = cheerioLoad('<root>' + html + '</root>')('root')
    if ($.children().length === 1) {
      $.children().first().addClass(addClass)
      html = $.html()
    }
  }

  return html
}

function highlight(code, language) {
  let highlighted
  if (language) {
    try {
      highlighted = hljs.highlight(code, { language }).value
    } catch (e) {
      console.error(e)
    }
  }
  if (!highlighted) {
    highlighted = hljs.highlightAuto(code).value
  }

  return (
    '<pre><code' +
    (language
      ? ' class="hljs ' + this.options.langPrefix + language + '"'
      : ' class="hljs"') +
    '>' +
    highlighted + //code //
    '\n</code></pre>\n'
  )
}

export function getExampleForScalarDefinition(scalarDefinition, otherOptions) {
  const { name, kind } = scalarDefinition

  if (kind !== 'SCALAR') {
    return
  }
  let replacement
  let wasFromGraphQLScalar = false

  const useGraphqlScalarExamples =
    otherOptions?.extensions?.graphqlScalarExamples

  // If the extension for this is enabled let's see if it's supported by graphql-scalars
  if (useGraphqlScalarExamples) {
    replacement = getExampleForGraphQLScalar(name)
    if (typeof replacement !== 'undefined') {
      wasFromGraphQLScalar = true
    }
  }

  if (typeof replacement === 'undefined') {
    replacement = SCALAR_TO_EXAMPLE[name]
  }

  if (typeof replacement === 'undefined') {
    return
  }

  replacement =
    !wasFromGraphQLScalar && Array.isArray(replacement)
      ? replacement[Math.floor(Math.random() * replacement.length)]
      : replacement

  if (typeof replacement === 'string') {
    replacement = addSpecialTags(addQuoteTags(replacement))
  }

  return replacement
}

export function introspectionArgsToVariables({
  args,
  introspectionResponse,
  introspectionManipulator,
  extensions,
}) {
  if (!(args && args.length)) {
    return null
  }

  return args.reduce((acc, arg) => {
    acc[arg.name] = introspectionArgToVariable({
      arg,
      introspectionResponse,
      introspectionManipulator,
      extensions,
    })
    return acc
  }, {})
}

// Take an Arg from the Introspection JSON, and figure out it's example variable representation
function introspectionArgToVariable({
  arg,
  introspectionResponse,
  introspectionManipulator,
  extensions,
}) {
  if (!arg) {
    return null
  }

  // If there is an example, use it.
  if (!isUndef(arg.example)) {
    return arg.example
  }

  if (arg.defaultValue) {
    const {
      underlyingType,
      // isRequired,
      isArray,
      // itemsRequired,
    } = analyzeTypeIntrospection(arg.type)

    if (typeof arg.defaultValue === 'string') {
      if (underlyingType.kind !== 'ENUM') {
        return JSON5.parse(enumToJsonFriendly(arg.defaultValue))
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

  const otherOptions = {
    extensions,
  }

  return generateIntrospectionReturnTypeExample(
    {
      thing: arg,
      underlyingTypeDefinition,
      originalType: arg.type,
    },
    otherOptions
  )
}

export function introspectionQueryOrMutationToResponse({
  field,
  introspectionResponse,
  introspectionManipulator,
  extensions,
}) {
  introspectionManipulator =
    introspectionManipulator ||
    new IntrospectionManipulator(introspectionResponse)

  const { isArray } = analyzeTypeIntrospection(field.type)
  const underlyingTypeDefinition = introspectionManipulator.getType(
    IntrospectionManipulator.digUnderlyingType(field.type)
  )

  const otherOptions = {
    extensions,
  }

  // No fields? Just a Scalar then, so return a single value.
  if (!underlyingTypeDefinition.fields) {
    return generateIntrospectionReturnTypeExample(
      {
        thing: field,
        underlyingTypeDefinition,
        originalType: field.type,
      },
      otherOptions
    )
  }

  // Fields? OK, it's a complex Object/Type, so we'll have to go through all the top-level fields build an object
  const exampleObject = underlyingTypeDefinition.fields.reduce((acc, field) => {
    const underlyingTypeDefinition = introspectionManipulator.getType(
      IntrospectionManipulator.digUnderlyingType(field.type)
    )
    acc[field.name] = generateIntrospectionReturnTypeExample(
      {
        thing: field,
        underlyingTypeDefinition,
        originalType: field.type,
      },
      otherOptions
    )
    return acc
  }, {})

  return isArray ? [exampleObject] : exampleObject
}

function generateIntrospectionReturnTypeExample(
  { thing, underlyingTypeDefinition, originalType, quoteEnum = false },
  otherOptions
) {
  let example = firstNonUndef([
    thing.example,
    originalType.example,
    underlyingTypeDefinition.example,
  ])
  if (isUndef(example)) {
    example =
      (underlyingTypeDefinition.kind === 'ENUM' &&
        underlyingTypeDefinition.enumValues.length &&
        (quoteEnum
          ? addQuoteTags(underlyingTypeDefinition.enumValues[0].name)
          : underlyingTypeDefinition.enumValues[0].name)) ||
      (underlyingTypeDefinition.kind === 'UNION' &&
        underlyingTypeDefinition.possibleTypes.length &&
        addSpecialTags(underlyingTypeDefinition.possibleTypes[0].name)) ||
      getExampleForScalarDefinition(underlyingTypeDefinition, otherOptions)
  }

  if (typeof example !== 'undefined') {
    // example = unwindTags(example)
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
  extensions,
}) {
  introspectionManipulator =
    introspectionManipulator ||
    new IntrospectionManipulator(introspectionResponse)

  const otherOptions = {
    extensions,
  }

  const fields = type.fields || type.inputFields
  // No fields? Just a Scalar then, so return a single value.
  if (!fields) {
    return generateIntrospectionReturnTypeExample(
      {
        thing: type,
        underlyingTypeDefinition: type,
        originalType: type,
        // For the Example on an Enum Type, we want it quoted
        quoteEnum: true,
      },
      otherOptions
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
      otherOptions
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
    markedDown = marked.parse('```gql\r\n' + value + '\n```')
  } else {
    const stringified = stringify(value, {
      indent: 2,
      replacer: jsonReplacer,
    })
    markedDown = marked.parse('```json\r\n' + stringified + '\n```')
  }

  // Highlight.js, when dealing with JSON, will convert quotes into &quot;, which will always render
  // in the browser, so we get lots of things double-quoted. So, we replace "&quot;" with '"' before
  // unwinding things and passing them to Cheerio.
  const quoted = replaceHtmlQuotesWithQuotes(markedDown)

  // There is an issue with `marked` not formatting a leading quote in a single,
  // quoted string value. By unwinding the special tags after converting to markdown
  // we can avoid that issue.
  return cheerioLoad(unwindTags(quoted)).html()
}
