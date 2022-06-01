const interpolateReferences = require('../../../dist/themes/default/helpers/interpolateReferences')

describe('interpolateReferences', function () {
  beforeEach(function () {
    sinon.spy(console, 'warn')
  })

  afterEach(function () {
    sinon.restore()
  })

  it('works', function () {
    expect(
      interpolateReferences(
        '{{Queries.myQuery}} and {{Mutations.myMutation}} and {{Types.MyType}} and {{Subscriptions.myTypeUpdatedSubscription}}'
      )
    ).to.eql(
      '#query-myQuery and #mutation-myMutation and #definition-MyType and #subscription-myTypeUpdatedSubscription'
    )
  })

  def('options', () => ({
    data: {
      root: {
        allOptions: {
          specData: {
            spectaql: {
              errorOnInterpolationReferenceNotFound:
                $.errorOnInterpolationReferenceNotFound,
            },
          },
        },
      },
    },
  }))

  it('throws error when unsupported reference encountered', function () {
    expect(() => interpolateReferences('{{whoops}}', $.options)).to.throw(
      'Unsupported interpolation encountered: "{{whoops}}"'
    )
  })

  context('errorOnInterpolationReferenceNotFound is false', function () {
    def('errorOnInterpolationReferenceNotFound', false)
    it('does not throw error when unsupported reference encountered', function () {
      expect(interpolateReferences('{{whoops}}', $.options)).to.eql(
        '{{whoops}}'
      )

      expect(console.warn).to.have.been.calledOnceWith(
        'WARNING: Unsupported interpolation encountered: "{{whoops}}"'
      )
    })
  })
})
