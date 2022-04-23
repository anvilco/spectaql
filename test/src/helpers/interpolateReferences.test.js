const interpolateReferences = require('../../../dist/themes/default/helpers/interpolateReferences')

describe('interpolateReferences', function () {
  it('works', function () {
    expect(
      interpolateReferences(
        '{{Queries.myQuery}} and {{Mutations.myMutation}} and {{Types.MyType}} and {{Subscriptions.myTypeUpdatedSubscription}}'
      )
    ).to.eql(
      '#query-myQuery and #mutation-myMutation and #definition-MyType and #subscription-myTypeUpdatedSubscription'
    )
  })

  it('throws error when unsupported reference encountered', function () {
    expect(() => interpolateReferences('{{whoops}}')).to.throw(
      'Unsupported interpolation encountered: whoops'
    )
  })
})
