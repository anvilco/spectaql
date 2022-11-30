# resource-embedder

[![Build Status](https://secure.travis-ci.org/callumlocke/resource-embedder.png?branch=master)](http://travis-ci.org/callumlocke/resource-embedder) [![Dependency Status](https://david-dm.org/callumlocke/resource-embedder.svg)](https://david-dm.org/callumlocke/resource-embedder)

> Also available as a Grunt plugin: [grunt-embed](https://github.com/callumlocke/grunt-embed)

Automatically embeds the contents of external scripts and stylesheets into HTML markup.

Takes an HTML file path and generates a string of modified markup. Any small external scripts and stylesheets are replaced with inline `<script>...</script>` or `<style>...</style>` elements.

This reduces the number of HTTP requests in return for inflating your HTML. It's up to you to decide whether this is a good trade-off in your situation.


## Usage

    npm install resource-embedder

```javascript
var ResourceEmbedder = require('@anvilco/resource-embedder');

var embedder = new ResourceEmbedder('./app/page.html');

embedder.get(function (markup) {
  fs.writeFileSync('./dist/page.html', markup);
});
```

### Choosing which files to embed

By default, **any scripts or stylesheets below 5KB in size** will be embedded. You can change this setting in the options.

You can also manually decide the threshold for each resource using a `data-embed` attribute.

To always embed a particular resource, regardless of filesize, just include the attribute:

```html
<script src="foo.js" data-embed></script>
<link rel="stylesheet" href="foo.css" data-embed>
```

To prevent a particular script from ever being embedded, set it to `false` (or `0`):

```html
<script src="foo.js" data-embed="false"></script>
<link rel="stylesheet" href="foo.css" data-embed="false">
```

To embed a particular resource only if it is below a certain size, specify the maximum number of bytes, or something like `5KB`:

```html
<script src="foo.js" data-embed="2000"></script>
<link rel="stylesheet" href="foo.css" data-embed="5KB">
```

### Options

To specify options:

`new ResourceEmbedder('./file.html', options);`

...or just: `new ResourceEmbedder(options);`

* `htmlFile` — only required if you don't pass a file path as the first argument to the constructor.
* `assetRoot` — (optional) – use this if you need to specify the directory that the relative resource URLs will be considered relative to. (By default, it's the same directory as the HTML file.)
* `threshold` (default: `"5KB"`) — all resources below this filesize will be embedded. NB: you can set this to `0` if you want, in which case nothing will be embedded except those resources you mark with a `data-embed` attribute (see above).
* `stylesheets` (default: `true`) — whether to embed stylesheets.
* `scripts` (default: `true`) — whether to embed scripts.
* `deleteEmbeddedFiles` (default: `false`) – whether the external files should be deleted after being embedded.


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Test your code using [Grunt](http://gruntjs.com/).


### Tasks

When you're working on a specific module in `src`, e.g. `parse-file-size.coffee`, first run `grunt watch:parse-file-size` in a terminal and keep the window open. Then open `src/parse-file-size.coffee` and `test/parse-file-size_test.coffee` and work on them side-by-side. New test results will appear in the terminal whenever you save either file.

You can also just do `grunt watch` to watch all modules at once and run all test files whenever anything changes.


## Release History

_(Nothing yet)_


## License

Copyright (c) 2013 Callum Locke. Licensed under the MIT license.


## Wishlist

* Connect/Express middleware
* ability to specify root for relative paths, in case different from the HTML file
* remove `data-embed` attributes from elements that don't get embedded, so they don't litter the output markup unnecessarily

