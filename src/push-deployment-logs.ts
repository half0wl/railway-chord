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
  maxRetries = 30,
) => {
  if (maxRetries <= 0) {
    console.error(`Max retries exceeded on pushDeploymentLogs, crashing!`)
    process.exit(1)
  }
  try {
    for await (const result of subscribeToDeploymentLogs(
      wsClient,
      deployment.id,
    )) {
      result.data?.deploymentLogs.forEach((log) => {
        const tags = {
          ...log.tags,
          deploymentName: deployment.staticUrl,
          environmentName: deployment.environmentName,
        }
        const out = {
          message: log.message,
          severity: log.severity,
          timestamp: log.timestamp,
          railway: {
            type: 'DEPLOYMENT',
            ...tags,
          },
        }
        write(vector, JSON.stringify(out))
      })
    }
  } catch (e) {
    console.error(`Retrying error in pushDeploymentLogs: ${e}`)
    console.error((e as any).stack)
    pushDeploymentLogs(wsClient, vector, deployment, maxRetries - 1)
  }
}

export default pushDeploymentLogs
