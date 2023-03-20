/**
 * Response types.
 *
 * @NOTE: I'm maintaining this manually because it's only three queries. If
 * the number of queries grow, look into using GQL client codegen tools.
 */
namespace QueryResponse {
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
  }

  namespace EdgeResponses {
    export interface Deployments {
      __typename: 'ServiceDeploymentsConnection'
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
    export interface Services {
      __typename: 'ProjectServicesConnection'
      edges: Edge.Service[]
    }
  }

  namespace Edge {
    export interface Deployment {
      __typename: 'ServiceDeploymentsConnectionEdge'
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
    export interface Service {
      __typename: 'ProjectServicesConnectionEdge'
      node: Node.Service
    }
  }

  namespace Node {
    export interface Deployment {
      __typename: 'Deployment'
      id: string
      staticUrl: string
    }

    export interface Environment {
      __typename: 'Environment'
      id: string
      name: string
    }

    export interface Project {
      __typename: 'Project'
      id: string
      name: string
      plugins: EdgeResponses.Plugins
      services: EdgeResponses.Services
      environments: EdgeResponses.Environments
    }

    export interface Plugin {
      __typename: 'Plugin'
      id: string
      name: string
    }

    export interface Service {
      __typename: 'Service'
      id: string
      name: string
      deployments: EdgeResponses.Deployments
    }
  }
}

export default QueryResponse
