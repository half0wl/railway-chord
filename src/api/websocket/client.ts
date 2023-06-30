import { WsClient } from '@/types'
import { createClient } from 'graphql-ws'
import ReconnectingWebSocket, {
  UrlProvider,
  Options as ReconnectionOptions,
} from 'reconnecting-websocket'
import WebSocket from 'ws'

/**
 * Creates an authenticated GQL WebSocket client.
 */
const createWsClient = (endpoint: string, apiToken: string): WsClient => {
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
  class AuthenticatedReconnectingWebSocket extends ReconnectingWebSocket {
    constructor(
      url: UrlProvider,
      protocols?: string | string[],
      options?: ReconnectionOptions,
    ) {
      super(url, protocols, {
        WebSocket: AuthenticatedWebSocket,
        connectionTimeout: 3000,
        maxRetries: 30,
        ...options,
      })
    }
  }
  return createClient({
    url: endpoint,
    webSocketImpl: AuthenticatedReconnectingWebSocket,
  })
}

export default createWsClient
