import { strict as assert } from 'node:assert'
import {
  run,
  parseCliOptions,
  resolveOptions as resolveOptionsFunction,
  loadData,
  buildSchemas,
  augmentData,
  generateSpectaqlSdl,
  generateDirectiveSdl,
  generateOptionsSdl,
} from 'spectaql'

import { TMP_PREFIX } from 'spectaql/dist/spectaql/utils.js'

console.warn('Trying on Node ' + process.version)

assert(typeof run === 'function')

const cliOptions = parseCliOptions()
assert.deepEqual(cliOptions, {
  specFile: './config.yml',
})

let options = {
  ...cliOptions,
  themeDir: './custom-theme',
}

let resolvedOptions = resolveOptionsFunction(options)
assert(resolvedOptions.targetDir.endsWith('/public'))
;(async function () {
  let result = run(resolvedOptions)
  assert(result instanceof Promise)

  let { html } = await result

  assert(typeof html === 'string')

  assert(html.includes('Operationzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'))

  result = loadData(resolvedOptions)
  assert(result instanceof Promise)

  let data = await result
  assert(Array.isArray(data.items))
  assert(data.items.length === 2)
  assert.equal(data.items[0].name, 'Operationzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')

  result = generateSpectaqlSdl()
  assert(
    result.includes('directive @spectaql(options: [SpectaQLOption]) on QUERY')
  )
  assert(
    result.includes('input SpectaQLOption { key: String!, value: String! }')
  )

  result = generateDirectiveSdl()
  assert(
    result.includes('directive @spectaql(options: [SpectaQLOption]) on QUERY')
  )

  result = generateOptionsSdl()
  assert(
    result.includes('input SpectaQLOption { key: String!, value: String! }')
  )

  result = buildSchemas(resolvedOptions)
  const { graphQLSchema, introspectionResponse } = result

  assert.equal(graphQLSchema.constructor.name, 'GraphQLSchema')

  assert(Array.isArray(introspectionResponse.__schema.types))

  result = augmentData({
    introspectionResponse,
    introspectionOptions: {
      ...resolvedOptions.specData.introspection,
    },
  })

  assert(Array.isArray(result.__schema.types))

  // Try it with some different options
  options = {
    ...resolvedOptions,
  }
  options.targetDir = null

  resolvedOptions = resolveOptionsFunction(options)
  // A tmp directory
  assert(resolvedOptions.targetDir.split('/').pop().startsWith(TMP_PREFIX))

  result = run(resolvedOptions)
  assert(result instanceof Promise)
  ;({ html } = await result)

  assert(typeof html === 'string')

  console.log('I worked!')
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
