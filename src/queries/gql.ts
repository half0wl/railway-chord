import { gql } from '@apollo/client/core'

// Subscribe to DeploymentLogs
const DeploymentLogs = `
subscription DeploymentLogs(
	$deploymentId: String!
	$filter: String
	$limit: Int
) {
	deploymentLogs(deploymentId: $deploymentId, filter: $filter, limit: $limit) {
		...LogFields
	}
}

fragment LogFields on Log {
	timestamp
	message
}
`

// Subscribe to PluginLogs
const PluginLogs = `
subscription PluginLogs(
	$pluginId: String!
	$environmentId: String!
	$filter: String
	$limit: Int
) {
	pluginLogs(
    pluginId: $pluginId,
    environmentId: $environmentId,
    filter: $filter,
    limit: $limit
  ) {
		...LogFields
	}
}

fragment LogFields on Log {
	timestamp
	message
}
`

// Fetch information about a project, its plugins, services, and deployments
const ProjectQuery = gql`
  query project($projectId: String!) {
    project(id: $projectId) {
      id
      name
      plugins {
        edges {
          node {
            id
            name
          }
        }
      }
      services {
        edges {
          node {
            id
            name
            deployments {
              edges {
                node {
                  id
                  staticUrl
                }
              }
            }
          }
        }
      }
      environments {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`

export { ProjectQuery, DeploymentLogs, PluginLogs }
