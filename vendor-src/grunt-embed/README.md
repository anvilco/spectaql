# grunt-embed

[![Build Status](https://secure.travis-ci.org/callumlocke/grunt-embed.png?branch=master)](http://travis-ci.org/callumlocke/grunt-embed) [![Dependency Status](https://david-dm.org/callumlocke/grunt-embed.svg)](https://david-dm.org/callumlocke/grunt-embed)

> This is a Grunt plugin wrapper around [resource-embedder](https://github.com/callumlocke/resource-embedder).

Turns short external scripts and stylesheets into embedded ones:

* `<script src="foo.js"></script>` becomes `<script> ... </script>`
* `<link rel="stylesheet" href="bar.css">` becomes `<style> ... </style>`

The default behaviour is to embed anything under 5KB in size, but this threshold is configurable.

**Should you embed your scripts?** Depends. Embedding reduces the number of HTTP requests, and can reduce blocking of subsequent requests and page rendering, but it also means the resources can't be cached individually and shared between pages.

You should do your own measurements to work out if this is a good trade-off in your situation. But, as a guide: short, blocking scripts in the head are often a good candidate for embedding.

A small Modernizr build is a good example: if it's embedded (as a script before your main stylesheet), it will have been executed and applied any special CSS classes to the `<html>` tag before your styles are received. Then as soon as the styles are received, any subsequent background-image downloads can be started immediately, because Modernizr's classes will already have been added to the `<html>` tag.


## Getting Started

This plugin requires [Grunt](http://gruntjs.com/) (see [Getting Started](http://gruntjs.com/getting-started)).

Install:

```shell
npm install grunt-embed --save-dev
```

Load the task in your Gruntfile:

```js
grunt.loadNpmTasks('grunt-embed');
```


## The "embed" task

### Overview

In your Gruntfile, add a section named `embed` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  embed: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

Any options will be passed through to `resource-embedder` – see [full list of options](https://github.com/callumlocke/resource-embedder#options).

### Usage Examples

#### Default Options

Embed any external scripts and stylesheets under 5KB in size (the default threshold):

```js
grunt.initConfig({
  embed: {
    some_target: {
      files: {
        'dest/output.html': 'src/input.html'
      }
    }
  }
})
```

#### Custom Options

Custom threshold – embed anything under 3KB in size:

```js
grunt.initConfig({
  embed: {
    options: {
      threshold: '3KB'
    },
    some_target: {
      files: {
        'dest/output.html': 'src/input.html'
      }
    }
  }
})
```

#### Overriding the options for a given script/stylesheet

You can use `data-embed` attributes to override the options for an individual resource.

```html
<script src="foo.js" data-embed></script> <!-- always embed -->
<script src="foo.js" data-embed="false"></script> <!-- never embed -->
<script src="foo.js" data-embed="10KB"></script> <!-- embed if under 10KB -->
```


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).


## Release History

_(Nothing yet)_


## License

Copyright (c) 2013 Callum Locke. Licensed under the MIT license.
