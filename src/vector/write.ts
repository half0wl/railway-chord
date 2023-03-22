import { VectorProcess } from '@/types'

const write = (process: VectorProcess, data: string) => {
  process.stdin.cork() // create buffer
  process.stdin.write(`${data}\n`)
  process.stdin.uncork() // flush buffer
}

export default write
