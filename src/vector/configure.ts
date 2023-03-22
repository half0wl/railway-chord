import { VectorConfiguration } from '@/types'
import { LOGTAIL, STDOUT } from './sinks'
import { STDIN } from './sources'

const configure = (
  enableStdout: boolean,
  logtail: string | null,
): VectorConfiguration => {
  const enabled = []
  let cfg = ''
  cfg += STDIN

  // Append the vector sink config for each enabled sink
  if (enableStdout === true) {
    enabled.push('stdout')
    cfg += STDOUT
  }
  if (logtail !== null) {
    enabled.push('logtail')
    cfg += LOGTAIL(logtail)
  }

  return {
    contents: cfg,
    enabled,
  }
}

export default configure
