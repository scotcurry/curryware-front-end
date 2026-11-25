# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js 16.4 is newer than most training data. Before using a Next.js API, read its guide in
`node_modules/next/dist/docs/` (as AGENTS.md says). Cache Components is on, which changes the
rules below.

## Commands
```bash
npm run dev          # http://localhost:3000, uses JAVA_API_BASE_URL from .env.development
npm run build        # production build (.next/standalone)
npm run lint
npm run typecheck    # next typegen + tsc (generates PageProps/LayoutProps route types)
npm test             # vitest run
npx vitest run src/lib/java-api.test.ts -t "encodes"   # one file / one test
```
Run the production build like the container does:
```bash
cp -r .next/static .next/standalone/.next/
PORT=3000 JAVA_API_BASE_URL=https://ubuntu-microk8s.curryware.org/java node .next/standalone/server.js
```

Container image (Podman machine `curryware-podman`):
```bash
podman build --platform linux/arm64 -t curryware-front-end:local .    # native on Apple silicon
podman run --rm -p 3000:3000 --add-host ubuntu-microk8s.curryware.org:98.243.101.177 \
  -e JAVA_API_BASE_URL=https://ubuntu-microk8s.curryware.org/java curryware-front-end:local
```
- Build locally for arm64: an emulated `--platform linux/amd64` build segfaults in QEMU at the
  end of `next build`. CI builds amd64 natively on GitHub's runners.
- Inside the Podman VM the hostname resolves to the node's LAN IP and the connection is
  refused, hence `--add-host` with the public IP.

## Architecture
- Next.js App Router + TypeScript + Tailwind CSS 4. Replaces the old Python/Flask front-end
  (still in git history on `master` before the rewrite).
- All data comes from `curryware-java-api-server` through the typed client in
  `src/lib/java-api.ts`. It runs server-side only and reads `JAVA_API_BASE_URL`:
  the internal Service `http://curryware-java-api-server-service:8080` in the cluster, the
  public `/java` ingress route locally. Every endpoint is under `/v1/...`.
- Pages: `/` lists leagues by season; `/leagues/[leagueKey]` shows teams and recent
  transactions. API routes: `/api/health` (probes), `/api/throw-error` (Datadog demo).

## Rules that come from Cache Components (`cacheComponents: true`)
- Any uncached data access (a Java API `fetch`, `params`, `searchParams`, `cookies()`,
  `headers()`) must be inside a `<Suspense>` boundary, or the build fails with a
  blocking-route error. Pages pass the `params` promise into components inside `<Suspense>`
  instead of awaiting it at the top level.
- Call `await connection()` before reading `process.env` so the value is read per request,
  not baked in at build time. Only `NEXT_PUBLIC_*` variables reach the browser, and those
  are inlined at build.
- Section components catch Java API errors and render `ApiErrorNotice`, so one failing
  section doesn't take down the page.
- Because pages stream, `notFound()` inside `<Suspense>` renders the 404 UI but the HTTP
  status is already 200.

## Data notes
- Team data exists only for the 2025 leagues (`461.l.*`); other leagues show an empty state.
- The Java API has no standings endpoint yet (the `team_weekly_standings` table exists).

## Deployment
- `build-actions.yml` (push to `master` only) builds the image, pushes
  `scotcurry4/curryware-front-end:<run>` and bumps the tag in `scotcurry/k8s-manifests`;
  Argo CD auto-syncs it to production. Never make it run on branches.
- `ci.yml` runs lint, typecheck, tests and build on every other branch and PR, with no deploy.
- Use `[skip ci]` in commit messages for changes that should not build/deploy from `master`.

## Dependencies
Installs go through a supply-chain firewall (SCFW) that blocks packages with OSV advisories.
Check the current version first (`npm view <pkg> version`) and pin it exactly; older majors
are often blocked.
