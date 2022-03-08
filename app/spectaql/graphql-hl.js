// Oh hi!
module.exports = function (e) {
  const VARIABLES = {
    className: 'code',
    begin: '\\$',
    end: '\\w+',
    excludeEnd: false
  }

  const TYPES = {
    className: "type",
    begin: "[^\\w][A-Z][a-z]",
    end: "[!\\W]",
    excludeEnd: false
  };

  const FRAGMENT = {
    className: "type",
    begin: /\.\.\./,
    end: /Fragment\b/,
    excludeEnd: false
  };

  const ARGS = {
    className: "tag",
    begin: /\(/,
    end: /\)/,
    excludeBegin: false,
    excludeEnd: false,
    contains: [
      TYPES,
      e.NUMBER_MODE,
      VARIABLES
    ]
  }

  const LITERALS = {
    keyword: "query mutation subscription|10 input schema directive interface union scalar fragment|10 enum on ...",
    literal: 'true false null'
  };

  const FIELD = {
    className: 'symbol',
    begin: /\w/,
    end: /\n/,
    keywords: LITERALS,
    excludeEnd: true,
  }

  const QUERY = {
    className: "tag",
    begin: /{/,
    end: /}/,
    contains: [FIELD, FRAGMENT],
    excludeBegin: false,
    excludeEnd: false,
    relevance: 0,
    illegal: '\\S'
  };

  FIELD.contains = [ARGS, QUERY]

  return {
    aliases: ["gql"],
    keywords: LITERALS,
    contains: [QUERY, FIELD],
    illegal: /([;<']|BEGIN)/
  };
}