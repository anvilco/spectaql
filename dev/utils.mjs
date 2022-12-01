import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const root = path.join(__dirname, '..')

export function isDryRun () {
  return process.env.npm_config_dry_run === true
}

export function stripSpecial (str) {
  while (['\n', '\t'].includes(str[str.length - 1])) {
    str = str.slice(0, -1)
  }
  return str
}

export function ensureDirectory (path) {
  if (!fs.existsSync(path)){
    fs.mkdirSync(path);
  }
}

export function getTarballNameFromOutput (str) {
  str = stripSpecial(str)
  return str.split('\n').pop()
}

