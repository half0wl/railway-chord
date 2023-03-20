# railway-chord

Centralized logging for [Railway.app](https://railway.app) projects, powered
by [Vector](https://vector.dev/).

## Usage

(wip!)

This only supports Logtail as a sink for now. Additional log sinks can be added
by appending them to the Vector config file ([`./vector.toml`](vector.toml)).

Configure the following environment variables:

* `RAILWAY_API_TOKEN`
* `RAILWAY_PROJECT_IDS`
* `LOGTAIL_TOKEN`

## Configuration

| Name | Value|
| ----------- | ----------- |
| `RAILWAY_API_TOKEN` | **Required**. Railway API token. |
| `RAILWAY_PROJECT_IDS` | **Required**. A comma-separated list of Railway Project IDs to enable logging for. |
| `LOGTAIL_TOKEN` | **Required**. Logtail token. |
| `RAILWAY_API_HTTP_ENDPOINT` | Optional. Railway's HTTP GQL Endpoint. Defaults to `https://backboard.railway.app/graphql/v2`. |
| `RAILWAY_WS_HTTP_ENDPOINT` | Optional. Railway's WebSockets GQL Endpoint. Defaults to `wss://backboard.railway.app/graphql/v2`. |
| `VECTOR_BIN_PATH` | Optional. Path to Vector binary. You do not need to set this. |
| `VECTOR_CFG_PATH` | Optional. Path to Vector configuration. You do not need to set this. |

## How?

Railway exposes logs over WebSockets powered by GraphQL. This service subscribes
to the GQL query and pipes that into `vector`.

## License

[MIT](LICENSE)
