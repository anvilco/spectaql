import spectaql from 'dist/spectaql'
import {
  pathToSimpleSchema,
  pathToComplexSchema,
  pathToExampleTheme,
} from 'test/helpers'

describe('index', function () {
  def('opts', () => ({
    specData: $.specData,
    themeDir: $.themeDir,
  }))

  def('specData', () => ({
    spectaql: $.spectaql,
    introspection: $.introspection,
    info: $.info,
    servers: $.servers,
  }))

  def('introspection', () => ({
    url: $.introspectionUrl,
    schemaFile: $.schemaFile,
    introspectionFile: $.introspectionFile,
    metadataFile: $.metadataFile,
    spectaqlDirective: $.spectaqlDirective,
    removeTrailingPeriodFromDescriptions:
      $.removeTrailingPeriodFromDescriptions,
    inputValueDeprecation: $.inputValueDeprecation,
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

    inputsDocumentedDefault: true,
    inputDocumentedDefault: true,
    inputFieldDocumentedDefault: true,
    hideInputFieldsOfUndocumentedType: true,

    objectsDocumentedDefault: true,
    objectDocumentedDefault: true,
    fieldDocumentedDefault: true,
    argDocumentedDefault: true,
    hideFieldsOfUndocumentedType: true,

    unionsDocumentedDefault: true,
    unionDocumentedDefault: true,
  }))

  def('schemaFile', () => pathToSimpleSchema)
  def('spectaqlDirective', () => ({
    enable: true,
  }))

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
        return expect(spectaql($.opts)).to.eventually.be.rejectedWith(
          'Please provide either: introspection.url OR servers.url OR info.x-url'
        )
      })

      context('there are servers', function () {
        def('servers', () => [
          {
            url: 'http://foo.com',
            production: true,
            headers: [
              {
                name: 'Foo',
                example: 'Bar <yo>',
                comment: 'Get your Foo from Bar',
              },
            ],
          },
        ])

        it("doesn't error and processes headers", async function () {
          const result = await spectaql($.opts)
          expect(result).to.be.ok
          expect(result.headers).to.eql(
            `# Get your Foo from Bar\nFoo: Bar <yo>`
          )
        })
      })

      // TODO: stub this out so that it gets tested
      context.skip('there is an introspectionUrl (only)', function () {
        def('schemaFile', () => undefined)
        def('introspectionUrl', () => 'http://foo.com')

        it("doesn't error", async function () {
          const result = await spectaql($.opts)
          return expect(result).to.be.ok
        })
      })
    })
  })

  describe('e2e sanity check', function () {
    def('schemaFile', () => pathToComplexSchema)

    it('does not blow up', async function () {
      const result = await spectaql($.opts)
      expect(result).be.an('object').that.includes.keys('items')

      expect(result.items).to.have.length(2)

      expect(result.items[0]).to.include({
        name: 'Operations',
      })

      expect(result.items[0].items).to.have.length(3)

      expect(result.items[0].items[0]).to.include({
        name: 'Queries',
      })
      expect(
        result.items[0].items[0].items.find((item) => item.name === 'myQuery')
      ).to.be.ok

      expect(result.items[0].items[1]).to.include({
        name: 'Mutations',
      })
      expect(
        result.items[0].items[1].items.find(
          (item) => item.name === 'myMutation'
        )
      ).to.be.ok

      expect(result.items[0].items[2]).to.include({
        name: 'Subscriptions',
      })
      expect(
        result.items[0].items[2].items.find(
          (item) => item.name === 'myTypeUpdatedSubscription'
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

    context('it uses custom theme that is MJS', function () {
      def('themeDir', () => pathToExampleTheme)

      // Skipping this in favor of an e2e test using the ./test/build
      // Maybe when this is resolved?
      // https://github.com/nodejs/node/issues/35889
      it.skip('does not blow up', async function () {
        const result = await spectaql($.opts)
        expect(result).be.an('object').that.includes.keys('items')

        expect(result.items).to.have.length(2)

        expect(result.items[0]).to.include({
          name: 'Operations',
        })

        expect(result.items[0].items).to.have.length(1)

        expect(result.items[0].items[0]).to.include({
          name: 'Queries',
        })
        expect(
          result.items[0].items[0].items.find((item) => item.name === 'myQuery')
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
  })

  describe('trailing period removal', function () {
    def('schemaFile', () => pathToSimpleSchema)
    it('does not strip trailing periods by default', async function () {
      const result = await spectaql($.opts)
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
        const result = await spectaql($.opts)
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

  describe('inputValueDeprecation', function () {
    def('schemaFile', () => pathToComplexSchema)
    it('does not support inputValueDeprecation by default and removes the field', async function () {
      const { allOptions, items } = await spectaql($.opts)
      expect(allOptions.specData.introspection.inputValueDeprecation).to.not.be
        .ok

      expect(items).to.have.length.gt(0)
      const filterInput = items[1].items.find(
        (item) => item.name === 'FilterInput'
      )

      expect(filterInput.inputFields).to.be.an('array')
      expect(
        filterInput.inputFields.find((field) => field.name === 'someField')
      ).to.not.be.ok
      expect(
        filterInput.inputFields.find((field) => field.name === 'anotherField')
      ).to.be.ok
    })

    context('inputValueDeprecation is true', function () {
      def('inputValueDeprecation', () => true)

      it('does support inputValueDeprecation', async function () {
        const { allOptions, items } = await spectaql($.opts)
        expect(allOptions.specData.introspection.inputValueDeprecation).to.be.ok
        expect(items).to.have.length.gt(0)

        const filterInput = items[1].items.find(
          (item) => item.name === 'FilterInput'
        )

        expect(filterInput.inputFields).to.be.an('array')
        const someField = filterInput.inputFields.find(
          (field) => field.name === 'someField'
        )
        expect(someField).to.be.ok
        expect(someField).to.include({
          isDeprecated: true,
          deprecationReason: '`someField` is going away',
        })

        expect(
          filterInput.inputFields.find((field) => field.name === 'anotherField')
        ).to.be.ok
      })
    })
  })

  context('Introspection Response has errors', function () {
    def('schemaFile', () => './test/fixtures/bad-schema.gql')

    it('raises error', function () {
      return expect(spectaql($.opts)).to.eventually.be.rejectedWith(
        'Problem with Introspection Query Response'
      )
    })
  })
})
