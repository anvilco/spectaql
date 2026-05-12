module.exports = function (options) {
  const { url, server, servers } = options?.data?.root || {}

  const displayAllServers =
    options?.data?.root?.allOptions?.specData?.spectaql?.displayAllServers ===
    true
  if (!displayAllServers) {
    const productionServers = servers?.filter(
      (server) => server.url && server.production
    )
    if (productionServers?.length > 1) {
      return productionServers
        .map(
          (server) =>
            '# ' +
            (server.description?.trim() || 'Endpoint') +
            ':\n' +
            server.url.trim() +
            '\n'
        )
        .join('')
    }
    if (url) {
      return url
    }
    if (server?.url) {
      return server.url
    }
    const fallbackServer = productionServers?.[0] || servers?.find((server) => server.url)
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
