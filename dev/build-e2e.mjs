import path from 'path'
import fs from 'fs'
import { readdir } from 'fs/promises'
import {fileURLToPath} from 'url'
import { execSync } from 'child_process'

import {
  root,
  isDryRun as isDryRunFn,
  getTarballNameFromOutput,
  ensureDirectory,
} from './utils.mjs'


let isDryRun = isDryRunFn()
// isDryRun = true

const e2eDir = path.join(root, 'test/e2e')
ensureDirectory(e2eDir)

// Pack the thing....
const packageName = 'spectaql'
let options = [
  `--pack-destination ${e2eDir}`
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
    cwd: root,
  }
)
tarballName = getTarballNameFromOutput(tarballName.toString())

// Rename the thing
const originalPath = path.join(e2eDir, tarballName)
const newPath = path.join(e2eDir, 'spectaql.tgz')

await execSync(`mv ${originalPath} ${newPath}`)
