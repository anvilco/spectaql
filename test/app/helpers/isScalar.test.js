const isScalar = require('../../../app/helpers/isScalar')

describe('isScalar', function () {
  it('works', function () {
    const defaultScalar = {
      title: 'Float',
      type: 'number',
    }

    const customScalar = {
      title: 'MyScalar',
      type: 'object',
    }

    const notQuiteScalar = {
      title: 'NotSureWhatIAm',
      type: 'string'
    }

    expect(isScalar(defaultScalar)).to.be.true
    expect(isScalar(customScalar)).to.be.true

    expect(isScalar(notQuiteScalar)).to.be.false
    expect(isScalar(null)).to.be.false
  })
  it('works for grapql-scalar', function () {
    const emailAddressScalar = {
      title: 'EmailAddress',
      type: 'string',
    }

    expect(isScalar(emailAddressScalar)).to.be.true
  })
})
