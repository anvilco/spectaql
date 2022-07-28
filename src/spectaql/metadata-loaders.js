import { addMetadata as addMetadataFn } from '@anvilco/apollo-server-plugin-introspection-metadata'

import { fileToObject } from './utils'

export { addMetadataFromDirectables } from './directive'

export const loadMetadataFromFile = ({ pathToFile } = {}) => {
  return fileToObject(pathToFile)
}

export const addMetadataFromFile = ({
  pathToFile,
  introspectionQueryResponse,
  metadatasReadPath,
  metadatasWritePath,
} = {}) => {
  const metadata = loadMetadataFromFile({ pathToFile })
  return addMetadata({
    introspectionQueryResponse,
    metadata,
    metadatasReadPath,
    metadatasWritePath,
  })
}

export const addMetadata = ({
  introspectionQueryResponse,
  metadata,
  metadatasReadPath: metadataSourceKey,
  metadatasWritePath: metadataTargetKey,
} = {}) => {
  return addMetadataFn({
    introspectionQueryResponse,
    schemaMetadata: metadata,
    metadataSourceKey,
    metadataTargetKey,
  })
}
