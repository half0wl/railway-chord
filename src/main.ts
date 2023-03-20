import dotenv from 'dotenv'
import createHttpClient from './client/http'
import createWsClient from './client/ws'
import run from './logger'
import { getEnv, parseProjectIds, requireEnv } from './utils'
import { spawn, write } from './vector'

dotenv.config()

const RAILWAY_API_HTTP_ENDPOINT = getEnv(
  'RAILWAY_API_HTTP_ENDPOINT',
  'https://backboard.railway.app/graphql/v2',
)
const RAILWAY_API_WS_ENDPOINT = getEnv(
  'RAILWAY_API_WS_ENDPOINT',
  'wss://backboard.railway.app/graphql/v2',
)
const PROJECT_IDS = requireEnv('PROJECT_IDS')
const RAILWAY_API_TOKEN = requireEnv('RAILWAY_API_TOKEN')
const VECTOR_BIN_PATH = requireEnv('VECTOR_BIN_PATH')
const VECTOR_CFG_PATH = requireEnv('VECTOR_CFG_PATH')

// @TODO: Move this to env?
const REFRESH_INTERVAL_SECONDS = 60 * 15

const main = async () => {
  console.info(`⚡ railway-chord is starting!`)

  // Start Vector first. We want to crash early; there's no point in making
  // network requests to Railway API if Vector can't start.
  console.info(`⚙️  Using Vector binary: ${VECTOR_BIN_PATH}`)
  console.info(`⚙️  Using Vector config: ${VECTOR_CFG_PATH}`)
  const vector = spawn(VECTOR_BIN_PATH, VECTOR_CFG_PATH)
  write(vector, '>>> ping from railway-chord')
  console.info(`✅ Vector started`)

  console.info(`⚙️  Using Railway HTTP endpoint: ${RAILWAY_API_HTTP_ENDPOINT}`)
  console.info(
    `⚙️  Using Railway WebSockets endpoint: ${RAILWAY_API_WS_ENDPOINT}`,
  )

  const projectIds = parseProjectIds(PROJECT_IDS)

  const httpClient = createHttpClient(
    RAILWAY_API_HTTP_ENDPOINT,
    RAILWAY_API_TOKEN,
  )
  const wsClient = createWsClient(RAILWAY_API_WS_ENDPOINT, RAILWAY_API_TOKEN)

  /**
   * This is the main event loop that refreshes a project's deployments and
   * plugins every n seconds (where n=`REFRESH_INTERVAL_SECONDS`) and pushes
   * the logs of each deployment/plugin into Vector.
   *
   * The major limitation of this approach is Railway's rate limit - each
   * account is limited to 1k requests per day [0]. At the current default
   * refresh interval of 15 mins, that works out to 96 requests every 24
   * hours for project data per-project. I'm not sure if the WS subscriptions
   * are subject to this rate limit. In theory, rate limits should apply
   * per-request instead of per-WS message, which implies each WS connection
   * counts toward the rate limit. This effectively means that we're making
   * `(1 + (services+plugins)) * (86400 / REFRESH_INTERVAL_SECONDS)` requests
   * every 24hours for each project.
   *
   * An alternative/better way of doing this is through Railway's webhooks.
   * We can subscribe to new deployments. However, this approach misses out
   * on plugin creation/deletion: when a plugin is created, logs will only
   * get pushed after restarting this service. Conversely, when a plugin is
   * deleted, we'll have no way of knowing (would subscribing to logs of a
   * deleted plugin error out?).
   *
   * [0] https://docs.railway.app/reference/public-api#rate-limits
   */
  await run(httpClient, wsClient, vector, projectIds)
  setInterval(async () => {
    await run(httpClient, wsClient, vector, projectIds)
  }, REFRESH_INTERVAL_SECONDS * 1000)
}

main()
