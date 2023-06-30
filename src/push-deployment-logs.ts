import subscribeToDeploymentLogs from '@/api/websocket/subscribe-to-deployment-logs'
import { App, VectorProcess } from '@/types'
import write from '@/vector/write'
import { Client as GqlWsClient } from 'graphql-ws'
import sleep from '@/utils/sleep'

const MAX_RETRIES = 30
const RETRY_BACKOFF_MS = 3000

/**
 * Opens a subscription to Railway's deployment logs API, and pushes the
 * responses into Vector.
 */
const pushDeploymentLogs = async (
  wsClient: GqlWsClient,
  vector: VectorProcess,
  deployment: App.Deployment,
  loopStart: Date,
  maxRetries = MAX_RETRIES,
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
        const { message, severity, timestamp } = log

        // This hacks around Railway's API returning ALL logs at start of
        // stream by only pushing logs from when our event loop starts
        if (loopStart > new Date(timestamp)) {
          return
        }

        console.log('💓')

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
        maxRetries = MAX_RETRIES
      })
    }
  } catch (e) {
    console.error(`Retrying error in pushDeploymentLogs`, e)
    await sleep(RETRY_BACKOFF_MS)
    pushDeploymentLogs(wsClient, vector, deployment, loopStart, maxRetries - 1)
  }
}

export default pushDeploymentLogs
