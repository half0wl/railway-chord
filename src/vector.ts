import { spawn as nodeSpawn } from 'child_process'
import { VectorProcess } from './types/app'
import { bytes2utf8 } from './utils'

const spawn = (
  binPath: string,
  cfgPath: string,
  stdout: boolean = false,
): VectorProcess => {
  const vector = nodeSpawn(binPath, ['--config', cfgPath])
  if (stdout === true) {
    vector.stdout.on('data', (data) => {
      console.log(`[process::vector/stdout] ${bytes2utf8(data)}`)
    })
  }
  vector.stderr.on('data', (data) => {
    console.error(`[process::vector/stderr] ${bytes2utf8(data)}`)
  })
  vector.on('error', (error) => {
    console.error(`[process::vector/error]`, error)
  })
  vector.on('close', (exitCode) => {
    console.error(`[process::vector/exited] Exited with ${exitCode}`)
    process.exit(1)
  })
  return vector
}

const write = (process: VectorProcess, data: string) => {
  process.stdin.cork() // create buffer
  process.stdin.write(`${data}\n`)
  process.stdin.uncork() // flush buffer
}

export { spawn, write }
