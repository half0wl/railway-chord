import { ChildProcessWithoutNullStreams } from 'child_process'

type VectorProcess = ChildProcessWithoutNullStreams

interface Deferred {
  resolve: (done: boolean) => void
  reject: (err: unknown) => void
}

/**
 * Internal application state.
 */
namespace App {
  export type ProjectId = string

  export interface Plugin {
    id: string
    name: string
    environmentId: string
    environmentName: string
  }

  export interface Deployment {
    id: string
    staticUrl: string
    serviceId: string
  }

  export interface State {
    projectId: ProjectId
    plugins: Plugin[]
    deployments: Deployment[]
  }
}

export { Deferred, VectorProcess }
export default App
