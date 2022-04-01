import fs from 'fs'
import yaml from 'js-yaml'

export default function (path) {
  const fileContent = fs.readFileSync(path, 'utf8')
  return yaml.load(fileContent)
}
