import { HttpClient } from '@/types'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'

/**
 * Creates an authenticated GQL HTTP client.
 */
const createHttpClient = (endpoint: string, apiToken: string): HttpClient => {
  return new ApolloClient({
    uri: endpoint,
    cache: new InMemoryCache(),
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })
}

export default createHttpClient
