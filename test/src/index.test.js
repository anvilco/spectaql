import * as loadYaml from 'dist/lib/loadYaml'
import { TMP_PREFIX } from 'dist/spectaql/utils'
const rewire = require('rewire')
const index = rewire('dist/index')

describe('index', function () {
  afterEach(() => {
    sinon.restore()
  })

  describe('resolveOptions', function () {
    def('options', () => ({}))

    it('defaults work', function () {
      const resolveOptions = index.__get__('resolveOptions')
      const options = resolveOptions($.options)

      expect(options).to.include({
        targetFile: 'index.html',
        embeddable: false,
        oneFile: false,
        resolveWithOutput: true,
      })

      expect(options.targetDir.endsWith('/public')).to.be.true

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

        objectsDocumentedDefault: true,
        objectDocumentedDefault: true,
        fieldDocumentedDefault: true,
        argDocumentedDefault: true,
        hideFieldsOfUndocumentedType: true,
      })

      expect(options.specData.extensions).to.eql({
        graphqlScalarExamples: true,
      })
    })

    context('config yaml specifies some options', function () {
      beforeEach(function () {
        sinon.stub(loadYaml, 'default').callsFake(() => $.config)
      })

      def('_options', () => ({
        specFile: 'path/to/nowhere.yaml',
      }))

      def('options', () => $._options)

      def('config', () => ({
        spectaql: {
          embeddable: true,
          oneFile: true,
          targetDir: null,
          themeDir: './my-custom-theme',
          resolveWithOutput: false,
        },
        introspection: {
          url: 'http://mysite.com/graphql',
          headers: {
            Authorization: 'Bearer s3cretT0k2n',
          },
        },
        extensions: {
          graphqlScalarExamples: false,
        },
      }))

      it('uses config overrides and does not resolve certain things as paths', function () {
        const resolveOptions = index.__get__('resolveOptions')
        const options = resolveOptions($.options)

        expect(options).to.include({
          embeddable: true,
          oneFile: true,
          resolveWithOutput: false,
        })

        // A temp dir
        expect(
          options.targetDir.split('/').pop().startsWith(TMP_PREFIX)
        ).to.be.true
        expect(options.themeDir.endsWith('my-custom-theme')).to.be.true

        // Not a path
        expect(options.specData.introspection.url).to.eql(
          'http://mysite.com/graphql'
        )
        expect(options.specData.introspection.headers).to.eql({
          Authorization: 'Bearer s3cretT0k2n',
        })
        expect(options.specData.extensions).to.eql({
          graphqlScalarExamples: false,
        })
      })

      context('CLI specifies some options', function () {
        def('options', () => ({
          ...$._options,
          embeddable: false,
          oneFile: false,
          targetDir: 'null',
          themeDir: './my-custom-theme-yo-yo',
        }))

        it('uses CLI options', function () {
          const resolveOptions = index.__get__('resolveOptions')
          const options = resolveOptions($.options)

          expect(options).to.include({
            embeddable: false,
            oneFile: false,
          })

          // A temp dir
          expect(
            options.targetDir.split('/').pop().startsWith(TMP_PREFIX)
          ).to.be.true
          expect(options.themeDir.endsWith('my-custom-theme-yo-yo')).to.be.true
        })
      })
    })
  })
})
