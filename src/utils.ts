const requireEnv = (key: string) => {
  const env = process.env[key]
  if (env === undefined) {
    throw new Error(`Environment variable "${key}" is required`)
  }
  return env
}

const getEnv = (key: string, defaultValue: string) => {
  const env = process.env[key]
  return env === undefined ? defaultValue : env
}

const bytes2utf8 = (b: ArrayBuffer): string => {
  return Buffer.from(b).toString('utf-8')
}

const parseProjectIds = (id: string): string[] => {
  return id.split(',')
}

export { bytes2utf8, getEnv, parseProjectIds, requireEnv }
