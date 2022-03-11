const rewire = require('rewire')

const common = rewire('../../../dist/lib/common')

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
        [`${QUOTE_TAG}foo${QUOTE_TAG}`, '&quot;foo&quot;'],
        [
          `${SPECIAL_TAG}${QUOTE_TAG}foo${QUOTE_TAG}${SPECIAL_TAG}`,
          '&quot;foo&quot;',
        ],
        // This is not a string, so nothing changes
        [22, 22],
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

  describe('getExampleForScalarDefinition', function () {
    const { getExampleForScalarDefinition } = common

    it('BigInt', function () {
      expect(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'BigInt',
          },
          { scalarGraphql: true }
        )
      ).to.equal(9007199254740991n)
    })
    it('Time', function () {
      expect(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'Time',
          },
          { scalarGraphql: true }
        )
      ).to.eql('10:15:30Z')
    })
    it('EmailAddress', function () {
      expect(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'EmailAddress',
          },
          { scalarGraphql: true }
        )
      ).to.eql('test@test.com')
    })
  })

  describe('printSchema', function () {
    const { printSchema } = common

    it('works', function () {
      const pairs = [
        [
          'foo',
          '<pre><code class="hljs language-gql"><span class="hljs-symbol">foo</span>\n</code></pre>',
        ],
        [
          "'foo'",
          '<pre><code class="hljs language-gql">\'<span class="hljs-symbol">foo\'</span>\n</code></pre>',
        ],
        [
          `${SPECIAL_TAG}${QUOTE_TAG}foo${QUOTE_TAG}${SPECIAL_TAG}`,
          '<pre><code class="hljs language-gql"><span class="hljs-symbol">"foo"</span>\n</code></pre>',
        ],
        [
          { foo: 'bar' },
          '<pre><code class="hljs language-json"><span class="hljs-punctuation">{</span><span class="hljs-attr">"foo"</span><span class="hljs-punctuation">:</span> <span class="hljs-string">"bar"</span><span class="hljs-punctuation">}</span>\n</code></pre>',
        ],

        // This is the bug/problem, sadly.
        [
          '"foo"',
          '<pre><code class="hljs language-gql">"<span class="hljs-symbol">foo"</span>\n</code></pre>',
        ],
      ]

      for (const [input, output] of pairs) {
        expect(printSchema(input)).to.include(output)
      }
    })
  })
})
