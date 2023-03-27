import subscribeToDeploymentLogs from '@/api/websocket/subscribe-to-deployment-logs'
import { App, VectorProcess } from '@/types'
import write from '@/vector/write'
import { Client as GqlWsClient } from 'graphql-ws'

/**
 * Opens a subscription to Railway's deployment logs API, and pushes the
 * responses into Vector.
 */
const pushDeploymentLogs = async (
  wsClient: GqlWsClient,
  vector: VectorProcess,
  deployment: App.Deployment,
) => {
  try {
    for await (const result of subscribeToDeploymentLogs(
      wsClient,
      deployment.id,
    )) {
      result.data?.deploymentLogs.forEach((log) => {
        const out = {
          railway: {
            type: 'DEPLOYMENT',
            name: deployment.staticUrl,
            id: deployment.id,
            environment: deployment.environmentName,
          },
          ...log,
        }
        write(vector, JSON.stringify(out))
      })
    }
  } catch (e) {
    // @TODO This needs some re-try logic. If there's a momentary API error,
    // this will crash the service (intentional for now).
    console.error('Error reading deployment logs', e)
    process.exit(1)
  }
}

export default pushDeploymentLogs
