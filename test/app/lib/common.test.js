const rewire = require('rewire')

const common = rewire('../../../app/lib/common')

describe('common', function () {
  let SPECIAL_TAG
  let QUOTE_TAG
  let unwindSpecialTags

  before(function () {
    SPECIAL_TAG = common.__get__('SPECIAL_TAG')
    QUOTE_TAG = common.__get__('QUOTE_TAG')
    unwindSpecialTags = common.__get__('unwindSpecialTags')
  })

  describe('unwindSpecialTags', function () {
    it('works', function () {
      const pairs = [
        // These get unwound
        [`${SPECIAL_TAG}foo${SPECIAL_TAG}`, 'foo'],
        [`${QUOTE_TAG}foo${QUOTE_TAG}`, '"foo"'],
        [`${SPECIAL_TAG}${QUOTE_TAG}foo${QUOTE_TAG}${SPECIAL_TAG}`, '"foo"'],
        // This is not a string, so nothing changes
        [22, 22]
      ]

      for (const [input, output] of pairs) {
        expect(unwindSpecialTags(input)).to.eql(output)
      }
    })
  })

  describe('addQuoteTags', function () {
    const { addQuoteTags } = common

    it('works', function () {
      const pairs = [
        // Adds quote tag
        ['foo', `${QUOTE_TAG}foo${QUOTE_TAG}`],
        // Doesn't double-add quote tag
        [`${QUOTE_TAG}foo${QUOTE_TAG}`, `${QUOTE_TAG}foo${QUOTE_TAG}`],
        // leaves these alone
        ['', ''],
        [22, 22],
      ]

      for (const [input, output] of pairs) {
        expect(addQuoteTags(input)).to.eql(output)
      }
    })
  })

  describe('replaceQuotesWithTags', function () {
    const { replaceQuotesWithTags } = common

    it('works', function () {
      const pairs = [
        // Adds quote tag
        ['"foo"', `${QUOTE_TAG}foo${QUOTE_TAG}`],
        ["'foo'", `${QUOTE_TAG}foo${QUOTE_TAG}`],
        // Doesn't double-add quote tag
        [`"${QUOTE_TAG}foo${QUOTE_TAG}"`, `${QUOTE_TAG}foo${QUOTE_TAG}`],
        // Doesn't do anything if no quotes
        ['foo', 'foo']
      ]

      for (const [input, output] of pairs) {
        expect(replaceQuotesWithTags(input)).to.eql(output)
      }
    })
  })

  describe('formatExample', function () {
    const { formatExample } = common

    it('BigInt', function () {
        expect(formatExample( {
          type : 'BigInt',
          title: 'BigInt',
          format: 'BigInt',
        }, {}, {depth: 1, scalarGraphql: true})).to.eql('9007199254740991 (BigInt)')
    })
    it('Byte', function () {
      expect(formatExample( {
        type : 'Byte',
        title: 'Byte',
        format: 'Byte',
      }, {}, {depth: 1, scalarGraphql: true})).to.eql('196,189,173,171,167,163 (Byte)')
  })
  it('Time', function () {
    expect(formatExample( {
      type : 'Time',
      title: 'Time',
      format: 'Time',
    }, {}, {depth: 1, scalarGraphql: true})).to.eql('10:15:30Z (Time)')
})
it('EmailAddress', function () {
  expect(formatExample( {
    type : 'EmailAddress',
    title: 'EmailAddress',
    format: 'EmailAddress',
  }, {}, {depth: 1, scalarGraphql: true})).to.eql('test@test.com (EmailAddress)')
})
  })

  describe('printSchema', function () {
    const { printSchema } = common

    it('works', function () {
      const pairs = [
        ['foo', '<pre><code class="hljs language-gql"><span class="hljs-symbol">foo</span>\n</code></pre>'],
        ["'foo'", '<pre><code class="hljs language-gql">\'foo\'\n</code></pre>'],
        [`${SPECIAL_TAG}${QUOTE_TAG}foo${QUOTE_TAG}${SPECIAL_TAG}`, '<pre><code class="hljs language-gql"><span class="hljs-symbol">"foo"</span>\n</code></pre>'],
        [{ foo: 'bar' }, '<pre><code class="hljs language-json">{<span class="hljs-attr">"foo"</span>: <span class="hljs-string">bar</span>}\n</code></pre>'],

        // This is the bug/problem, sadly.
        ['"foo"', '<pre><code class="hljs language-gql">"<span class="hljs-symbol">foo"</span>\n</code></pre>'],
      ]

      for (const [input, output] of pairs) {
        expect(printSchema(input)).to.include(output)
      }
    })
  })
})
