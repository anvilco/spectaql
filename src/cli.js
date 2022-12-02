import pkg from '../package.json'
import { Command } from 'commander'

const program = new Command()

export default function () {
  //
  //= Process CLI input

  program
    .version(pkg.version)
    .usage('[options] [-c <config.yml> | <config.yml>]')
    .description(pkg.description)
    .option(
      '-q, --quiet',
      'Silence the output from the generator (default: false)'
    )
    .option(
      '-c, --config <file>',
      'Specify the config yaml. Will take precedence over passing via the first argument.'
    )

    .option(
      '-t, --target-dir <dir>',
      'the target build directory. Set to "null" to not write the output to the filesystem, making it only available via the API (default: public)',
      String
    )

    // This option specifies where the generated documentation HTML files will be output.
    .option(
      '-f, --target-file <file>',
      'the target build HTML file (default: index.html)',
      String
    )

    // This option lets you build a minimal version of the documentation without the HTML `<body>` tags, so you can embed
    // SpectaQL into your own website template.
    .option(
      '-e, --embeddable',
      'omit the HTML <body/> and generate the documentation content only (default: false)'
    )
    .option(
      '-1, --one-file',
      'Embed all resources (CSS and JS) into the same file (default: false)'
    )

    //**************************************
    //
    //  Theme Stuff
    //
    //
    .option(
      '-T, --theme-dir <path-or-theme-name>',
      'specify a path to a directory containing a theme to use. Or specify a built-in theme of "default", "basic" or "spectaql" (default: "default")',
      String
    )
    //
    //
    //**************************************

    //**************************************
    //
    //  CSS Stuff
    //
    //
    .option('-C, --disable-css', 'omit CSS generation (default: false)')
    //
    //
    //**************************************

    //**************************************
    //
    //  JS Stuff
    //
    //
    .option('-J, --disable-js', 'omit JavaScript generation (default: false)')
    //
    //
    //**************************************

    .option(
      '--logo-file <file>',
      'specify a custom logo file (default: null)',
      String
    )
    .option(
      '--no-logo-file',
      'do not use a custom logo file, overriding what may be in the config'
    )

    .option(
      '--favicon-file <file>',
      'specify a custom favicon file (default: null)',
      String
    )
    .option(
      '--no-favicon-file',
      'do not use a custom favicon file, overriding what may be in the config'
    )

    .option(
      '--schema-file <file...>',
      'specify a file, files or glob to files that contain a GraphQL Schema Definitions written in SDL to be used instead of an Introspection Query call (default: none)'
    )
    .option(
      '--introspection-url <url>',
      'specify a URL for an Introspection Query(default: none)',
      String
    )
    .option(
      '--introspection-file <file>',
      'specify a file that contains an Introspection Query response (default: none)',
      String
    )
    .option(
      '--introspection-metadata-file <file>',
      'specify a file that contains metadata to be added to the Introspection Query response (default: none)',
      String
    )
    .option(
      '--dynamic-examples-processing-module <file>',
      'specify a JS module that will dynamically generate schema examples (default: none',
      String
    )

    .option(
      '-H, --headers <headers>',
      'specify arbitrary HTTP headers for the Introspection Query as a JSON string (default: none)',
      String
    )

    .option(
      '-d, --development-mode',
      'start HTTP server with the file watcher (default: false)'
    )
    .option(
      '-D, --development-mode-live',
      'start HTTP server with the file watcher and live reload (default: false)'
    )
    .option(
      '-s, --start-server',
      'start the HTTP server without any development features'
    )
    .option(
      '-p, --port <port>',
      'the port number for the HTTP server to listen on (default: 4400)',
      Number
    )
    .option(
      '-P, --port-live <port>',
      'the port number for the live reload to listen on (default: 4401)',
      Number
    )

    // This option overrides the default directory which contains all the Handlebars templates, SCSS, and JavaScript
    // source files. This option is useful if you've copied the contents of `app` to a remote location or a separate
    // repo and customized it. Probably not something you need to use if you have cloned/forked the repo and customized
    // it
    .option(
      '-a, --app-dir <dir>',
      'the application source directory (default: app)',
      String
    )
    .option(
      '-g, --grunt-config-file <file>',
      'specify a custom Grunt configuration file (default: dist/lib/gruntConfig.js)',
      String
    )
    .option(
      '-N, --noop',
      'This option does nothing, but may be useful in complex CLI scenarios to get argument parsing correct'
    )
    .parse(process.argv)

  const options = program.opts()

  if (options.config) {
    // config => specFile
    options.specFile = options.config
    delete options.config
  } else if (program.args.length >= 1) {
    options.specFile = program.args[0]
  } else {
    // Show help if no specfile or options are specified
    program.help()
  }

  return options
}
