SpectaQL's theming system is a powerful way to tweak or augment the default theme as much or as little as you like. If you want to just modify some things, you can do that. Or if you want to completely change any or all aspects of SpectaQL's output, you can do that, too.

### Resources

* [Building a SpectaQL theme tutorial][theme-blog-post] - A step-by-step blog post building a SpectaQL theme.
* [`spectaql-dark-theme`][spectaql-dark-theme] - An example dark theme based on the default SpectaQL theme.
* [`spectaql-theme-example`][spectaql-theme-example] - An example node project using SpectaQL and `spectaql-dark-theme`

### Overview

Any custom theme that you use will be "overlayed" on top of SpectaQL's [default theme directory][default-theme-dir] and structure. This means that your theme gets all the templates, javascripts, CSS and helpers included in the default theme "for free".

Any files that your theme includes will be added on top of the default theme's structure. This means you can:

- Override existing files to modify their behavior
- Include new files to be considered or included during the build process
- Both!

The "theme" system works on a directory structure convention. Here's how that stucture looks:

```js
your-theme-dir/
├── javascripts/
│
├── stylesheets/
│    └── main.scss
│
├── views/
│    ├── partials/
│    ├── main.hbs
│    └── embedded.hbs
│
├── helpers/
│
└── data/
     └── index.js
```

Let's discuss each directory:

### `javascripts`

Any files you add to this folder will be concatenated and then minified into the `spectaql.min.js` file of your build's target directory along with the default files.

If you want to simply add an additional JS file to your build, this is your way. Just add it to this folder in your theme directory.
You can also replace/overwrite any of SpectaQL's default javascript files.

### `stylesheets`

Any `.css` files that you add to this folder will be concatenated and minified into the `spectaql.min.css` file of your build's target directory along with the default CSS.

SpectaQL supports SCSS, and the default CSS is built by processing `main.scss` in the default theme's `stylesheets/` directory. If your theme provides a `main.scss` file, it will completely replace the default theme and be used to direct the SCSS -> CSS build. You can then import other `.scss` files from your own custom `main.scss` file.

An example or replacing the whole theme:

```scss
// mytheme/stylesheets/main.scss
// This will replace the deafult theme

// You can (but don't have to!) import structural styles from base and
// syntax highlighting from the spectaql default theme
@import 'base';
@import 'syntax-highlighting';

#spectaql {
  // Your custom styles here!
}
```

If you do not want to replace the default theme, provide a `custom.scss` instead of `main.scss` in your `stylesheets` dir. The `custom.scss` file allows you to override the default theme's variables and styles without completely replacing the default theme. See [`custom.scss`][custom-scss-file] for a full list of variables you can replace.

```scss
// mytheme/stylesheets/custom.scss
// This can override variables and styles in the default theme

// Variable overrides
$background: #222222;
$text-color: white;

#spectaql {
  // Your style overrides here!
}
```

You can override syntax highlighting styles by specifying a `syntax-highlighting.scss` file. You can use any syntax theme from [Highlight.js][highlightjs]. Check out [theme demos][theme-demos] then grab the [theme styles][theme-styles] of your choice.

### `views`

SpectaQL uses [Handlebars][handlebars] as its templating engine - please read up on their docs if you'd like to alter this area. Any `.hbs` files that you add to this folder will be overlayed on top of the default theme's directory.

SpectaQL will look for the the `main.hbs` file in the resulting `views` directory as the entry point for Handlebars. If your theme provides a `main.hbs` file, that will overwrite the default one and be used to direct the HBS -> HTML build.

If you only want to tweak and/or add certain partials, you can do so by only including those customized or additional files in your theme. They will be overlayed on top of the default theme directory in a supplemental manner.

SpectaQL also supports running a theme in "embeddable" mode to produce output that can be embeded into an existing HTML page. In "embeddable" mode, the `embedded.hbs` file will be used as the entry point for Handlebars. Depending on the changes you've made, if you want your theme to support "embeddable" mode properly you may need to customize the `embedded.hbs` file in your theme.

### `helpers`

[Handlebars][handlebars] allows for Javascript "helpers" to be used throughout its templates. These helpers must exist in the `helpers/` directory.
All of SpectaQL's default theme helpers will be available to any custom theme "for free".

If you'd like to add more helpers or overwrite an existing helper, simply put your JS file(s) into this folder and they will be copied on top of the default theme's directory and will be available for use in your templates.

### `data`

_NOTE:_ This is an experimental API and it could change in a breaking manner at any time before "major" release. Use at your own risk!

By default, SpectaQL will use all the non-hidden data that your GraphQL schema has provided, and arrange it in an sane, but opinionated default manner. It will group `Queries` and `Mutations` under an `Operations` header, then it will display all regular `Types`, and finally it will display all `Subscriptions`. You can see the [default arranger source][default-data-arranger] for more on how the default is done.

However, if you'd like to completely customize the data that's displayed, and have some basic control over how it's displayed, you can provide a "dynamic data arranger" module. Here's how:

- Create your dynamic data arranger module. It should export a function that expects the same arguments that are provided in the [example dynamic data arranger][custom-data-arranger]
- Save it to `data/index.js` in your theme directory.

_NOTE:_ Again, this is an experimental API and it could change in a breaking manner at any time before "major" release. Use at your own risk!

[default-theme-dir]: /src/themes/default/
[custom-scss-file]: /src/themes/default/stylesheets/custom.scss
[handlebars]: https://handlebarsjs.com
[default-data-arranger]: /src/themes/default/data/index.js
[custom-data-arranger]: /examples/themes/my-partial-theme/data/index.js
[highlightjs]: https://highlightjs.org
[theme-demos]: https://highlightjs.org/static/demo/
[theme-styles]: https://github.com/highlightjs/highlight.js/tree/main/src/styles
[theme-blog-post]: https://www.useanvil.com/blog/engineering/building-a-spectaql-theme-for-your-graphql-documentation
[spectaql-dark-theme]: https://github.com/anvilco/spectaql-dark-theme
[spectaql-theme-example]: https://github.com/anvilco/spectaql-theme-example
