import { DeploymentLogs } from '@/api/websocket/queries'
import wsSubscribe from '@/api/websocket/subscribe'
import { QueryResponse } from '@/types'
import { Client as GqlWsClient, ExecutionResult } from 'graphql-ws'

/**
 * Returns an async-iterable subscription to deployment logs.
 */
const subscribeToDeploymentLogs = (
  client: GqlWsClient,
  deploymentId: string,
): AsyncGenerator<
  ExecutionResult<QueryResponse.DeploymentLogsResponse, unknown>
> => {
  return wsSubscribe(client, {
    query: DeploymentLogs,
    variables: { deploymentId },
  })
}

export default subscribeToDeploymentLogs
