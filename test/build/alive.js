import { run, resolveOptions } from 'spectaql'

const options = {
  specFile: './config.yml',
  themeDir: '../../examples/themes/my-partial-theme',
}

const resolvedOptions = resolveOptions(options)
console.warn('Trying on Node ' + process.version)

if (typeof run !== 'function') {
  console.error("I didn't work.")
  process.exit(1)
}

run(resolvedOptions)
  .then((result) => {
    const { html } = result

    if (typeof html !== 'string') {
      console.error(`html is not a string: ${html}`)
      process.exit(1)
    } else {
      console.log('html is a string')
    }

    if (!html.includes('Operationz')) {
      console.error(`html did not appear to use theme`)
      process.exit(1)
    } else {
      console.log('html appears to have used the theme')
    }

    console.log('I worked!')
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
