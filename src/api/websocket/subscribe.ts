import {
  Client as GqlWsClient,
  ExecutionResult,
  SubscribePayload,
} from 'graphql-ws'
import { Deferred } from '@/types'

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

export default wsSubscribe
