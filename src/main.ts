import createHttpClient from '@/api/http/client'
import getProjectData from '@/api/http/get-project-data'
import createWsClient from '@/api/websocket/client'
import pushDeploymentLogs from '@/push-deployment-logs'
import pushPluginLogs from '@/push-plugin-logs'
import { App, HttpClient, VectorProcess, WsClient } from '@/types'
import getEnv from '@/utils/get-env'
import parseProjectIds from '@/utils/parse-project-ids'
import requireEnv from '@/utils/require-env'
import spawn from '@/vector/spawn'
import write from '@/vector/write'
import dotenv from 'dotenv'

dotenv.config()

const RAILWAY_API_HTTP_ENDPOINT = getEnv(
  'RAILWAY_API_HTTP_ENDPOINT',
  'https://backboard.railway.app/graphql/v2',
)
const RAILWAY_API_WS_ENDPOINT = getEnv(
  'RAILWAY_API_WS_ENDPOINT',
  'wss://backboard.railway.app/graphql/v2',
)

const RAILWAY_PROJECT_IDS = requireEnv('RAILWAY_PROJECT_IDS')
const RAILWAY_API_TOKEN = requireEnv('RAILWAY_API_TOKEN')
const VECTOR_BIN_PATH = requireEnv('VECTOR_BIN_PATH')

// @TODO: Move this to env?
const REFRESH_INTERVAL_SECONDS = 60 * 15

import configureVector from './vector/configure'

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
const main = async () => {
  const ENVIRONMENT = process.env.ENVIRONMENT ?? 'development'
  console.info(`⚡ railway-chord is starting!`)
  console.info(`⚡ environment: ${ENVIRONMENT}`)

  // Vector sinks are configured dynamically based on the presence of a sink's
  // API token in env. i.e. if there's a LOGTAIL_TOKEN provided, inject the
  // Logtail sink into Vector config; if there's a DATADOG_TOKEN provided,
  // inject the Datadog sink into Vector config; and so on.
  const LOGTAIL_TOKEN = process.env.LOGTAIL_TOKEN ?? null
  const DATADOG_TOKEN = process.env.DATADOG_TOKEN ?? null
  const DATADOG_SITE = process.env.DATADOG_SITE ?? null
  const vectorCfg = configureVector(
    ENVIRONMENT !== 'production',
    LOGTAIL_TOKEN,
    DATADOG_TOKEN,
    DATADOG_SITE,
  )

  // Start Vector first. We want to crash early; there's no point in making
  // network requests to Railway API if Vector can't start.
  console.info(`⚙️  Using Vector binary: ${VECTOR_BIN_PATH}`)
  const vector = spawn(VECTOR_BIN_PATH, vectorCfg.contents)
  write(vector, '>>> ping from railway-chord')
  console.info(`✅ Vector started`)
  console.info(`✅ Enabled sinks:`)
  vectorCfg.enabled.forEach((s) => {
    console.info(`     - ${s}`)
  })

  console.info(`⚙️  Using Railway HTTP endpoint: ${RAILWAY_API_HTTP_ENDPOINT}`)
  console.info(`⚙️  Using Railway WS endpoint: ${RAILWAY_API_WS_ENDPOINT}`)

  const projectIds = parseProjectIds(RAILWAY_PROJECT_IDS)
  const httpClient = createHttpClient(
    RAILWAY_API_HTTP_ENDPOINT,
    RAILWAY_API_TOKEN,
  )
  const wsClient = createWsClient(RAILWAY_API_WS_ENDPOINT, RAILWAY_API_TOKEN)

  // Start event loop
  await runEventLoop(httpClient, wsClient, vector, projectIds)
  setInterval(async () => {
    await runEventLoop(httpClient, wsClient, vector, projectIds)
  }, REFRESH_INTERVAL_SECONDS * 1000)
}

const refreshProjects = async (
  httpClient: HttpClient,
  projectIds: App.ProjectId[],
) => {
  return await Promise.all(
    projectIds.map(async (id) => {
      const project = await getProjectData(httpClient, id)
      return {
        projectId: id,
        plugins: project.plugins,
        deployments: project.deployments,
      }
    }),
  )
}

const runEventLoop = async (
  httpClient: HttpClient,
  wsClient: WsClient,
  vector: VectorProcess,
  projectIds: App.ProjectId[],
) => {
  console.info(`🔄 Refreshing projects!`)
  const projects = await refreshProjects(httpClient, projectIds)

  console.info(`✅ Enabling for:`)
  projects.forEach(async ({ deployments, plugins, projectId }) => {
    console.info(`     > projectId=${projectId}`)
    deployments.forEach(async (d) => {
      console.info(`       - deployment=${d.staticUrl}, deploymentId=${d.id}`)
      pushDeploymentLogs(wsClient, vector, d, new Date())
    })
    plugins.forEach(async (p) => {
      console.info(
        `       - plugin=${p.name}, pluginId=${p.id}, env=${p.environmentName}`,
      )
      pushPluginLogs(wsClient, vector, p, new Date())
    })
  })
}

main()
