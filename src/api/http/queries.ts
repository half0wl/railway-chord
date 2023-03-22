import { gql } from '@apollo/client/core'

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
      environments {
        edges {
          node {
            id
            name
            deployments(first: 1) {
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
    }
  }
`

export { ProjectQuery }
