# curryware-front-end

Web front-end for Curryware Fantasy: fantasy football leagues, teams and transactions,
served at https://ubuntu-microk8s.curryware.org/.

Built with Next.js 16 (App Router), TypeScript and Tailwind CSS. It replaces the earlier
Python/Flask version.

## Getting started

Requires Node.js 24.

```bash
npm install
npm run dev
```

Open http://localhost:3000. In development the app reads data from the public Java API
route set in `.env.development` (`https://ubuntu-microk8s.curryware.org/java`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (standalone output in `.next/standalone`) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run the TypeScript compiler |
| `npm test` | Unit tests (Vitest) |

## Configuration

| Variable | Where | Value |
|---|---|---|
| `JAVA_API_BASE_URL` | Server only | Base URL of curryware-java-api-server. In the cluster: `http://curryware-java-api-server-service:8080` |
| `PORT`, `HOSTNAME` | Standalone server | Port and address to listen on |

## Pages and routes

| Path | Description |
|---|---|
| `/` | All leagues, grouped by season |
| `/leagues/{leagueKey}` | Teams and recent transactions for one league, e.g. `/leagues/461.l.13407` |
| `/api/health` | Health check for Kubernetes probes |
| `/api/throw-error` | Throws on purpose, for Datadog error tracking demos |
