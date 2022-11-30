import path from 'path'
import fs from 'fs'
import { readdir } from 'fs/promises'
import {fileURLToPath} from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const root = path.join(__dirname, '..')

const vendorSrcDir = path.join(root, 'vendor-src')

if (!pathExists(vendorSrcDir)) {
  console.warn(`No vendor-src directory. Not building vendor packages.`)
  process.exit()
}
const vendorTargetDir = path.join(root, 'vendor')

let isDryRun = isDryRunFn()
// isDryRun = true

ensureDirectory(vendorTargetDir)

const sourceDirectories = (await readdir(vendorSrcDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

for (const sourceDirectory of sourceDirectories) {
  // Pack the thing....
  const packageName = sourceDirectory
  let options = [
    `--pack-destination ${vendorTargetDir}`
  ]

  if (isDryRun) {
    options.push(
      '--dry-run'
    )
  }

  let args = options.join(' ')
  let command = `npm pack ${args}`
  let tarballName = await execSync(
    command,
    {
      cwd: path.join(vendorSrcDir, sourceDirectory)
    }
  )
  tarballName = getTarballNameFromOutput(tarballName.toString())

  // Unpack the thing...
  const tarballPath = path.join(vendorTargetDir, tarballName)
  const packageDirectory = path.join(vendorTargetDir, packageName)

  ensureDirectory(packageDirectory)

  options = [
    '--strip-components 1',
    `-C ${packageDirectory}`,
    '-xvf',
  ]

  args = options.join(' ')
  command = `tar ${args} ${tarballPath}`

  if (isDryRun) {
    continue
  }

  await execSync(command)

  // Remove the tarball
  await execSync(`rm ${tarballPath}`)
}

function isDryRunFn () {
  return process.env.npm_config_dry_run === true
}

function stripSpecial (str) {
  while (['\n', '\t'].includes(str[str.length - 1])) {
    str = str.slice(0, -1)
  }
  return str
}

function pathExists (path) {
  return fs.existsSync(path)
}

function ensureDirectory (path) {
  if (!pathExists(path)){
    fs.mkdirSync(path);
  }
}

function getTarballNameFromOutput (str) {
  str = stripSpecial(str)
  return str.split('\n').pop()
}
