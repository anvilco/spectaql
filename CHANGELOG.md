### 2.3.0
  - Support Logo and Favicon Base64 embedding, as well as URL specification. https://github.com/anvilco/spectaql/issues/807

### 2.2.1
  - Fix publishing and installation process. https://github.com/anvilco/spectaql/issues/876

### 2.2.0
  - Fix/add support for `EnumValues`.
  - Non-zero exit code when there's an error.
  - Fix scrollspy issue. https://github.com/anvilco/spectaql/pull/852 Thanks @MarcEspiard
  - Dependency updates.

### 2.1.1
  - Fix cross-OS bug where `rm` was used. https://github.com/anvilco/spectaql/issues/837
  - Dependency updates

### 2.1.0
  - Add support for `inputValueDeprecation`
  - Dependency updates

### 2.0.9
  - Add `info.contact.url` to the templates

### 2.0.8
  - Dependency updates

### 2.0.7
  - Dependency updates

### 2.0.6
  - Dependency updates

### 2.0.5
  - Remove `foundation-sites` dependency

### 2.0.4
  - Update dependencies.
  - Fix typos in documentation.

### 2.0.3
  - Bugfix: dynamic import on Windows machines: https://github.com/anvilco/spectaql/pull/627
  - Update dependencies.

### 2.0.2
  - Exit with an explicit `0` code when no need to build vendor packages. https://github.com/anvilco/spectaql/pull/606

### 2.0.1
  - All lifecycle scripts only use `npm` (never `yarn`).

### 2.0.0
  - BREAKING CHANGE: Drops support for Node 12. Requires Node `>=14`.
  - BREAKING CHANGE: Requires `npm >= 7`.
  - BREAKING CHANGE: The `run` and `loadData` commands are now asynchronous and return a promise.
  - Fixes myriad bugs.
  - Adds better support for various `example` generation scenarios.
  - BREAKING CHANGE: `Subscriptions` are now listed under `Operations`, immediately after `Queries` and `Mutations`, in the default theme.
  - BREAKING CHANGE: No external fonts can be loaded in the included themes, so the `loadExternalFont` option was removed.
  - `config` yaml will have environment variable substitution performed.
  - `config` yaml can now be specified as a CLI option (`-c` or `--config`), instead of only as the first argument.
  - Themes written as ESM/`.mjs` modules are now supported.
  - BREAKING CHANGE: Accessibility improvements for `<h>` tags deeper than `<h6>` using the `aria-level` attribute.  
  - `embeddable`, `oneFile` and `targetDir` are now options that can be specified in the config yaml (previously was only CLI).
  - `targetDir` can be set to `null` in order to not write any output to a user directory.
  - BREAKING CHANGE: `headers` CLI option is now `-H` instead of `-A`
  - Moves a number of unmaintained Grunt dependencies "in-house" so that they can be updated for vulnerabilities and bugs.
  - BREAKING CHANGE: Dropped support for accidental `queryNameStategy` option. 🤦
  - BREAKING CHANGE: Expects `node 16` when cloning and developing on this repo.

### 1.5.9
- Updated dependencies.

### 1.5.8
- Add option to disable 3rd party font request in some built-in themes via the `loadExternalFont` option. https://github.com/anvilco/spectaql/pull/556

### 1.5.7
- Default a few deconstructed object params to be an empty object. https://github.com/anvilco/spectaql/pull/553
- Fix bug where config and SDL files were not being properly watched in some cases. https://github.com/anvilco/spectaql/pull/554
- Fix bug, now allow anything but `undefined` to be used as an example. https://github.com/anvilco/spectaql/issues/547

### 1.5.6
- Re-publish after some reverts

### 1.5.5
- Dependency updates
- Last LTS for 1.x and Node 12

### 1.5.4
- Dependency updates
- Option to have `run` resolve with an object containing the outputs. https://github.com/anvilco/spectaql/pull/497

### 1.5.3
- Dependency updates
- Better support for parsing `@spectaql` directive options. https://github.com/anvilco/spectaql/pull/462 Thanks @kylebjordahl

### 1.5.2
- Add option to remove unused types.
- Updated `microfiber` to add support for usage of `INTERFACES` to count as usage of the types that implement them.

### 1.5.1
- Dependency updates
- Added examples and better support for various things in the `metadata.json` file, as well as examples.

### 1.5.0

- Support for metadata via the `@spectaql` directive. https://github.com/anvilco/spectaql/pull/439

### 1.4.2

- Dependency updates
- Accessibility improvements. https://github.com/anvilco/spectaql/pull/397

### 1.4.1

- Support interpolation of references in `loadTextFromFile` and add it to intro items area. https://github.com/anvilco/spectaql/pull/new/newhouse/416/interpolation-in-file-reads

### 1.4.0

- Add support for inline fragments for Union queries. https://github.com/anvilco/spectaql/pull/407

### 1.3.0

- Add (back) support for Interfaces.
- Dependency updates to remove warnings.

### 1.2.4

- Handles defaults with enumerated types better. https://github.com/anvilco/spectaql/pull/400

### 1.2.3

- Checks for "lengthy" `fields` on a Type when determining how to handle fragmentation and expansion in example queries. https://github.com/anvilco/spectaql/issues/385

### 1.2.2

- Added `displayAllServers` option. https://github.com/anvilco/spectaql/pull/381
- Added `errorOnInterpolationReferenceNotFound` option. https://github.com/anvilco/spectaql/pull/380

### 1.2.1

- Added `logoHeightPx` and removed `logoMaxHeightPx`.

### 1.2.0

- Added a `custom.scss` file to the default theme to allow for simple theme customizations to easily get ohter CSS updates.
- Added a `logoMaxHeightPx` option to set the logo's `max-height` property.
- Added `scrollPaddingTopPx` option to set the `scroll-padding-top` property for when there's a Nav bar situation.

### 1.1.5

- CSS will be concatenated with SpectaQL's css coming before other CSS. https://github.com/anvilco/spectaql/pull/353

### 1.1.4

- Re-published from borked publish of `1.1.3`

### 1.1.3

- Updated dependencies.
- Fixed bug where List return type for Query or Mutation was not working properly. https://github.com/anvilco/spectaql/pull/342
- Fixed navigation bug. https://github.com/anvilco/spectaql/pull/343

### 1.1.2

- Fixed mismatched header tags
- Fixed name of `queryNameStrategy` options

### 1.1.1

- Added `augmentData` to exports.
- Updated dependencies.

### 1.1.0

- Added option for "fieldExpansionDepth". https://github.com/anvilco/spectaql/pull/302

### 1.0.14

- Bug fix: scrolling issues in Firefox. https://github.com/anvilco/spectaql/pull/299

### 1.0.12

- Update `microfiber` to include bugfix.

### 1.0.11

- Bug fix: Windows absolute path bug. https://github.com/anvilco/spectaql/pull/288

### 1.0.10

- Dependency updates

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
