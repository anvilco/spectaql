`spectaql` was in a "beta" state in all versions before `1.0.0`. If you were using a version before `1.0.0` you will want to have a look at [these breaking changes](./BREAKING_CHANGES_1.md) that may impact you.

Some notable additions/enhancements to `1.0.0` are:

- When used in a `node` project, there are a few more exports now:
  - `run`: same as the default export that will build everything if you pass it sane options.
  - `parseCliOptions`: used to parse the CLI arguments into sane arguments to be passed to `run`.
  - `loadData`: bascially does all the processing that SpectaQL would do with gathering and processing the data right up to the point where SpectaQL would start to generate the HTML, etc.
  - `buildSchemas`: Does a bit less than `loadData` in that it will take the provided options and return an augmented Introspection Query Response as well as a GraphQL Schema instance.
  - Choose from several built-in "themes", tweak the default theme, or completely change things up with your own theme! See the [/examples/themes/README.md][themes-readme] for more.
  - Use the **_EXPERIMENTAL_** `spectaql.dynamicDataArrangementProcessingModule` option to provide a path to a Common JS module which can be used to do some basic arrangement of the data that will be displayed by SpectaQL.

[themes-readme]: /examples/themes/README.md
