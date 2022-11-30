/*!
 * grunt-prettify <https://github.com/jonschlinkert/grunt-prettify>
 *
 * Copyright (c) 2014 Jon Schlinkert
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Module dependencies
 */

var fs = require('fs');
var fastGlob = require('fast-glob');
var prettify = require('js-beautify').html;
var _ = require('lodash');

module.exports = function (grunt) {

  grunt.task.registerMultiTask('prettify', 'Prettify HTML.', function () {
    // Merge task-specific and/or target-specific options with these defaults.
    var opts = this.options({
      // Custom options
      indent_size: 2,
      condense: true,
      padcomments: false,
      preserveBOM: false,

      // js-beautify options
      indent_char: " ",
      indent_inner_html: true,
      indent_scripts: "keep",
      brace_style: "expand",
      preserve_newline: false,
      max_preserve_newline: 0,
      wrap_line_length: 0
    });

    // Extend default options with options from specified .jsbeautifyrc file
    if (opts.config) {
      opts = _.extend(opts, grunt.file.readJSON(opts.config));
    }

    // If user has used alias for indent_size
    if (!_.isUndefined(opts.indent)) {
      opts.indent_size = opts.indent;
    }

    this.files.forEach(function (fp) {
      var files = fastGlob.sync(fp.src);
      var html = files.map(read).join(opts.separator);
      var str = prettify(html, opts);

      // Reduce multiple newlines to a single newline
      if (opts.condense === true) {
        str = condense(str);
      }

      // Use at your own risk. This option will slow down the build.
      // What does "ocd" mean? Just look at the function, then lookup
      // ocd on wikipedia.
      if (opts.ocd === true) {
        str = ocd(str);
      }

      // Add a single newline above code comments.
      if (opts.padcomments === true) {
        str = padcomments(str, 1);
      }

      if (_.isNumber(opts.padcomments)) {
        str = padcomments(str, opts.padcomments);
      }

      if (str.length < 1) {
        grunt.log.warn('Destination not written because dest file was empty.');
      } else {
        // Write the destination file.
        grunt.file.write(fp.dest, str);
        // Print a success message.
        grunt.log.ok('File "' + fp.dest + '" prettified.');
      }
    });
  });

  function read(fp) {
    var str = fs.readFileSync(fp, 'utf8');
    str = normalize(str);
    return stripBOM(str);
  }

  function normalize(str) {
    return str.replace(/\r/g, '');
  }

  function stripBOM(str) {
    if (str.charCodeAt(0) === 0xFEFF) {
      return str.slice(1);
    }
    return str;
  }

  // Normalize and condense all newlines
  function condense(str) {
    return str.replace(/(\r\n|\n\r|\n|\r){2,}/g, '\n');
  }

  // fix multiline, Bootstrap-style comments
  function padcomments(str, num) {
    var nl = _.repeat('\n', (num || 1));
    return str.replace(/(\s*)(<!--.+)\s*(===.+)?/g, nl + '$1$2$1$3');
  }

  var ocd = function (str) {
    str = str
    // Remove any empty lines at the top of a file.
    .replace(/^\s*/g, '')
    // make <li><a></li> on one line, but only when li > a
    .replace(/(<li>)(\s*)(<a .+)(\s*)(<\/li>)/g, '$1 $3 $5')
    // make <a><span></a> on one line, but only when a > span
    .replace(/(<a.+)(\s*)(<span.+)(\s*)(<\/a>)/g, '$1 $3 $5')
    // Put labels and inputs on one line
    .replace(/(\s*)(<label>)(\s*)(.+)(\s*)(.+)\s*(.+)\s*(<\/label>)/g, '$1$2$4$6$7$8')
    // Fix newlines when <p> has child elements
    // .replace(/(\s*)(<p.+)(\s*)(<.+)(\s*)(.+)(<\/p>)/g, '$1$2$3$4$5$6$1$7')
    // Make <p>text</p> on one line.
    .replace(/(<p.+)(\s*)(<\/p>)/gm, '$1$3')
    // Adjust spacing for span > input
    .replace(/(\s*)(<(?:span|strong|button).+)(\s*)(<.+)(\s*)(<\/(?:span|strong|button)>)/g, '$1$2$1  $4$1$6')
    // Add a newline for tags nested inside <h1-6>
    .replace(/(\s*)(<h[0-6](?:.+)?>)(.*)(<(?:small|span|strong|em)(?:.+)?)(\s*)(<\/h[0-6]>)/g, '$1$2$3$1  $4$1$6')
    // Bring closing comments up to the same line as closing tag.
    .replace(/\s*(<!--\s*\/.+)/g, '$1');
    return str;
  };

};