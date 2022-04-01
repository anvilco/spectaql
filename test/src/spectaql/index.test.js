const spectaql = require('dist/spectaql')
const { pathToSimpleSchema, pathToComplexSchema } = require('test/helpers')

describe('index', function () {
  def('opts', () => ({
    specData: $.specData,
  }))

  def('specData', () => ({
    introspection: $.introspection,
    info: $.info,
    servers: $.servers,
  }))

  def('introspection', () => ({
    url: $.introspectionUrl,
    schemaFile: $.schemaFile,
    introspectionFile: $.introspectionFile,
    metadataFile: $.metadataFile,
    removeTrailingPeriodFromDescriptions:
      $.removeTrailingPeriodFromDescriptions,
    queriesDocumentedDefault: true,
    queryDocumentedDefault: true,
    queryArgDocumentedDefault: true,
    hideQueriesWithUndocumentedReturnType: true,

    mutationsDocumentedDefault: true,
    mutationDocumentedDefault: true,
    mutationArgDocumentedDefault: true,
    hideMutationsWithUndocumentedReturnType: true,

    subscriptionsDocumentedDefault: true,
    subscriptionDocumentedDefault: true,

    objectsDocumentedDefault: true,
    objectDocumentedDefault: true,
    fieldDocumentedDefault: true,
    argDocumentedDefault: true,
    hideFieldsOfUndocumentedType: true,
  }))

  def('schemaFile', () => pathToSimpleSchema)

  def('info', () => ({
    ['x-url']: $.url,
  }))

  def('url', () => 'http://foo.com')

  describe('URL related', function () {
    it('works baseline', function () {
      const result = spectaql($.opts)
      return expect(result).to.be.ok
    })

    context('no x-url', function () {
      def('url', () => undefined)
      it('errors', function () {
        return expect(() => spectaql($.opts)).to.throw(
          'Please provide either: introspection.url OR servers.url OR info.x-url'
        )
      })

      context('there are servers', function () {
        def('servers', () => [
          {
            url: 'http://foo.com',
          },
        ])

        it("doesn't error", function () {
          const result = spectaql($.opts)
          return expect(result).to.be.ok
        })
      })

      // TODO: stub this out so that it gets tested
      context.skip('there is an introspectionUrl (only)', function () {
        def('schemaFile', () => undefined)
        def('introspectionUrl', () => 'http://foo.com')

        it("doesn't error", function () {
          const result = spectaql($.opts)
          return expect(result).to.be.ok
        })
      })
    })
  })

  describe('e2e sanity check', function () {
    def('schemaFile', () => pathToComplexSchema)
    it('does not blow up', async function () {
      const result = spectaql($.opts)
      expect(result).be.an('object').that.includes.keys('items')

      expect(result.items).to.have.length.gt(0)

      expect(result.items[0]).to.include({
        name: 'Operations',
      })

      expect(result.items[0].items).to.have.length.gt(0)
      expect(result.items[0].items[0]).to.include({
        name: 'Queries',
      })
      expect(
        result.items[0].items[0].items.find((item) => item.name === 'myQuery')
      ).to.be.ok

      expect(result.items[0].items).to.have.length.gt(0)
      expect(result.items[0].items[1]).to.include({
        name: 'Mutations',
      })
      expect(
        result.items[0].items[1].items.find(
          (item) => item.name === 'myMutation'
        )
      ).to.be.ok

      expect(result.items[1]).to.include({
        name: 'Types',
      })

      expect(result.items[1].items).to.have.length.gt(0)
      expect(
        result.items[1].items.find((item) => item.name === 'SimpleTypeOne')
      ).to.be.ok
    })
  })

  describe('trailing period removal', function () {
    def('schemaFile', () => pathToSimpleSchema)
    it('does not strip trailing periods by default', async function () {
      const result = spectaql($.opts)
      expect(result).be.an('object').that.includes.keys('items')

      expect(result.items).to.have.length.gt(0)

      const myQuery = result.items[0].items[0].items.find(
        (item) => item.name === 'myQuery'
      )

      expect(myQuery.description).to.eql('A query.')
      expect(myQuery.args[0].description).to.eql('An argument to a query.')

      const myType = result.items[1].items.find(
        (item) => item.name === 'MyType'
      )
      expect(myType).to.be.ok
      expect(myType.description).to.eql('A type.')

      const myField = myType.fields.find((field) => field.name === 'myField')
      expect(myField).to.be.ok
      expect(myField.description).to.eql('A field on a type.')

      const myArg = myField.args.find((arg) => arg.name === 'myArg')
      expect(myArg).to.be.ok
      expect(myArg.description).to.eql('An argument on a field on a type.')
    })

    context('removeTrailingPeriodFromDescriptions is true', function () {
      def('removeTrailingPeriodFromDescriptions', () => true)

      it('does strip trailing periods when asked', async function () {
        const result = spectaql($.opts)
        expect(result).be.an('object').that.includes.keys('items')

        expect(result.items).to.have.length.gt(0)

        const myQuery = result.items[0].items[0].items.find(
          (item) => item.name === 'myQuery'
        )

        expect(myQuery.description).to.eql('A query')
        expect(myQuery.args[0].description).to.eql('An argument to a query')

        const myType = result.items[1].items.find(
          (item) => item.name === 'MyType'
        )
        expect(myType).to.be.ok
        expect(myType.description).to.eql('A type')

        const myField = myType.fields.find((field) => field.name === 'myField')
        expect(myField).to.be.ok
        expect(myField.description).to.eql('A field on a type')

        const myArg = myField.args.find((arg) => arg.name === 'myArg')
        expect(myArg).to.be.ok
        expect(myArg.description).to.eql('An argument on a field on a type')
      })
    })
  })

  context('Introspection Response has errors', function () {
    def('schemaFile', () => './test/fixtures/bad-schema.gql')

    it('raises error', function () {
      return expect(() => spectaql($.opts)).to.throw(
        'Problem with Introspection Query Response'
      )
    })
  })
})
