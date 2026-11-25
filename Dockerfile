# syntax=docker/dockerfile:1
#
# Build:  podman build -t curryware-front-end:local .
# Run:    podman run --rm -p 3000:3000 \
#           -e JAVA_API_BASE_URL=https://ubuntu-microk8s.curryware.org/java \
#           curryware-front-end:local
#
# Debian (glibc) base so Datadog single-step instrumentation can inject the Node tracer.
ARG NODE_IMAGE=node:24.22.3-bookworm-slim

# ---- dependencies: installed for the build platform from the lockfile ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build: next build -> .next/standalone (server.js + traced node_modules) ----
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime: only the standalone server and its static assets ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ARG DD_GIT_REPOSITORY_URL
ARG DD_GIT_COMMIT_SHA
ARG DD_VERSION

LABEL org.opencontainers.image.source="https://${DD_GIT_REPOSITORY_URL}" \
      org.opencontainers.image.revision="${DD_GIT_COMMIT_SHA}" \
      org.opencontainers.image.version="${DD_VERSION}"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DD_SERVICE=curryware-front-end \
    DD_VERSION=${DD_VERSION} \
    DD_GIT_REPOSITORY_URL=${DD_GIT_REPOSITORY_URL} \
    DD_GIT_COMMIT_SHA=${DD_GIT_COMMIT_SHA}

# There is no public/ folder yet; if one is added, also copy it:
#   COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
