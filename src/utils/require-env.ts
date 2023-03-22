const requireEnv = (key: string) => {
  const env = process.env[key]
  if (env === undefined) {
    throw new Error(`Environment variable "${key}" is required`)
  }
  return env
}

export default requireEnv
