---
layout: markdown.hbs

title: Multiple Posts
section: Blog
description: Example of using an associative array in YAML front matter to embed multiple gists on one page.

gists: ['5898072', '5898077']
---
> {{{description}}}

Gists were embedded using the `\{{gist}}` helper from the [handlebars-helpers](https://github.com/assemble/handlebars-helpers) library.

```js
var stripBOM = function(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
};

var condense = function(str) {
  return str.replace(/(\n|\r){2,}/g, '\n');
};

var padcomments = function(str, num) {
  var nl = _str.repeat('\n', (num || 1));
  return str.replace(/(\s*<!--\s)/g, nl + '$1');
};

var prettifyHTML = function(source, options) {
  try {
    return format(source, options);
  } catch (e) {
    grunt.log.error(e);
    grunt.fail.warn('HTML prettification failed.');
  }
};
```
<br>

{{#each gists}}
  {{gist this}}
{{/each}}
