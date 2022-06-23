const rewire = require('rewire')

const common = rewire('../../../dist/lib/common')

describe('common', function () {
  let SPECIAL_TAG
  let QUOTE_TAG
  let unwindTags

  before(function () {
    SPECIAL_TAG = common.__get__('SPECIAL_TAG')
    QUOTE_TAG = common.__get__('QUOTE_TAG')
    unwindTags = common.__get__('unwindTags')
  })

  describe('enumToJsonFriendly', function () {
    it('works', function () {
      const pairs = [
        ['{foo: BAR, no: "change"}', '{foo: "BAR", no: "change"}'],
        [
          '{foo: [BAR, BAZ], no: "change"}',
          '{foo: ["BAR", "BAZ"], no: "change"}',
        ],
        ['{no: "change"}', '{no: "change"}'],
      ]

      for (const [input, output] of pairs) {
        expect(common.enumToJsonFriendly(input)).to.eql(output)
      }
    })
  })

  describe('unwindTags', function () {
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
        expect(unwindTags(input)).to.eql(output)
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
    def('graphqlScalarExamples', () => true)
    def('otherOptions', () => ({
      extensions: {
        graphqlScalarExamples: $.graphqlScalarExamples,
      },
    }))
    const { getExampleForScalarDefinition } = common

    // Make sure some built-in Scalars still work right.
    it('String', function () {
      expect(
        ['abc123', 'xyz789'].map(
          (val) => `${SPECIAL_TAG}${QUOTE_TAG}${val}${QUOTE_TAG}${SPECIAL_TAG}`
        )
      ).to.include(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'String',
          },
          $.otherOptions
        )
      )
    })

    // Make sure some built-in Scalars still work right.
    it('Int', function () {
      expect([123, 987]).to.include(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'Int',
          },
          $.otherOptions
        )
      )
    })

    it('BigInt', function () {
      expect(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'BigInt',
          },
          $.otherOptions
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
          $.otherOptions
        )
      ).to.eql(`${SPECIAL_TAG}${QUOTE_TAG}10:15:30Z${QUOTE_TAG}${SPECIAL_TAG}`)
    })

    it('EmailAddress', function () {
      expect(
        getExampleForScalarDefinition(
          {
            kind: 'SCALAR',
            name: 'EmailAddress',
          },
          $.otherOptions
        )
      ).to.eql(
        `${SPECIAL_TAG}${QUOTE_TAG}test@test.com${QUOTE_TAG}${SPECIAL_TAG}`
      )
    })

    context('graphqlScalarExamples extension is false', function () {
      def('graphqlScalarExamples', () => false)

      // Make sure some built-in Scalars still work right.
      it('String', function () {
        expect(
          ['abc123', 'xyz789'].map(
            (val) =>
              `${SPECIAL_TAG}${QUOTE_TAG}${val}${QUOTE_TAG}${SPECIAL_TAG}`
          )
        ).to.include(
          getExampleForScalarDefinition(
            {
              kind: 'SCALAR',
              name: 'String',
            },
            $.otherOptions
          )
        )
      })

      // Make sure some built-in Scalars still work right.
      it('Int', function () {
        expect([123, 987]).to.include(
          getExampleForScalarDefinition(
            {
              kind: 'SCALAR',
              name: 'Int',
            },
            $.otherOptions
          )
        )
      })

      it('BigInt', function () {
        expect(
          getExampleForScalarDefinition(
            {
              kind: 'SCALAR',
              name: 'BigInt',
            },
            $.otherOptions
          )
        ).to.be.undefined
      })

      it('Time', function () {
        expect(
          getExampleForScalarDefinition(
            {
              kind: 'SCALAR',
              name: 'Time',
            },
            $.otherOptions
          )
        ).to.be.undefined
      })

      it('EmailAddress', function () {
        expect(
          getExampleForScalarDefinition(
            {
              kind: 'SCALAR',
              name: 'EmailAddress',
            },
            $.otherOptions
          )
        ).to.be.undefined
      })
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
