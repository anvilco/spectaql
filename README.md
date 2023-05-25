# SpectaQL

[![npm][npm]][npm-url]
[![downloads][npm-downloads]][npm-url]

<a href="https://www.useanvil.com/docs"><img src="/static/SpectaQL.png" width="800"></a>

SpectaQL is a Node.js library that generates static documentation for a [GraphQL](https://graphql.org) schema using a variety of options:

1. From a live endpoint using the introspection query.
2. From a file containing an introspection query result.
3. From a file, files or glob leading to the schema definitions in SDL.

The goal of SpectaQL is to help you keep your documentation complete, current and beautiful with the least amount of pain as possible.

---

**Repository sponsored by [Anvil](www.useanvil.com/developers)**

![Horizontal Lockupblack](https://user-images.githubusercontent.com/293079/169453889-ae211c6c-7634-4ccd-8ca9-8970c2621b6f.png#gh-light-mode-only)
![Horizontal Lockup copywhite](https://user-images.githubusercontent.com/293079/169453892-895f637b-4633-4a14-b997-960c9e17579b.png#gh-dark-mode-only)

Anvil provides easy APIs for all things paperwork.

1. [PDF filling API](https://www.useanvil.com/products/pdf-filling-api/) - fill out a PDF template with a web request and structured JSON data.
2. [PDF generation API](https://www.useanvil.com/products/pdf-generation-api/) - send markdown or HTML and Anvil will render it to a PDF.
3. [Etch e-sign with API](https://www.useanvil.com/products/etch/) - customizable, embeddable, e-signature platform with an API to control the signing process end-to-end.
4. [Anvil Workflows (w/ API)](https://www.useanvil.com/products/workflows/) - Webforms + PDF + e-sign with a powerful no-code builder. Easily collect structured data, generate PDFs, and request signatures.

Learn more on our [Anvil developer page](https://www.useanvil.com/developers/).

---

### NOTICE

Migrating from pre `1.0`?

- Here are the breaking changes: [BREAKING_CHANGES_1.md][breaking-1]
- Here's a list of some of the interesting new changes: [CHANGELOG.md][changelog]

---

Out of the box, SpectaQL delivers a 3-column page with a modern look and feel. However, many aspects can be customized with ease, and just about everything can be customized if you're willing to dig in.

SpectaQL also has a lot of advanced features and ways to enhance your GraphQL documentation.

:tada:&nbsp;&nbsp;[Anvil](https://www.useanvil.com) uses SpectaQL for our own docs, and you can see them [here][docs]. :tada:<br>
:tada:&nbsp;&nbsp;This supporting [blog post][blog] outlines our use-case and implementation, and may be worth a read :tada:

<img src="/static/anvil-api-screenshot.jpg" width="800">

## Benefits

Using SpectaQL to generate your documentation has a number of benefits, such as:

- Your documentation will always be up-to-date
- Your documentation will always be complete
- Your documentation can be beautiful and "on brand"
- Save developers time and headache by not having to write documentation

## Features

- Various ways to ingest your schema:
  - Hit a live GraphQL endpoint with an introspection query
  - Provide a file containing an introspection query result
  - Provide a single SDL file containing your schema
  - Provide an array of multiple SDL files to be merged into a final schema
  - Provide a glob that leads to SDL files to be merged into a final schema
- Will automatically generate documentation for all Types, Fields, Queries, Mutations, Arguments and Subscriptions by default.
- Supports blacklisting entire areas (e.g. "don't show Mutations") and 1-off blacklisting.
- Supports providing examples via static metadata, or dynamically via a custom generator plugin that you control.
- Supports (beta) dynamic grouping and arranging of data via a custom data arrangment plugin that you control.
- Supports light tweaking or complete customization of CSS, JS and HTML output via themes.
- Supports markdown just about everywhere you can provide text.
- Live preview mode while developing.
- Many options for output:
  - Specify a logo
  - Specify a favicon
  - Specify the target directory and HTML file name
  - Can output JS and/or CSS "in line" in your HTML file, rather than as separate files.
  - Can output in "embeddable" mode (only the `<body>` content is generated) so output can be integrated into your existing site.
  - ...and more!

## Getting Started

1. Install SpectaQL:

   ```sh
   npm install -g spectaql
   # OR
   yarn global add spectaql
   ```

   This is a global installation, but you can also either:

   - Clone this repository
   - Add `spectaql` as a dependency to an existing project.

2. Define a `config.yml` that specifies how you'd like to generate your docs.
   See [YAML Options](#yaml-options) for more.

3. Generate your docs!
   ```sh
   npx spectaql config.yml
   ```

Your generated documentation will be located in the `public` directory by default. You can either copy the generated HTML to your web server, write the output to somewhere else using the `-t /path/to/ouputDir` option, or add `-D` flag and view your docs live by pointing your browser to [http://localhost:4400/](http://localhost:4400/).

## Examples

The best way to figure out what SpectaQL can do is to clone this repository (or mimic the [`/examples`](https://github.com/anvilco/spectaql/blob/main/examples) directory) and play around with the example build and its data:

```sh
npm install
npm run develop ./examples/config.yml
```

That config will direct a build that flexes the most interesting parts of SpectaQL, so dig in a little and it should be a rewarding exercise.

## YAML Options

To generate your documentation, SpectaQL requires a configuration YAML. This file is where you can specify most of the options to make your output the way you'd like it. All the supported options and their descriptions can be found in the [`config-example.yml`](https://github.com/anvilco/spectaql/blob/main/config-example.yml) file.

Environment variable substitution will be performed, so feel free to use environment variables in your config.

You can also see a minimal-ish working example YAML in the [examples/config.yml](https://github.com/anvilco/spectaql/blob/main/examples/config.yml) file.

## Command Line Options

Several options are supported via the CLI. Some are exclusive to the CLI, while others are also possible to specify in the YAML config. Options specified in the CLI take precedence over those that exist in the YAML config. All the supported options and their descriptions can be found in [/src/cli.js][cli].

## Using SpectaQL as a Dependency

In addition to using SpectaQL as a global (or local) binary executable, it can also be used by your Node application as a dependency. More documentation will be coming soon but here is a quick example to get you started:

```node
import { run } from 'spectaql'
...
const spectaqlOptions = {
   specFile: 'path/to/your/config.yml',
   resolveWithOutput: true,
}
const { html } = await run(spectaqlOptions)
...
```

## Metadata

In our experience, nearly all of the stuff we need for the content of the documentation comes from things supported in GraphQL and introspection queries...but not everything. To supplement some things that are missing, SpectaQL provides support for including "metadata" about your schema that can be used when generating the output. The following options are currently supported:

- `example`: When provided for a Scalar, Field or Argument, this value will be used as an "example" for the Field or Argument. It can be any value supported in JSON.
- `examples`: Same as `example`, but allows an Array of examples to be provided, from which one random one will be used during generation.
- `undocumented`: A Boolean value that can be provided on a Type, Field, Argument, Query or Mutation indicating that this item is _**not**_ to be included in the resulting output. Useful for 1-off hiding of things where the default was to show them.
- `documented`: Just like `undocumented`, except it _**will**_ include it in the resulting output. Useful for 1-off showing of things where the default was to hide them.

SpectaQL supports 3 ways to include metadata to be used during processing:

1. Include your metadata in the introspection query (or introspection query results file). This requires manipulation of your introspection query results either on their way out from the server, or once in an output file. At Anvil, we use Apollo Server and leverage [this plugin we wrote](https://www.npmjs.com/package/@anvilco/apollo-server-plugin-introspection-metadata) to "weave" our metadata into the introspection query results. [This example output](https://github.com/anvilco/spectaql/blob/main/examples/data/introspection-with-metadata.json) illustrates what an "interwoven" metadata scenario might look like.
2. Provide a standalone JSON file containing your metadata to be "woven" into your introspection query results by SpectaQL. SpectaQL uses the `addMetadata` method from [our Apollo Plugin](https://www.npmjs.com/package/@anvilco/apollo-server-plugin-introspection-metadata) under the hood, so please see the documentation there or [this example](https://github.com/anvilco/spectaql/blob/main/examples/data/metadata.json) file to understand its format.
3. If you are providing your schema information via an SDL file or files, leverage the [SpectaQL Directive](#the-spectaql-directive) feature to provide your metadata in your SDL through directives. See the [SpectaQL Directive](#the-spectaql-directive) for more information.

**NOTE**: Another way to ensure that things are not documented is to pass your GraphQL Instrospection Results through [Microfiber][microfiber] and perform the removal of any Types, Fields, Queries etc before they even reach SpectaQL. Just a thought.

## The SpectaQL Directive
If you are providing your schema information via an SDL file or files, you can leverage the `@spectaql` directive and pass any of the supported `metadata` options to the `options` argument of that directive. This is a useful approach for those who are taking an "SDL-first" development approach. See the `spectaqlDirective` option in the [`config-example.yml`](https://github.com/anvilco/spectaql/blob/main/config-example.yml) file for more information on how to enable and implement this approach.

Here's what you need to know:
- See the `spectaqlDirective` option in the [`config-example.yml`](https://github.com/anvilco/spectaql/blob/main/config-example.yml) file for information on how to enable and tweak this approach.
- The directive's `options` argument is a List/Array of Input Objects that have the following shape:
```
{ key: String!, value: String! }
```
- All the `value` fields should be provided as strings, and they will be appropriately parsed based on the supported value of the `key` field.
- SpectaQL does not need you to add the definition of the `spectaql` directive, nor its `SpectaQLOption` input type to your SDL. They will be added (and removed) by SpectaQL automatically if you enable the feature. However, if you are using that same SDL to create an executable schema, you will need to add the directive and options definitions for your server to not complain.
- The directive can be added to your SDL anywhere that directives are supported by GraphQL SDL syntax, but they may only have an impact on the areas that SpectaQL supports.

The directive-related SDL is:
```sdl
directive @spectaql(options: [SpectaQLOption]) on QUERY | MUTATION | SUBSCRIPTION | FIELD | FRAGMENT_DEFINITION | FRAGMENT_SPREAD | INLINE_FRAGMENT | VARIABLE_DEFINITION | SCHEMA | SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION
input SpectaQLOption { key: String!, value: String! }
````

Or you can generate the required directive SDL programmatically like so:
```node
import { generateSpectaqlSdl } from 'spectaql'

const spectaqlSdl = generateSpectaqlSdl()
// Do something with this SDL
```

Once enabled, the directive can be used like so:
```sdl
type MyType {
   "This field will be hidden, thanks to the options that were passed to the @spectaql directive"
   myField: String @spectaql(options: [{ key: "undocumented", value: "true" }])
   myFieldOtherField: String @spectaql(options: [{ key: "example", value: "An Example from the Directive" }])
   myFieldOtherOtherField: String @spectaql(options: [{ key: "examples", value: "[\"Example 1 from the Directive\", \"Example 2 from the Directive\"]" }])
}
```

## Dynamic Example Generators

In addition to being able to use any static examples you've provided, SpectaQL also supports dynamically generating examples for Scalars, Fields and Arguments. When it comes time to generate an example, SpectaQL can pass all the necessary information about the Scalar, Field or Argument to your generator in order for it to decide what the example should look like. See the included [example generator](https://github.com/anvilco/spectaql/blob/main/examples/customizations/examples/index.js) to see how it works.

**NOTE**: There is nothing wrong with this approach, and it may often times make the most sense. However, if you are thinking about going through the trouble of writing your own example generator methods, you might also consider taking that effort "upstream" and using it to add examples directly to your metadata _before_ SpectaQL even gets involved. Just a thought.

## Customizing CSS, JS, HTML, and Data Arrangement via Themes

SpectaQL supports a "theme" system that can be used to make minor tweaks to the default look, or to completely overhaul the output. [This article][themes-blog] should be really helpful to understanding how themes work and what they can do.

SpectaQL ships with 3 included themes that can be specified via the `themeDir` option:

- `default`: Our default theme. This is the theme that will be used if do not specify any `themeDir` option.
- `basic`: Outputs the same HTML structure as the `default` theme, but with minimal CSS styling.
- `spectaql`: Outputs the same HTML structure as the `default` theme, but with some CSS enhancements.

In addition to those built-in themes, you can specify a path to a custom theme directory to the `themeDir` option. Your custom theme directory will be overlayed on top of the default theme directory, and therefore can include as much or as little overridden or additional files as necessary to obtain your desired output.

See [/examples/themes/README.md][themes-readme] for more information on how you can customize SpectaQL's output with themes.

## Reference Interpolation

All `description`s are rendered in a way that supports markdown. If you'd like to reference a Type, Query or Mutation SpectaQL supports some basic custom interpolation that will return links to the desired target. The format is as follows: `{{[Queries | Mutations | Subscriptions | Types].<Query, Mutation, Subscription, or Type name>}}`

Examples:

- `I'm a description with a simple reference to [String]({{Types.String}})`
- `` I'm a description with a cool looking reference to [`[String!]`]({{Types.String}}) ``
- `I'm a description with a simple reference to [myQuery]({{Queries.myQuery}})`

## Custom Builds

The best option for customizing your output is to see if what you want to do is already supported out of the box:

- There are various options in the [CLI](#command-line-options) and [YAML](#yaml-options) config for customizing your results.
- Overriding CSS, JS and HTML is already supported via themes. Check [themes README][themes-readme] for more.
- Overriding "examples" for things is already supported via [metadata](#metadata), or via a [dynamic example generator](#dynamic-example-generators).

If you need to change or extend SpectaQL beyond what's supported out of the box, another option is to [fork SpectaQL on GitHub](https://help.github.com/articles/fork-a-repo/) and make your own modifications in the source. Forked repos are always public, so if you need changes to remain private you can consider doing a clone + mirror approach as [outlined here](https://stackoverflow.com/a/30352360/1427426). Either way, you can keep up-to-date by merging changes from the `main` branch.

Please consider submitting a Pull Request (or asking first via an Issue) for anything you think would be a useful addition to SpectaQL. We try to be pretty active about fixing and enhancing the project. Please also consider subscribing to the repo to keep up to date with the goings on.

Alternatively, you can just copy and modify the contents of `app` from the main repo and pass the path from your custom `app` path to the CLI using the `-a` flag.

## Development

When developing, you'll likely want to use the `-D` (or `-d`) development modes so that your output is hosted live for you, and changes to the code will trigger a rebuilding of the output:

```sh
npx spectaql -d path/to/config.yml
```

### Testing

```sh
npm test
# OR
yarn test
```

The changes we made from the [DociQL][dociql] project are significant, and as a result there is only a limited amount of test coverage at this point. However, new code should be tested, and unit tests for the existing code will be added in the future...or are welcome as pull requests!

Testing is powered by [Mocha](https://mochajs.org/)/[Chai](http://chaijs.com/) and uses the [BDD Lazy Var](https://github.com/stalniy/bdd-lazy-var) enhancement for writing RSpec-style tests.

Run `npm test` on the repository to start the automated tests.

## Caveats

While it's very robust, SpectaQL is still quite new and is evolving. It's likely that there will be some bugs, breaking-changes, and other odd things until things harden up a bit more over usage and time. Please keep this in mind.

## Contributors and Special Thanks

This library owes a very special thanks to the [DociQL][dociql] project, which served as a great starting point for SpectaQL to build on top of.

## License

SpectaQL is licensed under the MIT License – see the [LICENSE.md](https://github.com/anvilco/spectaql/blob/main/LICENSE) for specific details.

## More Information

More info is available on the [SpectaQL homepage](https://github.com/anvilco/spectaql).

You may also find this supporting [blog post][blog] that outlines our use-case and implementation to be helpful.

All contributions are welcome.

Good luck and enjoy SpectaQL!

<a href="https://www.useanvil.com"><img src="/static/anvil.png" height="15"></a>&nbsp;&nbsp;_Powered by [Anvil](https://www.useanvil.com)_

[npm]: https://img.shields.io/npm/v/spectaql.svg
[npm-downloads]: https://img.shields.io/npm/dw/spectaql
[npm-url]: https://www.npmjs.com/package/spectaql
[dociql]: https://github.com/wayfair/dociql
[docs]: https://www.useanvil.com/docs/api/graphql/reference/
[blog]: https://www.useanvil.com/blog/2021-03-17-autogenerate-graphql-docs-with-spectaql
[changelog]: /CHANGELOG.md
[breaking-1]: /BREAKING_CHANGES_1.md
[handlebars]: https://handlebarsjs.com/
[themes-readme]: /examples/themes/README.md
[cli]: /src/cli.js
[microfiber]: https://www.npmjs.com/package/microfiber
[themes-blog]: https://www.useanvil.com/blog/engineering/building-a-spectaql-theme-for-your-graphql-documentation
