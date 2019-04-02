module.exports = function (e) {

    var VARIABLES = {
        className: 'code',
        begin: '\\$',
        end: '\\w+',
        excludeEnd: false
    }

    var TYPES = {
        className: "type",
        begin: "[^\\w][A-Z][a-z]",
        end: "[!\\W]",
        excludeEnd: false
    };

    var FRAGMENT = {
        className: "type",
        begin: /\.\.\./,
        end: /Fragment\n/,        
        excludeEnd: false
    };

    var ARGS = {
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

    var LITERALS = {
        keyword: "query mutation subscription|10 input schema directive interface union scalar fragment|10 enum on ...",
        literal: 'true false null'
    };

    var FIELD = {
        className: 'symbol',
        begin: /\w/,
        end: /\n/,
        keywords: LITERALS,
        excludeEnd: true,
    }

    var QUERY = {
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