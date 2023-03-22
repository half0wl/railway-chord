import { ProjectQuery } from '@/api/http/queries'
import { App, QueryResponse } from '@/types'
import {
  ApolloClient as GqlHttpClient,
  NormalizedCacheObject,
} from '@apollo/client/core'

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

export default getProjectData
