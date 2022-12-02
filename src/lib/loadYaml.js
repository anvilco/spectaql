import fs from 'fs'
import yaml from 'js-yaml'

import { substituteEnvOnObject } from './interpolation'

export default function loadYaml(path) {
  const fileContent = fs.readFileSync(path, 'utf8')
  const loadedYaml = yaml.load(fileContent)
  return substituteEnvOnObject(loadedYaml)
}
