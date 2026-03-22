# OpenNEXT / Cloudflare Workers — Configuration & Barriers

Known barriers for App Router on Cloudflare Workers via `@opennextjs/cloudflare`, current configuration, and design decisions.

## Current Setup

- Next.js **15.5.14** (pinned via pnpm catalog)
- `@opennextjs/cloudflare@^1.17.1` (latest as of 2026-03)
- Wrangler compatibility date: `2025-05-05`
- Compatibility flags: `nodejs_compat`, `global_fetch_strictly_public`
- Smart Placement: enabled
- Service bindings: `APP_WORKER` (worker-to-worker RPC), `WORKER_SELF_REFERENCE` (self-reference for cache revalidation)
- `useWorkerdCondition: false` (emotion edge-light workaround)

## Caching Architecture

Enabled after App Router migration. Three components work together:

| Component | Binding | Purpose |
|-----------|---------|---------|
| R2 Incremental Cache + Regional Cache | `NEXT_INC_CACHE_R2_BUCKET` | Store SSR/ISR cached responses. Regional cache wraps R2 for faster retrieval (long-lived mode: 30 min). |
| DOShardedTagCache | `NEXT_TAG_CACHE_DO_SHARDED` (Durable Object) | On-demand revalidation via `revalidateTag` / `revalidatePath`. Sharded with `baseShardSize: 12`. |
| DOQueueHandler | `NEXT_CACHE_DO_QUEUE` (Durable Object) | Time-based ISR revalidation. Background queue deduplicates and processes revalidation requests. |

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| R2 over KV | KV is eventually consistent — risks indefinite stale data. R2 provides strong consistency. |
| Regional cache `long-lived` mode | Reuses ISR/SSG responses for 30 min. `shouldLazilyUpdateOnCacheHit` and `bypassTagCacheOnCacheHit` defaults are optimal. |
| DOShardedTagCache over D1TagCache | D1 recommended only for low-traffic sites. DO-based approach scales better. |
| `baseShardSize: 12` | Default recommended by OpenNEXT docs for most applications. |
| `enableCacheInterception: true` | Allows App Router's fetch cache to be handled by Cloudflare's cache layer. |
| Static pages use `generateStaticParams` | privacy-policy, terms, about, site-news list → SSG pre-rendered at build time. No `force-dynamic`. |
| Dynamic pages keep `force-dynamic` | schedule, clips, freechat, multiview, site-news/[id] → always SSR (API data). |

### open-next.config.ts

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

const config = defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
  }),
  tagCache: doShardedTagCache({ baseShardSize: 12 }),
  queue: doQueue,
  enableCacheInterception: true,
});

// emotion edge-light workaround
config.cloudflare = {
  ...config.cloudflare,
  useWorkerdCondition: false,
};

export default config;
```

### Wrangler Bindings (dev/prd)

Config files:

- `service/vspo-schedule/v2/web/config/wrangler/dev/wrangler.jsonc`
- `service/vspo-schedule/v2/web/config/wrangler/prd/wrangler.jsonc`

```jsonc
{
  "r2_buckets": [
    { "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "{env}-vspo-schedule-web-cache" }
  ],
  "durable_objects": {
    "bindings": [
      { "name": "NEXT_TAG_CACHE_DO_SHARDED", "class_name": "DOShardedTagCache" },
      { "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" }
    ]
  },
  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["DOShardedTagCache", "DOQueueHandler"] }
  ],
  "services": [
    { "binding": "WORKER_SELF_REFERENCE", "service": "{env}-vspo-schedule-web" }
  ]
}
```

### CI/CD — R2 Bucket Auto-Creation

Deploy workflow creates the R2 bucket before each deploy (idempotent):

```yaml
- name: Ensure R2 cache bucket exists
  uses: cloudflare/wrangler-action@v3.14.1
  with:
    command: r2 bucket create {env}-vspo-schedule-web-cache || true
```

## Static Assets Caching

`public/_headers` configures Cloudflare-managed caching (Workers don't run for static assets):

```
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/locales/*
  Cache-Control: public, max-age=3600, s-maxage=86400
```

## Barrier Matrix

| # | Barrier | Severity | Status | Mitigation |
|---|---------|----------|--------|------------|
| 1 | Cold start degradation | Medium | Monitored | Smart Placement enabled. `"use client"` minimizes server bundle. |
| 2 | Node.js middleware unsupported (#617) | Low | No impact | next-intl `createMiddleware` is standard middleware. |
| 3 | ISR + PPR revalidation (#662) | Low | Mitigated | Using `force-dynamic` for API-driven pages. SSG for static pages. No PPR. |
| 4 | Emotion edge-light variant | Low | Mitigated | `useWorkerdCondition: false` + `serverExternalPackages`. |
| 5 | Bundle size 10 MiB limit | Medium | Monitored | Measure after deploy. Dynamic import splitting if needed. |
| 6 | DO cost for tag cache (#1103) | Medium | Accepted | DOShardedTagCache enabled. Monitor DO request volume post-deploy. |
| 7 | Image optimization billing (#1125) | Low | Deferred | Current `remotePatterns` config maintained. Evaluate Cloudflare Images later. |

## Monitoring After Deploy

| Metric | Tool | Threshold |
|--------|------|-----------|
| Cold start TTFB | Cloudflare Analytics / manual curl | Compare with pre-migration baseline |
| Bundle size | `.open-next/worker.js.meta.json` | < 10 MiB compressed |
| Error rate | Cloudflare Workers logs | No increase from baseline |
| CPU time | Cloudflare Workers metrics | No sustained increase > 50% |
| DO requests | Cloudflare Dashboard | Monitor cost for DOShardedTagCache |
| Cache hit rate | R2 Analytics | Track incremental cache effectiveness |

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
