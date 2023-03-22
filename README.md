# railway-chord

Centralized logging for [Railway.app](https://railway.app) projects, powered
by [Vector](https://vector.dev/).

_railway-chord_ pipes the log stream from Railway's GraphQL API into Vector.
This gives you **project-wide** centralized logging on Railway. For each Railway
project you configure, _railway-chord_ dumps the log stream of the project's
deployed services and plugins (e.g. Postgres, Redis, etc.) in all environments
into Vector.

## Usage

> ⚠️  _railway-chord_ depends on Railway's API. You must be a part of the
[Priority Boarding](https://docs.railway.app/reference/priority-boarding)
program to use Railway's API. You can join the program easily by following
the instructions in the link.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/t-gnAH?referralCode=EPXG5z)

The button above will deploy _railway-chord_ on Railway. You will be prompted to
set some required environment variables; there is no additional configuration
required beyond this.

### Project IDs

The `RAILWAY_PROJECT_IDS` variable requires a comma-separated list of Railway
Project IDs to enable _railway-chord_ for. You can find your Project ID under
Railway's Dashboard -> Project -> Settings -> General.

#### Example:
```sh
# Separate each Project ID with a comma!
RAILWAY_PROJECT_IDS="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX,XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
```

## Adding Vector sinks

### Request for new sinks

To request for a new Vector sink, please [open a GitHub issue](https://github.com/half0wl/railway-chord/issues/new).

### Add your own sink

**See this [pull request](https://github.com/half0wl/railway-chord/pull/8) for an
example**.

Before adding a new Vector sink, check the authentication mechanism of the
provider you're using. There is usually an API key required.

1. In [`src/main.ts`](src/main.ts), pass the required API key/token into
`configureVector()`:

    ```typescript
    const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN ?? null
    const vectorCfg = configureVector(
      ...,
      PROVIDER_TOKEN
    )
    ```
2. Create a new [Vector sink configuration](https://vector.dev/docs/reference/configuration/sinks/)
in [`src/vector/sinks.ts`](src/vector/sinks.ts) (TOML format).

    ```typescript
    const PROVIDER = (token: string) => `
    [sinks.PROVIDER]
    ...
    token = "${token}"
    `
    ```
3. In [`src/vector/configure.ts`](src/vector/configure.ts), import and append
the newly-created config created above, passing the required API key into it:

    ```typescript
    import { PROVIDER } from './sinks'
    const configure = ( ..., providerToken: string | null ) => {
        ...
        if (providerToken !== null) {
            enabled.push('provider')
            cfg += PROVIDER(providerToken)
        }
        ...
    }
    ```


## Configuration

| Name | Value|
| ----------- | ----------- |
| `RAILWAY_API_TOKEN` | **Required**. Railway API token. |
| `RAILWAY_PROJECT_IDS` | **Required**. A comma-separated list of Railway Project IDs. |
| `LOGTAIL_TOKEN` | **Required**. Logtail token. |
| `RAILWAY_API_HTTP_ENDPOINT` | Optional. Railway's HTTP GQL Endpoint. Defaults to `https://backboard.railway.app/graphql/v2`. |
| `RAILWAY_WS_HTTP_ENDPOINT` | Optional. Railway's WebSockets GQL Endpoint. Defaults to `wss://backboard.railway.app/graphql/v2`. |
| `VECTOR_BIN_PATH` | Optional. Path to Vector binary. Defaults to path defined in Docker build. You do not need to set this. |
| `VECTOR_CFG_PATH` | Optional. Path to Vector configuration. Defaults to path defined in Docker build. You do not need to set this. |

## License

[MIT](LICENSE)
