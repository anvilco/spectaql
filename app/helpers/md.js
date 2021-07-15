var Handlebars = require('handlebars')
var common = require('../lib/common')

/**
 * Render a markdown formatted text as HTML.
 * @param {string} `value` the markdown-formatted text
 * @param {boolean} `options.hash.stripParagraph` the marked-md-renderer wraps generated HTML in a <p>-tag by default.
 *      If this options is set to true, the <p>-tag is stripped.
 * @returns {Handlebars.SafeString} a Handlebars-SafeString containing the provieded
 *      markdown, rendered as HTML.
 */
module.exports = function(value, options) {
  value = value + ''
  const markdownOpts = {}
  if (options.hash) {
    markdownOpts.stripParagraph = options.hash.stripParagraph || false
    markdownOpts.addClass = options.hash.addClass || false
  }
  var html = common.markdown(value, markdownOpts)
  return new Handlebars.SafeString(html)
};
