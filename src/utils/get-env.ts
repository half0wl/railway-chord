const getEnv = (key: string, defaultValue: string) => {
  const env = process.env[key]
  return env ?? defaultValue
}

export default getEnv
