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
  loopStart: Date,
) => {
  for await (const result of subscribeToDeploymentLogs(
    wsClient,
    deployment.id,
  )) {
    result.data?.deploymentLogs.forEach((log) => {
      const { message, severity, timestamp } = log

      // This hacks around Railway's API returning ALL logs at start of
      // stream by only pushing logs from when our event loop starts
      if (loopStart > new Date(timestamp)) {
        return
      }

      const out = {
        message,
        severity,
        timestamp,
        railway: {
          type: 'DEPLOYMENT',
          ...log.tags,
          deploymentUrl: deployment.staticUrl,
          environmentName: deployment.environmentName,
        },
      }

      write(vector, JSON.stringify(out))
    })
  }
}

export default pushDeploymentLogs
