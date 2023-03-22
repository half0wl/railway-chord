import { PluginLogs } from '@/api/websocket/queries'
import wsSubscribe from '@/api/websocket/subscribe'
import { QueryResponse } from '@/types'
import { Client as GqlWsClient, ExecutionResult } from 'graphql-ws'

/**
 * Returns an async-iterable subscription to plugin logs.
 */
const subscribeToPluginLogs = (
  client: GqlWsClient,
  pluginId: string,
  environmentId: string,
): AsyncGenerator<
  ExecutionResult<QueryResponse.PluginLogsResponse, unknown>
> => {
  return wsSubscribe<QueryResponse.PluginLogsResponse>(client, {
    query: PluginLogs,
    variables: { pluginId, environmentId },
  })
}

export default subscribeToPluginLogs
