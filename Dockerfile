FROM node:18-alpine AS base
RUN apk update && apk upgrade
RUN apk add --no-cache curl
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.vector.dev | sh -s -- -y
RUN adduser -D -g '' builder
RUN adduser -D -g '' runner

FROM base AS deps
USER builder
WORKDIR /build
COPY --chown=builder:builder package.json yarn.lock ./
RUN yarn install --production=false --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY --chown=builder:builder . .
RUN yarn build

FROM build AS app
USER runner
WORKDIR /app
COPY --chown=runner:runner --from=base /root/.vector ./vector
COPY --chown=runner:runner --from=build /build/node_modules ./node_modules
COPY --chown=runner:runner --from=build /build/dist ./dist
COPY --chown=runner:runner vector.toml ./vector.toml
ENV VECTOR_BIN_PATH=/app/vector/bin/vector
ENV VECTOR_CFG_PATH=/app/vector.toml
ENTRYPOINT ["node", "dist/main.js"]
