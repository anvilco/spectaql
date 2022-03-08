const rewire = require('rewire')
const index = rewire('app/index')

describe('index', function () {
  describe('resolveOptions', function () {
    def('options', () => ({}))

    it('defaults work', function () {
      const resolveOptions = index.__get__('resolveOptions')
      const options = resolveOptions($.options)

      expect(options.oneFile).to.be.false
      expect(options.cssBuildMode).to.be.eql('full')

      expect(options.specData.introspection).to.include({
        removeTrailingPeriodFromDescriptions: false,

        metadatasReadPath: 'documentation',
        metadatasWritePath: 'documentation',

        metadatasPath: 'documentation',
        metadatas: true,

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
      })
    })

    context('config yaml specifies some options', function () {
      let revert
      beforeEach(function () {
        revert = index.__set__({
          'loadYaml': () => $.config,
        })
      })

      afterEach(function () {
        revert()
      })

      def('_options', () => ({
        specFile: 'path/to/nowhere.yaml'
      }))

      def('options', () => $._options)

      def('config', () => ({
        spectaql: {
          oneFile: true,
          cssBuildMode: 'basic',
          additionalJsFile: './foo.js',
        }
      }))

      it('uses config overrides', function () {
        const resolveOptions = index.__get__('resolveOptions')
        const options = resolveOptions($.options)

        expect(options.oneFile).to.be.true
        expect(options.cssBuildMode).to.eql('basic')
        expect(options.additionalJsFile.endsWith('foo.js')).to.be.true
      })

      context('CLI specifies some options', function () {
        def('options', () => ({
          ...$._options,
          oneFile: false,
          cssBuildMode: 'ridiculous',
          additionalJsFile: 'bar.js'
        }))


        it('uses CLI options', function () {
          const resolveOptions = index.__get__('resolveOptions')
          const options = resolveOptions($.options)

          expect(options.oneFile).to.be.false
          expect(options.cssBuildMode).to.be.eql('ridiculous')
          expect(options.additionalJsFile.endsWith('bar.js')).to.be.true
        })
      })
    })
  })
})
