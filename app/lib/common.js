const _ = require('lodash')
const stringify = require('json-stringify-pretty-compact')
const cheerio = require('cheerio')
const marked = require('marked')
const highlight = require('highlight.js')

const highlightGraphQl = require('../spectaql/graphql-hl')
const {
  typeIsArray,
  analyzeTypeIntrospection,
} = require('../spectaql/type-helpers')

const IntrospectionManipulator = require('./Introspection')

// Some things that we want to display as a primitive/scalar are not able to be dealt with in some
// of the processes we go through. In those cases, we'll have to deal with them as strings and surround
// them with these crazy tags in order to then strip the tags out later when displaying
// them.
const SPECIAL_TAG = 'SPECIALTAG'
const SPECIAL_TAG_REGEX = new RegExp(`"?${SPECIAL_TAG}"?`, "g")

const QUOTE_TAG = 'QUOTETAG'
const QUOTE_TAG_REGEX = new RegExp(QUOTE_TAG, "g")

// Map Scalar types to example data to use fro them
const SCALAR_TO_EXAMPLE = {
  String: ['abc123', 'xyz789'],
  Int: [123, 987],
  Float: [123.45, 987.65],
  Boolean: [true, false],
  Date: [new Date(), new Date(new Date().setMonth(new Date().getMonth() - 6).valueOf())].map((date) => date.toISOString()),
  JSON: SPECIAL_TAG + '{}' + SPECIAL_TAG,
}

function unwindSpecialTags (str) {
  if (typeof str !== 'string') {
    return str
  }

  return str.replace(SPECIAL_TAG_REGEX, '').replace(QUOTE_TAG_REGEX, '"')
}

function getExampleForScalar (scalarName) {
  const replacement = SCALAR_TO_EXAMPLE[scalarName]
  if (typeof replacement !== 'undefined') {
    return Array.isArray(replacement) ? replacement[Math.floor(Math.random() * replacement.length)] : replacement
  }
}

function jsonReplacer (name, value) {
  return addSpecialTags(value)
}

function addSpecialTags (value, { placeholdQuotes = false } = {}) {
  if (typeof value !== 'string') return value

  const replacement = getExampleForScalar(value)
  if (typeof replacement !== 'undefined') {
    return replacement
  }

  if (placeholdQuotes) {
    value = addQuoteTags(value)
  }

  return `${SPECIAL_TAG}${value}${SPECIAL_TAG}`
}

function addQuoteTags (value) {
  // Don't quote it if it's already been quoted or doesn't exist
  if (!value || typeof value !== 'string' || value.includes(QUOTE_TAG)) {
    return value
  }

  return `${QUOTE_TAG}${value}${QUOTE_TAG}`
}

function replaceQuotesWithTags (value) {
  if (!value || typeof value !== 'string') {
    return value
  }

  for (const quote of ['"', "'"]) {
    if (value.startsWith(quote) && value.endsWith(quote)) {
      return addQuoteTags(value.substring(1, value.length - 1))
    }
  }

  return value
}

var common = {

  addSpecialTags,

  addQuoteTags,

  replaceQuotesWithTags,

  /**
   * Render a markdown formatted text as HTML.
   * @param {string} `value` the markdown-formatted text
   * @param {boolean} `stripParagraph` the marked-md-renderer wraps generated HTML in a <p>-tag by default.
   *      If this options is set to true, the <p>-tag is stripped.
   * @returns {string} the markdown rendered as HTML.
   */
  markdown: function (value, {stripParagraph = false, addClass = false} = {}) {
    if (!value) {
      return value;
    }

    var html = marked(value)
    // We strip the surrounding <p>-tag, if
    if (stripParagraph) {
      let $ = cheerio.load("<root>" + html + "</root>")('root')
      // Only strip <p>-tags and only if there is just one of them.
      if ($.children().length === 1 && $.children('p').length === 1) {
        html = $.children('p').html()
      }
    }

    if (addClass) {
      let $ = cheerio.load("<root>" + html + "</root>")('root')
      if ($.children().length === 1) {
        $.children().first().addClass(addClass)
        html = $.html()
      }
    }

    return html;
  },

  highlight: function (code, lang) {
    var highlighted;
    if (lang) {
      try {
        highlighted = highlight.highlight(lang, code).value;
      } catch (e) {
        console.error(e)
      }
    }
    if (!highlighted) {
      highlighted = highlight.highlightAuto(code).value;
    }

    return '<pre><code' +
      (lang ?
        ' class="hljs ' + this.options.langPrefix + lang + '"' :
        ' class="hljs"') +
      '>' +
      highlighted //code //
      +
      '\n</code></pre>\n';
  },

  // formatSchema: function(value) {
  //   var cloned;
  //   if (typeof value === 'object' && typeof value.properties === 'object') {
  //     if (value.example) {
  //       // Use the supplied example
  //       value = value.example;
  //       cloned = _.cloneDeep(value)
  //     } else {
  //       // Create json object of keys : type info string
  //       value = value.properties;
  //       cloned = _.cloneDeep(value)
  //       Object.keys(cloned).forEach(function(propName) {
  //         var prop = cloned[propName];
  //         if (prop.type) {
  //           if (prop.example) {
  //             cloned[propName] = prop.example;
  //           }
  //           else {
  //             cloned[propName] = prop.type;
  //             if (prop.format) {
  //               cloned[propName] += ('(' + prop.format + ')')
  //             }
  //           }
  //         }
  //       })
  //     }
  //   }
  //   return cloned;
  // },

  formatExample: function (ref, root, options) {
    if (!ref) {
      console.error('Cannot format NULL object ' + ref)
      // throw 'Cannot format NULL object ' + value;
      return;
    }

    if (typeof (ref) == "string") {
      // console.error('ref is a string! ' + ref)
      return ref
    }

    if (ref.schema) {
      ref = ref.schema
    }

    // NOTE: Large schemas with circular references have been known to exceed
    // maximum stack size, so bail out here before that happens.
    // A better fix is required.
    // /usr/local/bin/node bin/spectacle -d test/fixtures/billing.yaml
    if (!options.depth) {
      options.depth = 0;
    }

    options.depth++;

    if (options.depth > 100) {
      // console.log('max depth', ref)
      return;
    }

    var showReadOnly = options.showReadOnly !== false

    // If there's an example, use it.
    if (ref.example !== undefined) {
      return ref.example
    } else if (typeof ref.default !== 'undefined') {
      // If there is a default, use it.
      return addSpecialTags(ref.default, { placeholdQuotes: true })
    } else if (ref.$ref) { // && !ref.type
      // Don't expand out nested things...just stick their type in there
      return this.getReferenceName(ref.$ref)

      // var remoteRef = this.resolveSchemaReference(ref.$ref, root)
      // if (remoteRef) {
      //   return this.formatExample(remoteRef, root, options)
      // }
    } else if (ref.properties) { // && ref.type == 'object'
      return Object.entries(ref.properties).reduce(
        (acc, [k, v]) => {
          // If the value has a properties.return, then it's a "field" on a Type
          // or an individual "query" or "mutation", and the schema to use for the
          // example is in properties.return
          if (v.type === 'object' && _.get(v, 'properties.return')) {
            v = v.properties.return
          }
          if (showReadOnly || v.readOnly !== true) {
            acc[k] = this.formatExample(v, root, options)
          }

          return acc
        },
        {},
      )
    } else if (ref.allOf) {
      let obj = {};
      ref.allOf.forEach((parent) => {
        var prop = this.formatExample(parent, root, options)
        if (!prop || typeof prop == 'string') {
          // console.log('skipping property', prop, parent)
          return
        }
        obj = Object.assign(prop, obj)
      })

      return obj;
    } else if (ref.anyOf) {
      // Try to sample from one of the non-null possibilities
      let samples = ref.anyOf.filter((schema) => schema.type !== 'null')
      if (!samples.length) {
        samples = ref.anyOf
      }

      return this.formatExample(
        _.sample(samples),
        root,
        options,
       )
    } else if (typeIsArray(ref)) {
      return [this.formatExample(ref.items, root, options)];
    } else if (ref.type) {
      let {
        type,
        title,
        format,
      } = ref

      const replacement = getExampleForScalar(title)
      if (typeof replacement !== 'undefined') {
        type = unwindSpecialTags(replacement)
      }

      return type + (format ? ' (' + format + ')' : '')
    }

    console.error('Cannot format example on property ', ref, ref.$ref)
  },


  // Take an Arg from the Introspection JSON, and figure out it's example variable representation
  introspectionArgToVariable: function ({ arg, introspectionResponse, introspectionManipulator }) {
    if (!arg) {
      return null
    }

    // If there is an example, use it.
    if (arg.example) {
      return arg.example
    }
    // If there is a default, use it.
    if (arg.defaultValue) {
      return addSpecialTags(arg.defaultValue, { placeholdQuotes: true })
    }

    introspectionManipulator = introspectionManipulator || new IntrospectionManipulator(introspectionResponse)

    const underlyingArgType = IntrospectionManipulator.digUnderlyingType(arg.type)
    const underlyingType = introspectionManipulator.getType(underlyingArgType)
    let example = underlyingType.example || getExampleForScalar(underlyingType.name)
    if (typeof example !== 'undefined') {
      example = unwindSpecialTags(example)
    } else {
      example = underlyingType.name
    }

    const {
      // underlyingType,
      // isRequired,
      isArray,
      // itemsRequired,
    } = analyzeTypeIntrospection(arg.type)

    return isArray ? [example] : example
  },

  printSchema: function (value, _root) {
    if (!value) {
      return '';
    }

    let markedDown
    if (typeof (value) == "string") {
      markedDown = marked("```gql\r\n" + value + "\n```")

    } else {
      const stringified = stringify(value, { indent: 2, replacer: jsonReplacer })
      markedDown = marked("```json\r\n" + stringified + "\n```")
    }

    // There is an issue with `marked` not formatting a leading quote in a single,
    // quoted string value. By unwinding the special tags after converting to markdown
    // we can avoid that issue.
    return cheerio.load(unwindSpecialTags(markedDown)).html();
  },

  getReferencePath: function (reference) {
    reference = reference.trim()
    if (reference.indexOf('#') === 0) {
      var hash = reference.substr(2);
      return hash.split('/')
    }

    return ['definitions', reference]
  },

  getReferenceName: function (reference) {
    return this.getReferencePath(reference).pop()
  },

  resolveSchemaReference: function (reference, json) {
    var hashParts = this.getReferencePath(reference)

    var current = json;
    hashParts.forEach(function (hashPart) {
      // Traverse schema from root along the path
      if (hashPart.trim().length > 0) {
        if (typeof current === 'undefined') {
          console.warn("Reference '" + reference + "' cannot be resolved. '" + hashPart + "' is undefined.")
          return {};
        }
        current = current[hashPart];
      }
    })
    return current;
  },
}

// Configure highlight.js
highlight.configure({
  // "useBR": true
})

highlight.registerLanguage("graphql", highlightGraphQl);

// Create a custom renderer for highlight.js compatability
var renderer = new marked.Renderer()
renderer.code = common.highlight

// Configure marked.js
marked.setOptions({
  // highlight: common.highlight,
  renderer: renderer
})

module.exports = common;
