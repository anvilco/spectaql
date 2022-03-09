const {
  addMetadata: addMetadataFn,
} = require('@anvilco/apollo-server-plugin-introspection-metadata')

const { fileToObject } = require('./utils')

const loadMetadataFromFile = ({ pathToFile } = {}) => {
  return fileToObject(pathToFile)
}

const addMetadataFromFile = ({
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

const addMetadata = ({
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

module.exports = {
  loadMetadataFromFile,
  addMetadataFromFile,
  addMetadata,
}
