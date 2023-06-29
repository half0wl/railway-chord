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
  severity
	message
  tags {
    deploymentId
    deploymentInstanceId
    environmentId
    projectId
    serviceId
  }
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
  severity
	message
  tags {
    deploymentId
    deploymentInstanceId
    environmentId
    projectId
    serviceId
  }
}
`

export { DeploymentLogs, PluginLogs }
