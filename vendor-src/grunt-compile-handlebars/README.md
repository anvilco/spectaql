# grunt-compile-handlebars [![Build Status](https://secure.travis-ci.org/patrickkettner/grunt-compile-handlebars.png?branch=master)](http://travis-ci.org/patrickkettner/grunt-compile-handlebars)

Compiles handlebar templates, outputs static HTML

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-compile-handlebars`

Then add this line to your project's `Gruntfile.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-compile-handlebars');
```

[grunt]: https://github.com/gruntjs/grunt
[getting_started]: https://github.com/gruntjs/grunt/blob/master/docs/getting_started.md

## Documentation
### Who
patrick kettner - a web developer who consistently worked with large static data sets.

### What
grunt-compile-handlebars takes in a handlebars template (and optionally static pre and post html), runs a dataset over it, and outputs static html.

### Where
inside of a grunt task. I assume you know what gruntjs is, but if not - [gruntjs.com](http://gruntjs.com)

### When
You have ton of data that rarely changes that you want to template.

### How
There are a lot of different ways to input data, it accepts most any dynamic and static
input.
Heres a few of the ways you can use it

```javascript
'compile-handlebars': {
  allStatic: {
    files: [{
      src: 'test/fixtures/template.handlebars',
      dest: 'tmp/allStatic.html'
    }],
    preHTML: 'test/fixtures/pre-dev.html',
    postHTML: 'test/fixtures/post-dev.html',
    templateData: 'test/fixtures/data.json'
  },
  dynamicHandlebars: {
    files: [{
        src: '<h1></h1>',
        dest: 'tmp/dynamicHandlebars.html'
    }],
    templateData: {},
    handlebars: 'node_modules/handlebars'
  },
  jsonHandlebars: {
    files: [{
      src: 'test/fixtures/sweedishTemplate.json',
      dest: 'tmp/sweedish.json'
    }],
    templateData: 'test/fixtures/sweedishData.json'
  },
  dynamicTemplate: {
    files: [{
        src: '<h1>{{salutation}}{{punctuation}} {{location}}</h1>',
        dest: 'tmp/dynamicTemplate.html'
    }],
    template: '<h1>{{salutation}}{{punctuation}} {{location}}</h1>',
    templateData: 'test/fixtures/data.json'
  },
  dynamicTemplateData: {
    files: [{
      src: 'test/fixtures/template.handlebars',
      dest: 'tmp/dynamicTemplateData.html'
    }],
    templateData: {
      "salutation": "Hallo",
      "punctuation": ",",
      "location": "Welt"
    }
  },
  dynamicPre: {
    files: [{
      src: 'test/fixtures/template.handlebars',
      dest: 'tmp/dynamicPre.html'
    }],
    preHTML: '<header>INLINE HEADER</header>',
    templateData: 'test/fixtures/data.json'
  },
  dynamicPost: {
    files: [{
      src: 'test/fixtures/template.handlebars',
      dest: 'tmp/dynamicPost.html'
    }],
    postHTML: '<footer>INLINE FOOTER</footer>',
    templateData: 'test/fixtures/data.json'
  },
  anyArray: {
    files: [{
      src: ['test/fixtures/deep/romanian.handlebars', 'test/fixtures/deep/german.handlebars'],
      dest: ['tmp/deep/romanian.html','tmp/deep/german.html']
    }],
    templateData: ['test/fixtures/deep/romanian.json', 'test/fixtures/deep/german.json'],
    helpers: ['test/helpers/super_helper.js'],
    partials: ['test/fixtures/deep/shared/foo.handlebars']
  },
  globbedTemplateAndOutput: {
    files: [{
        expand: true,
        cwd: 'test/fixtures/',
        src: 'deep/**/*.handlebars',
        dest: 'tmp/',
        ext: '.html'
    }],
    templateData: 'test/fixtures/deep/**/*.json',
    helpers: 'test/helpers/**/*.js',
    partials: 'test/fixtures/deep/shared/**/*.handlebars'
  },
  globalJsonGlobbedTemplate: {
    files: [{
        expand: true,
        cwd: 'test/fixtures/',
        src: 'deep/**/*.handlebars',
        dest: 'tmp/',
        ext: '.html'
    }],
    templateData: 'test/fixtures/deep/**/*.json',
    helpers: 'test/helpers/**/*.js',
    partials: 'test/fixtures/deep/shared/**/*.handlebars',
    globals: [
      'test/globals/info.json',
      'test/globals/textspec.json',
      {
        textspec: {
          "ps": "P.S. from Gruntfile.js"
        }
      }
    ]
  },
  registerFullPath: {
    files: [{
        src: '<h1>{{salutation}}{{punctuation}} {{location}}</h1>{{> test/fixtures/deep/shared/pathTest}}',
        dest: 'tmp/fullPath.html'
    }],
    templateData: {
      "salutation": "Hallo",
      "punctuation": ",",
      "location": "Welt"
    },
    partials: 'test/fixtures/deep/shared/**/*.handlebars',
    registerFullPath: true
  },
  concatGlobbed: {
    files: [{
      src: 'test/fixtures/deep/**/*.handlebars',
      dest: 'tmp/concatGlobbed.html'
    }],
    templateData: 'test/fixtures/deep/**/*.json'
  },
  oneTemplateToManyOutputs: {
    files: [{
      src: 'test/fixtures/template.handlebars',
      dest: ['tmp/oneTemplateToManyOutputs1.html', 'tmp/oneTemplateToManyOutputs2.html']
    }],
    templateData: ['test/fixtures/oneTemplateToManyOutputs1.json', 'test/fixtures/oneTemplateToManyOutputs2.json']
  }
},
```

The available configuration options are as follows

Unless otherwise noted, all configurable values can be represented as
* a string representing the path to a specific file
* a string representing the path to a [globbed representation](http://gruntjs.com/api/grunt.file#globbing-patterns) of the files, matched up against the values resolved from the `template` configuration
* an array of literal paths, globbed paths, or a combination of the two

__`files`__ - A typical [grunt files object](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically). The `src` are your handlebar templates, the `dest` is your html ouput. See the grunt documentation and the usage examples above for more info on how to use this object.

__`preHTML`__ - Static text to be inserted before the compiled template
__`postHTML`__ - Static text to be inserted after the compiled template

__`templateData` ~~ The data being fed to compiled template, in addition to the normal configurable values, this can be
* an inline string representation of a data (I don't know why you would do that though, when you can do...)
* an inline JSON representation of a data

__`globals`__ - globals that can be included, useful for when you have template specific data, but want some data available to all templates
__`helpers`__ - handlebars helpers
__`partials`__ - handlebars partials

__`registerFullPath`__ - normally, helpers and partials are registered under their basename, rather than their path (e.g. partial at `partials/deep/awesomePartial.handlebars` is registered as `{{> awesomePartial}}`). When set to `true`, helpers and partials are registered under their full paths (e.g. {{> partials/deep/awesomePartial}}), to prevent clobbering after resolving globbed values.

`handlebars` - a string representing the path to an instance of handlebars (if you don't want to use the bundeled version).
Note: This __cannot__ be `require('handlebars')`, as that creates a circular reference. You need to pass the path to the instance you want to use, i.e. `handlebars: "./node_modules/handlebars"`

#### A note on globing

When you specify templates using globs, the values from `template` are used to create the values for output, for example, if your file structure looks like this

```
|-foo
  |-bar.handlebars
  |-baz.handlebars
  |-bar.json
  |-baz.json
```

and your configuration looks like this

```
files: [{
    expand: true,
    cwd: './foo/',
    src: '*.handlebars',
    dest: './foo/',
    ext: '.html'
}],
"templateData": "./foo/*.json",
```

the output would be `./foo/bar.html` and `./foo/baz.html`


### Why
I had to work with several hundred repeated data structures that never changed. Keeping them all in html was silly, but pushing out a template engine for the end user to compile the same information multiple times was even sillier. This allows you to have your templated cake and eat it too.

## Release History
 * 2.0.2 - Gadge - fixup Grunt PeerDeps requirement for 1.0 compatibility, have templateData return an empty object when omitted
 * 2.0.1 - Candy - @jrylander updated the lodash dependency to fix breakages introduced in lodash v4
 * 2.0.0 - Jed - @timhettler rewrote larges swaths of the task to use the [Grunt file object](http://gruntjs.com/configuring-tasks#files-object-format)
 * 1.0.1 - Lazy-Eye - @gapipro added path cache for partials and helpers, and fixed using mulitple templates with the same filename
 * 1.0.0 - Serge - Add inline object support for `globals`, fix `outputInInput`
 * 0.7.8 - Eli - add `outputInInput` setting to send outputted files back to their handlebars directory
 * 0.7.7 - Uzi - swap out `JSON.parse` for `alce.parse`, allowing for (technically invalid) single quoted json
 * 0.7.6 - Kristofferson - explicitly check that `isGlob` is undefined, preventing a false negative on empty strings
 * 0.7.5 - Redford - add `registerFullPath` option to prevent partial/helper registration clobbering, update README
 * 0.7.4 - M. Jean - don't send objects to handlebars.compile, code cleanup
 * 0.7.3 - Cousin Ben - switch from require to readFile to allow for html in partials
 * 0.7.2 - Bernice - @stimmins improved handling of templateData and globals
 * 0.7.1 - Margaret - fix 0.8 compatibility
 * 0.7.0 - Rosemary - Allow for arrays instead of globbing, remove depreicated grunt methods
 * 0.6.3 - Pelé  - @mattcg fixed an issue with large amounts of templates
 * 0.6.2 - Dignan  - @goette added support for a global json config
 * 0.6.1 - Grace  - @robinqu added support for handlebars partials
 * 0.6.0 - Future Man - added globbing, lots more test
 * 0.4.0 - Oseary - upgraded to grunt 0.4, removed extra tasks, added tests
 * 0.0.2 - Inez - changed to grunt's native json parser (thanks to @sebslomski). Updated Readme
 * 0.0.1 - Dudley - Initial commit

## License
Copyright (c) 2014 Patrick Kettner
Licensed under the MIT license.
