import subscribeToPluginLogs from '@/api/websocket/subscribe-to-plugin-logs'
import { App, VectorProcess } from '@/types'
import write from '@/vector/write'
import { Client as GqlWsClient } from 'graphql-ws'
import sleep from '@/utils/sleep'

const MAX_RETRIES = 30
const RETRY_BACKOFF_MS = 3000

/**
 * Opens a subscription to Railway's plugin logs API, and pushes the
 * responses into Vector.
 */
const pushPluginLogs = async (
  wsClient: GqlWsClient,
  vector: VectorProcess,
  plugin: App.Plugin,
  loopStart: Date,
  maxRetries = MAX_RETRIES,
) => {
  if (maxRetries <= 0) {
    console.error(`Max retries exceeded on pushPluginLogs, crashing!`)
    process.exit(1)
  }
  try {
    for await (const result of subscribeToPluginLogs(
      wsClient,
      plugin.id,
      plugin.environmentId,
    )) {
      result.data?.pluginLogs.forEach((log) => {
        const { message, severity, timestamp } = log

        // This hacks around Railway's API returning ALL logs at start of
        // stream by only pushing logs from when our event loop starts
        if (loopStart > new Date(log.timestamp)) {
          return
        }

        console.log('💓')

        const out = {
          message,
          severity,
          timestamp,
          railway: {
            type: 'PLUGIN',
            ...log.tags,
            pluginName: plugin.name,
            pluginId: plugin.id,
            environmentId: plugin.environmentId,
            environmentName: plugin.environmentName,
          },
        }

        write(vector, JSON.stringify(out))
        maxRetries = MAX_RETRIES
      })
    }
  } catch (e) {
    console.error(`Retrying error in pushPluginLogs`, e)
    await sleep(RETRY_BACKOFF_MS)
    pushPluginLogs(wsClient, vector, plugin, loopStart, maxRetries - 1)
  }
}

export default pushPluginLogs
