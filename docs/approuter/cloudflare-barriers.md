# OpenNEXT / Cloudflare Workers Barriers

Known barriers for App Router on Cloudflare Workers via `@opennextjs/cloudflare`, and mitigation strategies.

## Current Setup

- Next.js **15.5.14** (pinned via pnpm catalog)
- `@opennextjs/cloudflare@^1.17.1`
- Wrangler compatibility date: `2025-03-01`
- Compatibility flags: `nodejs_compat`, `global_fetch_strictly_public`
- Smart Placement: enabled
- Service binding: `APP_WORKER` (worker-to-worker RPC)
- Caching: disabled (R2 cache commented out)
- `useWorkerdCondition: false` (emotion edge-light workaround)

## Barrier Matrix

| # | Barrier | Severity | Impact | Mitigation | Phase |
|---|---------|----------|--------|------------|-------|
| 1 | Cold start degradation | Medium | App Router may increase bundle → slower cold start (3-7s CPU baseline reported for OpenNEXT) | Smart Placement (maintained). `"use client"` minimizes server bundle. Measure in Phase 2. | 2 |
| 2 | Node.js middleware unsupported (#617) | Low | Next.js 15.5+ Node middleware not supported by OpenNEXT | Current standard middleware works. next-intl `createMiddleware` is standard middleware. No impact. | 3 |
| 3 | ISR + PPR revalidation (#662) | Low | White screen after cache expiry with PPR + ISR | Phase 1 uses `force-dynamic` on all pages. No ISR/PPR. Re-evaluate in future optimization phase. | - |
| 4 | Emotion edge-light variant | Low | `@emotion/*` edge-light resolution breaks on workerd | Already mitigated: `useWorkerdCondition: false` + `serverExternalPackages`. Maintain. | 1 |
| 5 | Bundle size 10 MiB limit | Medium | Paid plan compressed limit. Minimal Next.js app is ~8MB uncompressed. | Measure in Phase 2. Use ESBuild Bundle Analyzer. Dynamic import splitting if needed. | 2 |
| 6 | DO cost for tag cache (#1103) | Medium | DOShardedTagCache can generate millions of DO requests/day | Not applicable in Phase 1 (caching disabled). Evaluate cost model before enabling ISR. | - |
| 7 | Image optimization billing (#1125) | Low | Each transformation billed as unique. No caching of transformed images. | Current `remotePatterns` config maintained. Evaluate Cloudflare Images binding later. | - |

## Settings Maintained (No Changes)

### wrangler.jsonc

No changes required. OpenNEXT generates the same `.open-next/worker.js` entry point for both routers.

```jsonc
{
  "main": ".open-next/worker.js",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "placement": { "mode": "smart" },
  // APP_WORKER service binding — unchanged
  // ASSETS binding — unchanged
}
```

### open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // emotion edge-light workaround — MAINTAIN
  useWorkerdCondition: false,
  // Caching remains disabled for Phase 1
});
```

## Monitoring After Deploy

| Metric | Tool | Threshold |
|--------|------|-----------|
| Cold start TTFB | Cloudflare Analytics / manual curl | Compare with pre-migration baseline |
| Bundle size | `.open-next/worker.js.meta.json` | < 10 MiB compressed |
| Error rate | Cloudflare Workers logs | No increase from baseline |
| CPU time | Cloudflare Workers metrics | No sustained increase > 50% |

## References

- OpenNEXT Cloudflare docs: https://opennext.js.org/cloudflare
- Performance guide: https://opennext.js.org/cloudflare/perf
- Caching guide: https://opennext.js.org/cloudflare/caching
- Troubleshooting: https://opennext.js.org/cloudflare/troubleshooting
- GitHub issues: https://github.com/opennextjs/opennextjs-cloudflare/issues
  - Cold start: #653
  - Node middleware: #617
  - ISR+PPR: #662
  - DO cost: #1103
  - Image billing: #1125
