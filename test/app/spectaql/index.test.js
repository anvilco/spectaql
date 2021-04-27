const spectaql = require('app/spectaql')

describe('index', function () {

  def('opts', () => ({
    specData: $.specData,
  }))

  def('specData', () => ({
    introspection: $.introspection,
  }))

  def('introspection', () => ({
    url: $.introspectionUrl,
    schemaFile: $.schemaFile,
    introspectionFile: $.introspectionFile,
    metadataFile: $.metadataFile,
  }))

  context('Introspection Response has errors', function () {
    def('schemaFile', () => './test/fixtures/bad-schema.txt')

    it('raises error', function () {
      return expect(() => spectaql($.opts)).to.throw('Problem with Introspection Query Response')
    })
  })
})
