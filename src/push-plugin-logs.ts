import subscribeToPluginLogs from '@/api/websocket/subscribe-to-plugin-logs'
import { App, VectorProcess } from '@/types'
import write from '@/vector/write'
import { Client as GqlWsClient } from 'graphql-ws'

/**
 * Opens a subscription to Railway's plugin logs API, and pushes the
 * responses into Vector.
 */
const pushPluginLogs = async (
  wsClient: GqlWsClient,
  vector: VectorProcess,
  plugin: App.Plugin,
  maxRetries = 30,
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
        const out = {
          railway: {
            type: 'PLUGIN',
            name: plugin.name,
            id: plugin.id,
            environment: plugin.environmentName,
          },
          ...log,
        }
        write(vector, JSON.stringify(out))
      })
    }
  } catch (e) {
    console.error(`Retrying error in pushPluginLogs: ${e}`)
    console.error((e as any).stack)
    pushPluginLogs(wsClient, vector, plugin, maxRetries - 1)
  }
}

export default pushPluginLogs
