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
  loopStart: Date,
) => {
  for await (const result of subscribeToPluginLogs(
    wsClient,
    plugin.id,
    plugin.environmentId,
  )) {
    result.data?.pluginLogs.forEach((log) => {
      // This hacks around Railway's API returning ALL logs at start of
      // stream by only pushing logs from when our event loop starts
      if (loopStart > new Date(log.timestamp)) {
        return
      }

      const out = {
        railway: {
          type: 'PLUGIN',
          pluginName: plugin.name,
          pluginId: plugin.id,
          environmentId: plugin.environmentId,
          environmentName: plugin.environmentName,
        },
        ...log,
      }

      write(vector, JSON.stringify(out))
    })
  }
}

export default pushPluginLogs
