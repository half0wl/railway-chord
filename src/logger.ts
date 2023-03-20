import {
  ApolloClient as GqlHttpClient,
  NormalizedCacheObject,
} from '@apollo/client/core'
import { Client as GqlWsClient } from 'graphql-ws'
import {
  getProjectData,
  subscribeToDeploymentLogs,
  subscribeToPluginLogs,
} from './queries/calls'
import App, { VectorProcess } from './types/app'
import { write } from './vector'

/**
 * Pushes the Deployment and Plugin logs of `projectIds` into Vector.
 */
const run = async (
  httpClient: GqlHttpClient<NormalizedCacheObject>,
  wsClient: GqlWsClient,
  vector: VectorProcess,
  projectIds: App.ProjectId[],
) => {
  console.info(`🔄 Refreshing projects!`)
  const state = await Promise.all(
    projectIds.map(async (id) => {
      const project = await getProjectData(httpClient, id)
      return {
        projectId: id,
        plugins: project.plugins,
        deployments: project.deployments,
      }
    }),
  )

  console.info(`✅ Enabling for:`)
  state.forEach(async ({ deployments, plugins, projectId }) => {
    console.info(`   > projectId=${projectId}`)
    deployments.forEach(async (d) => {
      console.info(`     - deployment=${d.staticUrl}, deploymentId=${d.id}`)
      pushDeploymentLogs(wsClient, vector, d)
    })
    plugins.forEach(async (p) => {
      console.info(
        `     - plugin=${p.name}, pluginId=${p.id}, env=${p.environmentName}`,
      )
      pushPluginLogs(wsClient, vector, p)
    })
  })
}

/**
 * Write Deployment logs to Vector.
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
            environment: null, // @TODO
          },
          ...log,
        }
        write(vector, JSON.stringify(out))
      })
    }
  } catch (e) {
    console.error('Error reading deployment logs', e)
    process.exit(1)
  }
}

/**
 * Write Plugin logs to Vector.
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
    console.error('Error reading plugin logs', e)
    process.exit(1)
  }
}

export default run
