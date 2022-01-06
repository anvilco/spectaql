const spectaql = require('app/spectaql')
const {
  pathToSimpleSchema,
  pathToComplexSchema,
} = require('test/helpers')


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
    removeTrailingPeriodFromDescriptions: $.removeTrailingPeriodFromDescriptions,
    queriesDocumentedDefault: true,
    queryDocumentedDefault: true,
    queryArgDocumentedDefault: true,
    hideQueriesWithUndocumentedReturnType: true,

    mutationsDocumentedDefault: true,
    mutationDocumentedDefault: true,
    mutationArgDocumentedDefault: true,
    hideMutationsWithUndocumentedReturnType: true,

    typesDocumentedDefault: true,
    typeDocumentedDefault: true,
    fieldDocumentedDefault: true,
    argDocumentedDefault: true,
    hideFieldsWithUndocumentedReturnType: true,
  }))

  def('schemaFile', () => pathToSimpleSchema)

  def('info', () => ({
    ['x-swaggerUrl']: $.swaggerUrl
  }))

  def('swaggerUrl', () => 'http://foo.com')

  describe('Swagger URL related', function () {
    it('works baseline', function () {
      const result = spectaql($.opts)
      return expect(result).to.be.ok
    })

    context('no x-swaggerUrl', function () {
      def('swaggerUrl', () => undefined)
      it('errors', function () {
        return expect(() => spectaql($.opts)).to.throw('Please provide either: introspection.url OR servers.url OR info.x-swaggerUrl for Swagger spec compliance')
      })

      context('there are servers', function () {
        def('servers', () => ([
          {
            url: 'http://foo.com',
          }
        ]))

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
      expect(result).be.an('object').that.includes.keys(
        'paths',
        'definitions',
      )

      expect(result.paths).to.have.length.gt(0)
      expect(result.definitions).to.be.an('object').that.includes.keys(
        'SimpleTypeOne'
      )
    })
  })

  describe('trailing period removal', function () {
    def('schemaFile', () => pathToSimpleSchema)
    it('does not strip trailing periods by default', async function () {
      const result = spectaql($.opts)
      expect(result).be.an('object').that.includes.keys(
        'paths',
        'definitions',
      )

      expect(result.paths).to.have.length.gt(0)
      expect(result.definitions).to.be.an('object').that.includes.keys(
        'MyType'
      )

      const { paths, definitions } = result
      const myQuery = paths[0].post
      expect(myQuery.description).to.eql("A query.")
      expect(myQuery.parameters[0].description).to.eql("An argument to a query.")

      const myType = definitions.MyType
      expect(myType.description).to.eql('A type.')
      expect(myType.properties.myField.description).to.eql('A field on a type.')
      expect(myType.properties.myField.properties.arguments.properties.myArg.description).to.eql('An argument on a field on a type.')
    })

    context('removeTrailingPeriodFromDescriptions is true', function () {
      def('removeTrailingPeriodFromDescriptions', () => true)

      it('does strip trailing periods when asked', async function () {
        const result = spectaql($.opts)
        expect(result).be.an('object').that.includes.keys(
          'paths',
          'definitions',
        )

        expect(result.paths).to.have.length.gt(0)
        expect(result.definitions).to.be.an('object').that.includes.keys(
          'MyType'
        )

        const { paths, definitions } = result
        const myQuery = paths[0].post
        expect(myQuery.description).to.eql("A query")
        expect(myQuery.parameters[0].description).to.eql("An argument to a query")

        const myType = definitions.MyType
        expect(myType.description).to.eql('A type')
        expect(myType.properties.myField.description).to.eql('A field on a type')
        expect(myType.properties.myField.properties.arguments.properties.myArg.description).to.eql('An argument on a field on a type')
      })
    })
  })

  context('Introspection Response has errors', function () {
    def('schemaFile', () => './test/fixtures/bad-schema.gql')

    it('raises error', function () {
      return expect(() => spectaql($.opts)).to.throw('Problem with Introspection Query Response')
    })
  })
})
