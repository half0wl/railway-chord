import { Client, createClient } from 'graphql-ws'
import WebSocket from 'ws'

/**
 * Creates an authenticated GQL WebSocket client.
 */
const createWsClient = (endpoint: string, apiToken: string): Client => {
  class AuthenticatedWebSocket extends WebSocket {
    constructor(address: string, protocols: string[]) {
      super(address, protocols, {
        // https://github.com/railwayapp/cli/blob/cabd83ea3d4e1853f6508954e8b58a5239051b4a/src/subscription.rs
        headers: {
          'Sec-WebSocket-Protocol': 'graphql-transport-ws',
          Authorization: `Bearer ${apiToken}`,
        },
      })
    }
  }
  return createClient({
    url: endpoint,
    webSocketImpl: AuthenticatedWebSocket,
  })
}

export default createWsClient
