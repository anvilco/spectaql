// This is our own home-rolled highlight.js language handler function
export function ourFunction(hljs) {
  const VARIABLES = {
    className: 'code',
    begin: '\\$',
    end: '\\w+',
    excludeEnd: false,
  }

  const TYPES = {
    className: 'type',
    begin: '[^\\w][A-Z][a-z]',
    end: '[!\\W]',
    excludeEnd: false,
  }

  const FRAGMENT = {
    className: 'type',
    begin: /\.\.\./,
    end: /Fragment\b/,
    excludeEnd: false,
  }

  const ARGS = {
    className: 'tag',
    begin: /\(/,
    end: /\)/,
    excludeBegin: false,
    excludeEnd: false,
    contains: [TYPES, hljs.NUMBER_MODE, VARIABLES],
  }

  const LITERALS = {
    // keyword: 'query mutation subscription|10 input schema directive interface union scalar fragment|10 enum on ...',
    // literal: 'true false null',
    keyword: [
      'query',
      'mutation',
      'subscription',
      'type',
      'input',
      'schema',
      'directive',
      'interface',
      'union',
      'scalar',
      'fragment',
      'enum',
      'on',
      '...',
    ],
    literal: ['true', 'false', 'null'],
  }

  const FIELD = {
    className: 'symbol',
    begin: /\w/,
    end: /\n/,
    keywords: LITERALS,
    excludeEnd: true,
  }

  const QUERY = {
    className: 'tag',
    begin: /{/,
    end: /}/,
    contains: [FIELD, FRAGMENT],
    excludeBegin: false,
    excludeEnd: false,
    relevance: 0,
    illegal: '\\S',
  }

  FIELD.contains = [ARGS, QUERY]

  const INLINE_FRAGMENT = {
    className: 'type',
    begin: / \.\.\. on /,
    end: /\}/,
    contains: [QUERY],
  }

  QUERY.contains.push(INLINE_FRAGMENT)

  return {
    aliases: ['gql'],
    keywords: LITERALS,
    contains: [QUERY, FIELD],
    illegal: /([;<']|BEGIN)/,
  }
}

// This is the function that comes from the highlight.js repo...not sure we like it as much as our own.
export function hljsFunction(hljs) {
  const regex = hljs.regex
  const GQL_NAME = /[_A-Za-z][_0-9A-Za-z]*/
  return {
    name: 'GraphQL',
    aliases: ['gql'],
    case_insensitive: true,
    disableAutodetect: false,
    keywords: {
      keyword: [
        'query',
        'mutation',
        'subscription',
        'type',
        'input',
        'schema',
        'directive',
        'interface',
        'union',
        'scalar',
        'fragment',
        'enum',
        'on',
      ],
      literal: ['true', 'false', 'null'],
    },
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.NUMBER_MODE,
      {
        scope: 'punctuation',
        match: /[.]{3}/,
        relevance: 0,
      },
      {
        scope: 'punctuation',
        begin: /[!():=[\]{|}]{1}/,
        relevance: 0,
      },
      {
        scope: 'variable',
        begin: /\$/,
        end: /\W/,
        excludeEnd: true,
        relevance: 0,
      },
      {
        scope: 'meta',
        match: /@\w+/,
        excludeEnd: true,
      },
      {
        scope: 'symbol',
        begin: regex.concat(GQL_NAME, regex.lookahead(/\s*:/)),
        relevance: 0,
      },
    ],
    illegal: [/[;<']/, /BEGIN/],
  }
}
