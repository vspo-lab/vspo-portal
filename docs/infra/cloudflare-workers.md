# Cloudflare Workers Deployment

## Overview

The web frontend is deployed to Cloudflare Workers via [OpenNextJS Cloudflare](https://opennext.js.org/cloudflare). The build compiles the Next.js app into a Worker-compatible format with static assets served via the ASSETS binding.

## Architecture

```text
GitHub (push to main/develop)
  → GitHub Actions workflow
    → pnpm cf:build (OpenNextJS compilation)
    → wrangler deploy
      → Cloudflare Worker (.open-next/worker.js)
      → Static Assets (.open-next/assets)
      → Service Binding → APP_WORKER (backend API)
```

## Wrangler Configuration

Configs are in `service/vspo-schedule/v2/web/config/wrangler/{env}/wrangler.jsonc`.

| Setting | Dev | Prod |
|---------|-----|------|
| Worker name | `dev-vspo-schedule-web` | `prd-vspo-schedule-web` |
| Entry point | `.open-next/worker.js` | `.open-next/worker.js` |
| Compatibility date | `2025-03-01` | `2025-03-01` |
| Compatibility flags | `nodejs_compat`, `global_fetch_strictly_public` | Same |
| Smart Placement | Enabled | Enabled |
| Observability | Enabled (invocation logs off) | Same |

### Service Bindings

Both environments bind to the backend API worker:

| Binding | Dev Service | Prod Service |
|---------|------------|--------------|
| `APP_WORKER` | `dev-vspo-portal-app` | `prd-vspo-portal-app` |

The binding uses the `ApplicationService` entrypoint, enabling direct worker-to-worker RPC calls without HTTP overhead.

### Assets Binding

Static assets (JS bundles, images, locales) are served via the `ASSETS` binding pointing to `.open-next/assets`. This is also used by the [i18n CloudflareAssetsBackend](../web-frontend/i18n.md) to load translation files on the edge.

## OpenNextJS Configuration

`service/vspo-schedule/v2/web/open-next.config.ts`:

- Incremental caching disabled (R2 cache commented out)
- `useWorkerdCondition: false` -- disables the workerd esbuild condition to prevent `@emotion/*` packages from resolving edge-light variants that are not included by Next.js file tracing. The default condition falls back to runtime is-browser detection, which works correctly on Workers.

## Build & Deploy Commands

```bash
pnpm cf:build     # Compile Next.js → Cloudflare Worker via OpenNextJS
pnpm cf:deploy    # Deploy to Cloudflare Workers
pnpm cf:preview   # Preview deployment locally
pnpm cf:typegen   # Generate CloudflareEnv types from wrangler config
```

## CI/CD Pipeline

Defined in `.github/workflows/deploy-web-workers.yaml`.

**Triggers:**

- Push to `main` branch → deploys to `web-production` environment
- Push to `develop` branch → deploys to `web-development` environment
- Manual `workflow_dispatch`
- Only triggers on changes to `service/vspo-schedule/v2/web/**`

**Steps:**

1. Checkout code
2. Setup pnpm (via composite action `.github/actions/setup-pnpm`)
3. Deploy via `cloudflare/wrangler-action@v3.14.1` (Wrangler CLI v4.6.0)
   - `workingDirectory` is set to the env-specific wrangler config dir (`config/wrangler/{env}`)
   - `preCommands` copies config files to the web root so the build can find sources

**Environment Variables (passed as Wrangler secrets):**

| Variable | Description |
|----------|-------------|
| `ENV` | `production` or `development` |
| `API_KEY_V2` | Backend API authentication key |
| `API_URL_V2` | Backend API base URL |
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access client ID |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access client secret |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS` | Google Analytics ID |
| `NEXT_PUBLIC_AD_CLIENT` | Google AdSense client ID |
| `NEXT_PUBLIC_AD_SLOT` | Google AdSense slot ID |
| `NEXT_PUBLIC_ADS_GOOGLE` | Google Ads ID |
| `NEXT_PUBLIC_FORM` | Contact form URL |
| `NEXT_PUBLIC_DISCORD_LINK` | Discord invite link |

**Required GitHub Secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Cloudflare Environment Access

In application code, use `getCloudflareEnvironmentContext()` from `lib/cloudflare/context.ts`:

```typescript
const cfEnv = getCloudflareEnvironmentContext();

if (cfEnv) {
  // Running on Cloudflare Workers -- use service binding
  const result = await cfEnv.APP_WORKER.usecases.listStreams({ ... });
} else {
  // Local dev / Node.js -- use REST API fallback
  const api = new VSPOApi({ baseUrl, apiKey });
  const result = await api.streams.list({ ... });
}
```

See [Data Fetching - Dual API Support](../web-frontend/data-fetching.md#dual-api-support) for the full pattern.
