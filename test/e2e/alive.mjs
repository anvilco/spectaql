import { strict as assert } from 'node:assert';
import {
  run,
  parseCliOptions,
  resolveOptions,
  loadData,
  buildSchemas,
  augmentData,
  generateSpectaqlSdl,
  generateDirectiveSdl,
  generateOptionsSdl,
} from 'spectaql'

console.warn('Trying on Node ' + process.version)

assert(typeof run === 'function')

const cliOptions = parseCliOptions()
assert.deepEqual(cliOptions, {
  specFile: './config.yml',
})

const options = {
  ...cliOptions,
  themeDir: './custom-theme',
}

const resolvedOptions = resolveOptions(options)
(async function () {
  let result = run(resolvedOptions)
  assert(result instanceof Promise)

  const { html } = await result

  assert(typeof html === 'string')


  assert(html.includes('Operationzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'))

  result = loadData(resolvedOptions)
  assert(result instanceof Promise)

  let data = await result
  assert(Array.isArray(data.items))
  assert(data.items.length === 2)
  assert.equal(data.items[0].name, 'Operationzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')


  result = generateSpectaqlSdl()
  assert(result.includes('directive @spectaql(options: [SpectaQLOption]) on QUERY'))
  assert(result.includes('input SpectaQLOption { key: String!, value: String! }'))

  result = generateDirectiveSdl()
  assert(result.includes('directive @spectaql(options: [SpectaQLOption]) on QUERY'))

  result = generateOptionsSdl()
  assert(result.includes('input SpectaQLOption { key: String!, value: String! }'))

  result = buildSchemas(resolvedOptions)
  const { graphQLSchema, introspectionResponse } = result

  assert.equal(graphQLSchema.constructor.name, 'GraphQLSchema')

  assert(Array.isArray(introspectionResponse.__schema.types))

  result = augmentData({
    introspectionResponse,
    introspectionOptions: {
      ...resolvedOptions.specData.introspection,
    }
  })

  assert(Array.isArray(result.__schema.types))

  console.log('I worked!')
})()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
