const STDOUT = `
[sinks.out]
inputs = ["*"]
type = "console"
encoding.codec = "text"`

const LOGTAIL = (token: string) => `
[transforms.logtail_transform]
type = "remap"
inputs = [ "*" ]
source = '''
. = parse_json!(string!(.message))
.dt = del(.timestamp)
'''

[sinks.logtail_sink]
type = "http"
method = "post"
inputs = [ "logtail_transform" ]
uri = "https://in.logs.betterstack.com/"
encoding.codec = "json"
auth.strategy = "bearer"
auth.token = "${token}"`

const DATADOG = (token: string, site?: string) => `
[sinks.datadog]
type = "datadog_logs"
inputs = [ "*" ]
compression = "gzip"
site = "${site ?? "datadoghq.com"}"
default_api_key = "${token}"`

export { DATADOG, STDOUT, LOGTAIL }
