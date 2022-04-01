const interpolateReferences = require('../../../dist/themes/default/helpers/interpolateReferences')

describe('interpolateReferences', function () {
  it('works', function () {
    expect(
      interpolateReferences(
        '{{Queries.myQuery}} and {{Mutations.myMutation}} and {{Types.MyType}}'
      )
    ).to.eql(
      '#operation-myquery-Queries and #operation-mymutation-Mutations and #definition-MyType'
    )
  })

  it('throws error when unsupported reference encountered', function () {
    expect(() => interpolateReferences('{{whoops}}')).to.throw(
      'Unsupported interpolation encountered: whoops'
    )
  })
})
