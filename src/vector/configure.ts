import { VectorConfiguration } from '@/types'
import { DATADOG, LOGTAIL, STDOUT } from './sinks'
import { STDIN } from './sources'

const configure = (
  enableStdout: boolean,
  logtailToken: string | null,
  datadogToken: string | null,
  datadogSite: string | null,
): VectorConfiguration => {
  const enabled = []
  let cfg = ''
  cfg += STDIN

  // Append the vector sink config for each enabled sink
  if (enableStdout === true) {
    enabled.push('stdout')
    cfg += STDOUT
  }
  if (logtailToken !== null) {
    enabled.push('logtail')
    cfg += LOGTAIL(logtailToken)
  }
  if (datadogToken !== null) {
    enabled.push('datadog')
    cfg += datadogSite
      ? DATADOG(datadogToken, datadogSite)
      : DATADOG(datadogToken)
  }

  return {
    contents: cfg,
    enabled,
  }
}

export default configure
