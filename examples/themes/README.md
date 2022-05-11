SpectaQL's theming system is a powerful way to tweak or augment the default theme as much or as little as you like. If you want to just modify some things, you can do that. Or if you want to completely change any or all aspects of SpectaQL's output, you can do that, too.

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
SpectaQL supports SCSS, and the default CSS is built by processing the `main.scss` in the default theme's `stylesheets/` directory. If your theme provides a `main.scss` file, that will overwrite the default one and be used to direct the SCSS -> CSS build. You can also then include other `.scss` files that can be imported by your `main.scss` file. Additionally, there is a `custom.scss` included in the default theme that will be imported by its
`main.scss` file, but it will not contain any SCSS. You might consider overriding just this file in your custom theme (instead of the `main.scss` file) in order to take advantage of any SCSS updates to this library as you update it.

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
[handlebars]: https://handlebarsjs.com
[default-data-arranger]: /src/themes/default/data/index.js
[custom-data-arranger]: /examples/themes/my-partial-theme/data/index.js
