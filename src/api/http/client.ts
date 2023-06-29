import { HttpClient } from '@/types'
import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from '@apollo/client/core'
import { RetryLink } from '@apollo/client/link/retry'

/**
 * Creates an authenticated GQL HTTP client.
 */
const createHttpClient = (endpoint: string, apiToken: string): HttpClient => {
  const httpLink = new HttpLink({
    uri: endpoint,
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })

  const retryLink = new RetryLink({
    delay: {
      initial: 300,
      max: Infinity,
      jitter: true,
    },
    attempts: {
      max: 5,
      retryIf: (error, _operation) => !!error,
    },
  })

  const link = ApolloLink.from([retryLink, httpLink])

  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
  })
}

export default createHttpClient
