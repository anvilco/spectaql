### 1.0.9

- Bug fixes: Overflow text. SVG logos. Slow resize. https://github.com/anvilco/spectaql/pull/286

### 1.0.8

- Add support for query name strategies. https://github.com/anvilco/spectaql/pull/282
- Bug fix: support examples from metatdata for Scalars. https://github.com/anvilco/spectaql/pull/283
- Bug fix: `themeDir` from CLI support. https://github.com/anvilco/spectaql/pull/284
- Bug fix: Reference interpolation. https://github.com/anvilco/spectaql/pull/285

### 1.0.7

- Lots of dependency updates.

### 1.0.6

- Add some basic support for Headers in the server info area.
- Bug fix: Examples array problem. https://github.com/anvilco/spectaql/issues/265

### 1.0.1-1.0.5

- Bug fix: Bad path resolution. https://github.com/anvilco/spectaql/issues/258
- Bug fix: Bad path resolution. https://github.com/anvilco/spectaql/issues/257
- Bad publish of `1.0.3`.
- Bug fix: Put back Glob support for multiple GraphQL files.
- Bug fix: GraphQL Scalar example bug. https://github.com/anvilco/spectaql/issues/262

`spectaql` was in a "beta" state in all versions before `1.0.0`. If you were using a version before `1.0.0` you will want to have a look at [these breaking changes](./BREAKING_CHANGES_1.md) that may impact you.

Some notable additions/enhancements to `1.0.0` are:

- When used in a `node` project, there are a few more exports now:
  - `run`: same as the default export that will build everything if you pass it sane options.
  - `parseCliOptions`: used to parse the CLI arguments into sane arguments to be passed to `run`.
  - `loadData`: bascially does all the processing that SpectaQL would do with gathering and processing the data right up to the point where SpectaQL would start to generate the HTML, etc.
  - `buildSchemas`: Does a bit less than `loadData` in that it will take the provided options and return an augmented Introspection Query Response as well as a GraphQL Schema instance.
  - Choose from several built-in "themes", tweak the default theme, or completely change things up with your own theme! See the [/examples/themes/README.md][themes-readme] for more.

[themes-readme]: /examples/themes/README.md
