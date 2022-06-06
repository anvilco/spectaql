module.exports = function (options) {
  const { url, server, servers } = options?.data?.root || {}

  const displayAllServers =
    options?.data?.root?.allOptions?.specData?.spectaql?.displayAllServers ===
    true
  if (!displayAllServers) {
    if (url) {
      return url
    }
    if (server?.url) {
      return server.url
    }
    const fallbackServer =
      servers?.find((server) => server.url && server.production) ||
      servers?.find((server) => server.url)
    if (fallbackServer) {
      return fallbackServer.url
    }
  }

  if (!servers?.length) {
    return '<<url is missing>>'
  }

  return servers
    .map(
      (server) =>
        '# ' +
        (server.description?.trim() || 'Endpoint') +
        ':\n' +
        (server.url?.trim() || '<<url is missing>>') +
        '\n'
    )
    .join('')
}
