import * as interpolation from 'dist/lib/interpolation'

const TEST_ENV_PREFIX = 'spectaqltest'

describe('interpolation', function () {
  describe('substituteEnvOnObject', function () {
    beforeEach(function () {
      const env = $.env
      for (const [key, value] of Object.entries(env)) {
        process.env[`${TEST_ENV_PREFIX}_${key}`] = value
      }
    })

    afterEach(function () {
      const env = $.env
      for (const key of Object.keys(env)) {
        delete process.env[`${TEST_ENV_PREFIX}_${key}`]
      }
    })

    def('env', () => ({
      SOME_VAR: 'it worked',
    }))

    it('substitutes things from the environment', function () {
      function generateNormal() {
        return {
          normalString: 'one',
          normalArray: ['one', 1],
          normalObject: {
            nestedNormalString: 'one',
            nestedNormalArray: ['one', 1],
          },
        }
      }
      const obj = {
        ...generateNormal(),
        substituteString: '${spectaqltest_SOME_VAR}',
        substituteArray: ['one', '${spectaqltest_SOME_VAR}'],
        substituteObject: {
          ...generateNormal(),
          substituteString: '${spectaqltest_SOME_VAR}',
          substituteArray: ['one', '${spectaqltest_SOME_VAR}'],
        },
        substituteStringDefault:
          '${spectaqltest_SOME_NON_EXISTENT_VAR:-defaulted}',
        substituteArrayDefault: [
          'one',
          '${spectaqltest_SOME_NON_EXISTENT_VAR:-defaulted}',
        ],
        substituteObjectDefault: {
          ...generateNormal(),
          substituteStringDefault:
            '${spectaqltest_SOME_NON_EXISTENT_VAR:-defaulted}',
          substituteArrayDefault: [
            'one',
            '${spectaqltest_SOME_NON_EXISTENT_VAR:-defaulted}',
          ],
        },
      }

      const substitutedObject = interpolation.substituteEnvOnObject(obj)

      expect(substitutedObject).to.deep.equal({
        normalString: 'one',
        normalArray: ['one', 1],
        normalObject: {
          nestedNormalString: 'one',
          nestedNormalArray: ['one', 1],
        },
        substituteString: 'it worked',
        substituteArray: ['one', 'it worked'],
        substituteObject: {
          normalString: 'one',
          normalArray: ['one', 1],
          normalObject: {
            nestedNormalString: 'one',
            nestedNormalArray: ['one', 1],
          },
          substituteString: 'it worked',
          substituteArray: ['one', 'it worked'],
        },
        substituteStringDefault: 'defaulted',
        substituteArrayDefault: ['one', 'defaulted'],
        substituteObjectDefault: {
          normalString: 'one',
          normalArray: ['one', 1],
          normalObject: {
            nestedNormalString: 'one',
            nestedNormalArray: ['one', 1],
          },
          substituteStringDefault: 'defaulted',
          substituteArrayDefault: ['one', 'defaulted'],
        },
      })
    })
  })
})
