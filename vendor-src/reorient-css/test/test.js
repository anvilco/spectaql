/*global describe, it, before*/

var fs = require('fs')
var path = require('path')
var expect = require('chai').expect
var reorientCSS = require('..')

describe('reorientCSS', function () {
  var css
  before(function () {
    css = fs
      .readFileSync(path.join(__dirname, 'fixtures', 'sample.css'))
      .toString()
  })

  it('works when moving up directories', function () {
    var result = reorientCSS(css, 'styles/foo/main.css', 'index.html')

    expect(result.css).to.equal(
      fs
        .readFileSync(path.join(__dirname, 'expected', 'moving-up.css'))
        .toString()
    )
  })

  it('works when staying at the same level', function () {
    var result = reorientCSS(css, 'styles/main.css', 'styles/other.css')

    expect(result.css).to.equal(
      fs
        .readFileSync(path.join(__dirname, 'expected', 'staying-level.css'))
        .toString()
    )
  })

  it('works when going deeper', function () {
    var result = reorientCSS(
      css,
      'styles/main.css',
      'styles/foo/bar/other.html'
    )

    expect(result.css).to.equal(
      fs.readFileSync(path.join(__dirname, 'expected', 'deeper.css')).toString()
    )
  })

  describe('with Windows-style paths', function () {
    it('works when moving up directories', function () {
      var result = reorientCSS(css, 'styles\\foo\\main.css', 'index.html')

      expect(result.css).to.equal(
        fs
          .readFileSync(path.join(__dirname, 'expected', 'moving-up.css'))
          .toString()
      )
    })

    it('works when staying at the same level', function () {
      var result = reorientCSS(css, 'styles\\main.css', 'styles\\other.css')

      expect(result.css).to.equal(
        fs
          .readFileSync(path.join(__dirname, 'expected', 'staying-level.css'))
          .toString()
      )
    })

    it('works when going deeper', function () {
      var result = reorientCSS(
        css,
        'styles\\main.css',
        'styles\\foo\\bar\\other.html'
      )

      expect(result.css).to.equal(
        fs
          .readFileSync(path.join(__dirname, 'expected', 'deeper.css'))
          .toString()
      )
    })
  })
})
