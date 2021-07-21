const isUnionType = require('../../../app/helpers/isUnionType')

describe('isUnionType', function () {
  it('works', function () {

    const validUnion = {
      desription: 'A valid Union',
      oneOf: [
        { $ref: 'a/type-a' },
        { $ref: 'a/type-b' }
      ]
    }

    const hasType = {
      desription: 'Why do I have a type?',
      type: 'object',
      oneOf: [
        { $ref: 'a/type-a' },
        { $ref: 'a/type-b' }
      ]
    }

    const missingRef = {
      desription: 'Why am I missing a ref?',
      oneOf: [
        { $ref: 'a/type-a' },
        { foo: 'bar' },
      ]
    }

    expect(isUnionType(validUnion)).to.be.true

    expect(isUnionType(hasType)).to.be.false
    expect(isUnionType(missingRef)).to.be.false
    expect(isUnionType(null)).to.be.false
  })
})
