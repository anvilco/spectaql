'use strict'

var grunt = require('grunt')

exports.clean = {
  allStatic: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/allStatic.html')
    var expected = grunt.file.read('test/expected/allStatic.html')

    test.equal(actual, expected, 'all static files should work')

    test.done()
  },
  dynamicHandlebars: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/dynamicHandlebars.html')
    var expected = grunt.file.read('test/expected/dynamicHandlebars.html')

    test.equal(actual, expected, 'Passed reference to handlebars should work')

    test.done()
  },
  jsonHandlebars: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/sweedish.json')
    var expected = grunt.file.read('test/expected/sweedish.json')

    test.equal(actual, expected, 'json handlebars templates should work')

    test.done()
  },
  dynamicTemplate: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/dynamicTemplate.html')
    var expected = grunt.file.read('test/expected/dynamicTemplate.html')

    test.equal(actual, expected, 'Inline handlebars should work')

    test.done()
  },
  dynamicTemplateData: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/dynamicTemplateData.html')
    var expected = grunt.file.read('test/expected/dynamicTemplateData.html')

    test.equal(actual, expected, 'Inline JSON objects as data should work')

    test.done()
  },
  dynamicPre: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/dynamicPre.html')
    var expected = grunt.file.read('test/expected/dynamicPre.html')

    test.equal(
      actual,
      expected,
      'Inline html as static data before template should work'
    )

    test.done()
  },
  dynamicPost: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/dynamicPost.html')
    var expected = grunt.file.read('test/expected/dynamicPost.html')

    test.equal(
      actual,
      expected,
      'Inline html as static data after template should work'
    )

    test.done()
  },
  allArray: function (test) {
    test.expect(2)
    var germanActual = grunt.file.read('tmp/deep/german.html')
    var romanianActual = grunt.file.read('tmp/deep/romanian.html')
    var germanExpected = grunt.file.read('test/expected/german.html')
    var romanianExpected = grunt.file.read('test/expected/romanian.html')

    test.equal(germanActual, germanExpected)
    test.equal(
      romanianActual,
      romanianExpected,
      'array output should be working'
    )

    test.done()
  },
  globbedTemplateAndOutput: function (test) {
    test.expect(2)

    var shallowActual = grunt.file.read('tmp/deep/spanish.html')
    var shallowExpected = grunt.file.read('test/expected/deep/spanish.html')
    var deepActual = grunt.file.read('tmp/deep/deeper/portuguese.html')
    var deepExpected = grunt.file.read(
      'test/expected/deep/deeper/portuguese.html'
    )

    test.equal(
      shallowActual,
      shallowExpected,
      'Shallow globbed files should generated equally named output files'
    )

    test.equal(
      deepActual,
      deepExpected,
      'Deeply globbed files should generated equally named output files'
    )

    test.done()
  },
  globalJsonGlobbedTemplate: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/deep/globalJsonGlobbedTemplate.html')
    var expected = grunt.file.read(
      'test/expected/globalJsonGlobbedTemplate.html'
    )

    test.equal(
      actual,
      expected,
      'Use specific templateName.json per templateName.handlebars (as in globbedTemplateAndOutput) plus multiple global json on top'
    )

    test.done()
  },
  registerFullPath: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/fullPath.html')
    var expected = grunt.file.read('test/expected/fullPath.html')

    test.equal(
      actual,
      expected,
      'Partials and helpers referenced at their full paths should work when registerFullParth is true'
    )

    test.done()
  },
  concatGlobbed: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/concatGlobbed.html')
    var expected = grunt.file.read('test/expected/concatGlobbed.html')

    test.equal(
      actual,
      expected,
      'Globbed templates should append when output is a single file'
    )

    test.done()
  },
  oneTemplateToManyOutputs: function (test) {
    test.expect(2)

    var actual1 = grunt.file.read('tmp/oneTemplateToManyOutputs1.html')
    var expected1 = grunt.file.read(
      'test/expected/oneTemplateToManyOutputs1.html'
    )

    var actual2 = grunt.file.read('tmp/oneTemplateToManyOutputs2.html')
    var expected2 = grunt.file.read(
      'test/expected/oneTemplateToManyOutputs2.html'
    )

    test.equal(
      actual1,
      expected1,
      'Output should use same template but different data when it is a single file'
    )
    test.equal(
      actual2,
      expected2,
      'Output should use same template but different data when it is a single file'
    )

    test.done()
  },
  helperAndPartial: function (test) {
    test.expect(1)

    var actual = grunt.file.read('tmp/deep/helperAndPartial.html')
    var expected = grunt.file.read('test/expected/helperAndPartial.html')

    test.equal(
      actual,
      expected,
      'Helpers and partials should be corrected renderred'
    )

    test.done()
  },
}
