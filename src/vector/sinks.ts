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
.dt = del(.timestamp)
.railway = del(.railway)
'''

[sinks.logtail_sink]
type = "http"
method = "post"
inputs = [ "logtail_transform" ]
uri = "https://in.logtail.com/"
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
