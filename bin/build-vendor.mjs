// TODO: Don't require building the vendor packages anymore. Somehow make them output properly by Babel
// or something
import path from 'path'
import fs from 'fs'
import { readdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { execSync as exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const root = path.join(__dirname, '..')

const CACHE_FILE_NAME = '.spectaql-cache'
const vendorSrcDir = path.join(root, 'vendor-src')

if (!pathExists(vendorSrcDir)) {
  console.log(`No vendor-src directory. Not building vendor packages.`)
  // Need to pass 0 here explicitly just to be safe:
  // https://github.com/nodejs/node/issues/40808
  process.exit(0)
}
const vendorTargetDir = path.join(root, 'vendor')

let isDryRun = isDryRunFn()
// isDryRun = true

ensureDirectory(vendorTargetDir)
;(async function () {
  const sourceDirectoryNames = (
    await readdir(vendorSrcDir, { withFileTypes: true })
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

  for (const sourceDirectoryName of sourceDirectoryNames) {
    // Pack the thing....
    const packageName = sourceDirectoryName
    const packageDirectory = path.join(vendorTargetDir, packageName)
    const sourceDirectory = path.join(vendorSrcDir, sourceDirectoryName)

    // Only set this value if we want/need to write to the FS
    let newCacheValue

    const entry = await getOldestFileInDirectoryTs(sourceDirectory)
    const calculatedValue = Math.max(
      entry.stats.ctime.getTime(),
      entry.stats.mtime.getTime()
    ).toString()
    const existingValue = getCacheValue(sourceDirectory)
    if (!pathExists(packageDirectory)) {
      // Always write it and always do it if the thing did not exist
      newCacheValue = calculatedValue
    } else {
      if (existingValue === calculatedValue) {
        if (!shouldForce()) {
          continue
        }
      } else {
        newCacheValue = calculatedValue
      }
    }

    console.log(`Building managed vendor dependency: ${packageName}`)

    // See if we can skip doing this again
    if (pathExists(packageDirectory)) {
      const entry = await getOldestFileInDirectoryTs(sourceDirectory)
      const calculatedValue = Math.max(
        entry.stats.ctime.getTime(),
        entry.stats.mtime.getTime()
      ).toString()
      const existingValue = getCacheValue(sourceDirectory)
      if (existingValue === calculatedValue) {
        if (!shouldForce()) {
          continue
        }
      } else {
        newCacheValue = calculatedValue
      }
    }

    let options = [`--pack-destination ${vendorTargetDir}`]

    if (isDryRun) {
      options.push('--dry-run')
    }

    let args = options.join(' ')
    let command = `npm pack ${args}`

    let tarballName = await exec(command, {
      cwd: path.join(vendorSrcDir, sourceDirectoryName),
      // TODO: don't ignore STDERR but only log it if there's a problem
      stdio: [undefined, undefined, 'ignore'],
    })

    tarballName = getTarballNameFromOutput(tarballName.toString())

    // Unpack the thing...
    const tarballPath = path.join(vendorTargetDir, tarballName)

    ensureDirectory(packageDirectory)

    options = ['--strip-components 1', `-C ${packageDirectory}`, '-xvf']

    args = options.join(' ')
    command = `tar ${args} ${tarballPath}`

    if (isDryRun) {
      continue
    }

    // TODO: don't ignore STDERR but only log it if there's a problem
    await exec(command, { stdio: [undefined, undefined, 'ignore'] })

    // Remove the tarball
    removeFile(tarballPath)

    // Only should be set when we should write it to the file system
    if (newCacheValue) {
      setCacheValue(sourceDirectory, newCacheValue)
    }

    console.log('Done.')
  }
})()

function isDryRunFn() {
  return [true, 'true'].includes(process.env.npm_config_dry_run)
}

function stripSpecial(str) {
  while (['\n', '\t'].includes(str[str.length - 1])) {
    str = str.slice(0, -1)
  }
  return str
}

function pathExists(pth) {
  return fs.existsSync(pth)
}

function ensureDirectory(pth) {
  if (!pathExists(pth)) {
    fs.mkdirSync(pth)
  }
}

function removeFile(pth, options) {
  options = {
    // When true, exceptions will be ignored if path does not exist. Default: false.
    force: true,
    ...options,
  }
  // https://nodejs.org/docs/latest-v16.x/api/fs.html#fsrmsyncpath-options
  return fs.rmSync(pth, options)
}

function getTarballNameFromOutput(str) {
  str = stripSpecial(str)
  return str.split('\n').pop()
}

function shouldForce() {
  return process.argv.includes('--force')
}

async function getOldestFileInDirectoryTs(pth) {
  const fileStats = await gatherFileStats(pth)
  const orderedFileStats = orderFileStats(fileStats)
  return orderedFileStats?.[0]
}

function orderFileStats(fileStats) {
  return fileStats.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs)
}

async function gatherFileStats(pth, files = []) {
  for (const entry of await readdir(pth, { withFileTypes: true })) {
    const entryPath = path.join(pth, entry.name)
    if (entry.isDirectory()) {
      // Don't go into node_modules
      if (entry.name === 'node_modules') {
        continue
      }
      await gatherFileStats(entryPath, files)
    } else {
      // Don't count our cache file
      if (entry.name === CACHE_FILE_NAME) {
        continue
      }
      files.push({
        name: entry.name,
        stats: fs.lstatSync(entryPath),
      })
    }
  }

  return files
}

function getCacheValue(dir) {
  const pth = path.join(dir, CACHE_FILE_NAME)
  if (!pathExists(pth)) {
    return
  }
  return fs.readFileSync(pth, 'utf8')
}

function setCacheValue(dir, value) {
  const pth = path.join(dir, CACHE_FILE_NAME)
  return fs.writeFileSync(pth, value.toString())
}
