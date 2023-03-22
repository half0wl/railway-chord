import { VectorProcess } from '@/types'
import bytes2utf8 from '@/utils/bytes2utf8'
import { spawn as nodeSpawn } from 'child_process'
import { writeFileSync } from 'fs'
import tmp from 'tmp'

const spawn = (binPath: string, cfg: string): VectorProcess => {
  // Write config to a tmp file. Vector's config flags seem to fopen a file,
  // so passing in a buffer doesn't help.
  const cfgFile = tmp.fileSync()
  writeFileSync(cfgFile.name, cfg)

  const vector = nodeSpawn(binPath, ['--config', cfgFile.name])

  vector.stdout.on('data', (data) => {
    console.log(`[process::vector/stdout] ${bytes2utf8(data)}`)
  })
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

export default spawn
