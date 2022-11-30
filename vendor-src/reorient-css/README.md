# reorient-css [![Build Status](https://secure.travis-ci.org/callumlocke/reorient-css.png?branch=master)](http://travis-ci.org/callumlocke/reorient-css)

[![NPM](https://nodei.co/npm/reorient-css.png?downloads=true&stars=true)](https://www.npmjs.org/package/reorient-css)


Updates relative asset URLs (e.g. `url(../images/something.png)`) within a string of CSS to reflect a relocation of the CSS file.

**Example use case:** if you were inlining CSS from `styles/main.css` into a `<style>` element in `index.html` (as part of a build task aiming to reduce HTTP round trips), you could use this function to rewrite all the image/font URLs within the CSS so they still work from the new relative base – in this example, it would prepend all file-relative URLs with `style/` (and resolve any `..` etc).


## Usage

`npm install reorient-css`

```javascript
var reorientCSS = require('reorient-css');

var result = reorientCSS(
  'body { background: url(something.png); }', // css string
  'some/old/stylesheet/file.css',             // old css location
  'some/new/one.css'                          // new css location (this could even be an .html file,
);                                            // if you're inlining the CSS into a <style> element
                                              // - the basename is ignored anyway)

console.log(result.css);
// > body { background: url('../old/stylesheet/something.png'); }
```

### Notes

- It doesn't care whether files exist at the old/new paths – it just uses these path strings to determine the relative path from the new location back to the old location, so it can know how to rewrite the asset URLs.
- Only file-relative URLs are rewritten. Root-relative, absolute and `data:` URLs will be left untouched, as these are expected to work the same regardless of the CSS file's location.
- `behavior` properties (a proprietary IE thing) will be left untouched, because any URLs in these properties are relative to the HTML document, not the CSS file, so in theory they should never change.
  - The only exception is if you are moving CSS from one HTML document to another (ie, in &lt;style&gt; elements). If both the new and old CSS locations you provide are `.html` files, `behavior` properties **will** be reoriented.
- Whitespace and formatting are left untouched.
- The output is an object with a property named `css`, which contains the reoriented CSS string. This object might also contain a `map` property, if you have specified that option (see below).


### Options

The function accepts an optional fourth argument: an object of extra options to pass to [PostCSS](https://github.com/ai/postcss). For example, `{map: true}` will tell it to generate a source map (which will be available in the `map` key of the result object). See the [PostCSS docs](https://github.com/ai/postcss#source-map-1) for more details.


## PostCSS

reorient-css can also be used as a [PostCSS](https://github.com/ai/postcss) processor.

```js
var postcss = require('postcss'),
	reorientCSS = require('reorient-css');

var result = postcss()
	.use( reorientCSS.processor( 'some/old/stylesheet/file.css', 'some/new/one.css' ) )
	.process( 'body { background: url(something.png); }' );

console.log(result.css);
// > body { background: url('../old/stylesheet/something.png'); }
```

## License
Copyright (c) 2014 Callum Locke. Licensed under the MIT license.
