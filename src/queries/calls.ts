import {
  ApolloClient as GqlHttpClient,
  NormalizedCacheObject,
} from '@apollo/client/core'
import {
  Client as GqlWsClient,
  ExecutionResult,
  SubscribePayload,
} from 'graphql-ws'
import { DeploymentLogs, PluginLogs, ProjectQuery } from './gql'
import QueryResponse from '../types/queries'
import App, { Deferred } from '../types/app'

/**
 * Returns an async-iterable stream of a GQL subscription.
 *
 * Usage:
 * ```typescript
 * const subscription = subscribe({ ... })
 * for await (const result of subscription) {
 *   ...
 * }
 * ```
 *
 * Based on this example from `graphql-ws`:
 * https://github.com/enisdenjo/graphql-ws#async-iterator
 */
const wsSubscribe = <T>(
  client: GqlWsClient,
  payload: SubscribePayload,
): AsyncGenerator<ExecutionResult<T, unknown>> => {
  const pending: ExecutionResult<T, unknown>[] = []
  let deferred: Deferred | null = null
  let throwMe: unknown = null,
    done = false

  const dispose = client.subscribe<T>(payload, {
    next: (data) => {
      pending.push(data)
      deferred?.resolve(false)
    },
    error: (err) => {
      throwMe = err
      deferred?.reject(throwMe)
    },
    complete: () => {
      done = true
      deferred?.resolve(true)
    },
  })

  return {
    [Symbol.asyncIterator]() {
      return this
    },
    async next() {
      if (done) return { done: true, value: undefined }
      if (throwMe) throw throwMe
      if (pending.length) return { value: pending.shift()! }
      return (await new Promise<boolean>(
        (resolve, reject) => (deferred = { resolve, reject }),
      ))
        ? { done: true, value: undefined }
        : { value: pending.shift()! }
    },
    async throw(err) {
      throw err
    },
    async return() {
      dispose()
      return { done: true, value: undefined }
    },
  }
}

/**
 * Returns a `projectId`'s plugins and its latest deployment of services (in
 * any environment).
 */
const getProjectData = async (
  client: GqlHttpClient<NormalizedCacheObject>,
  projectId: App.ProjectId,
): Promise<App.State> => {
  const res = await client.query<QueryResponse.ProjectQueryResponse>({
    query: ProjectQuery,
    variables: {
      projectId,
    },
  })
  const project = res.data.project

  // Each Plugin has its own Environment-specific instance, which makes this
  // unique by a `(environmentId, pluginId)` tuple.
  const plugins: App.Plugin[] = project.environments.edges.flatMap((e) => {
    return project.plugins.edges.map((p) => {
      return {
        id: p.node.id,
        name: p.node.name,
        environmentId: e.node.id,
        environmentName: e.node.name,
      }
    })
  })

  // Latest Deployment of each Service in the Project.
  const deployments: App.Deployment[] = project.services.edges.flatMap((s) => {
    return s.node.deployments.edges.map((d) => {
      return {
        id: d.node.id,
        staticUrl: d.node.staticUrl,
        serviceId: s.node.id,
      }
    })
  })

  return Promise.resolve({ projectId, plugins, deployments })
}

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

/**
 * Returns an async-iterable subscription to plugin logs.
 */
const subscribeToPluginLogs = (
  client: GqlWsClient,
  pluginId: string,
  environmentId: string,
): AsyncGenerator<
  ExecutionResult<QueryResponse.PluginLogsResponse, unknown>
> => {
  return wsSubscribe<QueryResponse.PluginLogsResponse>(client, {
    query: PluginLogs,
    variables: { pluginId, environmentId },
  })
}

export { subscribeToPluginLogs, subscribeToDeploymentLogs, getProjectData }
