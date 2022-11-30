grunt = require 'grunt'

exports.embed =
  setUp: (done) ->
    # setup here if necessary
    done()

  default_options: (test) ->
    test.expect 1
    actual = grunt.file.read 'tmp/default.html'
    expected = grunt.file.read 'test/expected/default.html'
    test.equal actual, expected, 'should embed resources correctly with default options.'
    test.done()

  custom_options: (test) ->
    test.expect 1
    actual = grunt.file.read 'tmp/custom.html'
    expected = grunt.file.read 'test/expected/custom.html'
    test.equal actual, expected, 'should embed resources correctly with custom options.'
    test.done()
