const spectaql = require('app/spectaql')
const {
  pathToSimpleSchema,
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

  context('Introspection Response has errors', function () {
    def('schemaFile', () => './test/fixtures/bad-schema.gql')

    it('raises error', function () {
      return expect(() => spectaql($.opts)).to.throw('Problem with Introspection Query Response')
    })
  })
})
