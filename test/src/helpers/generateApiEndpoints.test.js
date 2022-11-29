import generateApiEndpoints from 'dist/themes/default/helpers/generateApiEndpoints'

describe('generateApiEndpoints', function () {
  def('displayAllServers', false)
  def('production', true)

  def('options', () => ({
    data: {
      root: {
        allOptions: {
          specData: {
            spectaql: {
              displayAllServers: $.displayAllServers,
            },
          },
        },
        url: $.url,
        server: $.server,
        servers: $.servers,
      },
    },
  }))

  def('url', () => 'foorl')
  def('server', () => ({
    url: 'serverFoorl',
  }))
  def('servers', () => [
    {
      url: 'server1url',
      description: 'Server One',
    },
    {
      url: 'server2url',
      description: 'Server Two',
      production: $.production,
    },
  ])

  context('displayAllServers is false', function () {
    it('uses url', function () {
      expect(generateApiEndpoints($.options)).to.eql('foorl')
    })

    context('url is falsy', function () {
      def('url', () => undefined)

      it('uses server.url', function () {
        expect(generateApiEndpoints($.options)).to.eql('serverFoorl')
      })

      context('server is falsy', function () {
        def('server', () => undefined)

        it('uses production server url', function () {
          expect(generateApiEndpoints($.options)).to.eql('server2url')
        })

        context('production is false', function () {
          def('production', () => undefined)

          it('uses first server url', function () {
            expect(generateApiEndpoints($.options)).to.eql('server1url')
          })
        })
      })
    })
  })

  context('displayAllServers is true', function () {
    def('displayAllServers', () => true)

    it('works', function () {
      expect(generateApiEndpoints($.options)).to.eql(
        '# Server One:\nserver1url\n# Server Two:\nserver2url\n'
      )
    })

    context('servers are empty', function () {
      def('servers', () => [])
      it('uses default message', function () {
        expect(generateApiEndpoints($.options)).to.eql('<<url is missing>>')
      })
    })
  })
})
