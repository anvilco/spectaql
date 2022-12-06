ResourceEmbedder = require '../src/resource-embedder'
path = require 'path'
fs = require 'fs'
wrench = require 'wrench'

# wrench.rmdirSyncRecursive path.join(__dirname, '../temp'), true
# wrench.copyDirSyncRecursive path.join(__dirname, 'fixtures'), path.join(__dirname, '../temp'),
#   forceDelete: true

inputFilePath = path.resolve(path.join(__dirname, '../temp/messy.html'))
expectedFilePath = path.resolve(path.join(__dirname, '../temp/expected/messy.html'))

exports['resource-embedder'] = (test) ->
  test.expect 3
  
  wrench.copyDirSyncRecursive(
    path.join(__dirname, 'fixtures'),
    path.join(__dirname, '../temp'),
    {forceDelete: true}
  )

  correctOutput = fs.readFileSync(expectedFilePath).toString()

  embedder = new ResourceEmbedder
    htmlFile: inputFilePath
    deleteEmbeddedFiles: true

  embedder.get (result, warnings) ->
    fs.writeFileSync path.join(__dirname, '../test-dump.html'), result

    if (result isnt correctOutput)
      console.log '\nEXPECTED:\n', correctOutput
      console.log '\nGOT:\n', result

    test.ok (result is correctOutput), 'processed markup should be as expected.'

    test.strictEqual warnings.length, 2

    test.ok !fs.existsSync(path.join(__dirname, '../temp/scripts/mm.js'))

    test.done()
