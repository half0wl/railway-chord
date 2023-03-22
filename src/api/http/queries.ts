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

export { ProjectQuery }
