import { ApolloClient, NormalizedCacheObject } from '@apollo/client/core'
import { ChildProcessWithoutNullStreams } from 'child_process'
import { Client } from 'graphql-ws'

export type VectorProcess = ChildProcessWithoutNullStreams

export type HttpClient = ApolloClient<NormalizedCacheObject>

export type WsClient = Client

export interface VectorConfiguration {
  contents: string  // This holds the actual Vector config in toml format.
  enabled: string[]
}

export interface Deferred {
  resolve: (done: boolean) => void
  reject: (err: unknown) => void
}

/**
 * Internal application state.
 */
export namespace App {
  export type ProjectId = string

  export interface Plugin {
    id: string
    name: string
    environmentId: string
    environmentName: string
  }

  export interface Deployment {
    id: string
    environmentName: string
    staticUrl: string
  }

  export interface State {
    projectId: ProjectId
    plugins: Plugin[]
    deployments: Deployment[]
  }
}

/**
 * Response types.
 *
 * @NOTE: I'm maintaining this manually because it's only three queries. If
 * the number of queries grow, look into using GQL client codegen tools.
 */
export namespace QueryResponse {
  export interface ProjectQueryResponse {
    project: Node.Project
  }

  export interface DeploymentLogsResponse {
    deploymentLogs: Log[]
  }

  export interface PluginLogsResponse {
    pluginLogs: Log[]
  }

  interface Log {
    timestamp: string
    message: string
    severity: string
    tags: LogTags
  }

  interface LogTags {
    deploymentId: string
    deploymentInstanceId: string
    environmentId: string
    projectId: string
    serviceId: string
  }

  namespace EdgeResponses {
    export interface Deployments {
      __typename: 'EnvironmentDeploymentsConnection'
      edges: Edge.Deployment[]
    }

    export interface Environments {
      __typename: 'ProjectEnvironmentsConnection'
      edges: Edge.Environment[]
    }
    export interface Plugins {
      __typename: 'ProjectPluginsConnection'
      edges: Edge.Plugin[]
    }
  }

  namespace Edge {
    export interface Deployment {
      __typename: 'EnvironmentDeploymentsConnectionEdge'
      node: Node.Deployment
    }
    export interface Environment {
      __typename: 'ProjectEnvironmentsConnectionEdge'
      node: Node.Environment
    }
    export interface Plugin {
      __typename: 'ProjectPluginsConnectionEdge'
      node: Node.Plugin
    }
  }

  namespace Node {
    export interface Deployment {
      __typename: 'Deployment'
      id: string
      staticUrl: string
      environment: {
        name: string
      }
    }

    export interface Environment {
      __typename: 'Environment'
      id: string
      name: string
      deployments: EdgeResponses.Deployments
    }

    export interface Project {
      __typename: 'Project'
      id: string
      name: string
      plugins: EdgeResponses.Plugins
      environments: EdgeResponses.Environments
    }

    export interface Plugin {
      __typename: 'Plugin'
      id: string
      name: string
    }
  }
}
