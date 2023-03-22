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
) => {
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
    // @TODO This needs some re-try logic. If there's a momentary API error,
    // this will crash the service (intentional for now).
    console.error('Error reading plugin logs', e)
    process.exit(1)
  }
}

export default pushPluginLogs
