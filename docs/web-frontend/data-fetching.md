# Data Fetching

## Server-Side Props Pattern

Each feature page exports a `getServerSideProps` function (or `getStaticProps` for static pages) that:

1. Resolves locale and timezone from request cookies
2. Fetches data using shared API functions (Result-based)
3. Loads translations via `serverSideTranslations`
4. Returns typed props with metadata

```tsx
// features/schedule/pages/ScheduleStatus/serverSideProps.ts
export const getLivestreamsServerSideProps: GetServerSideProps = async (context) => {
  const locale = context.locale ?? DEFAULT_LOCALE;
  const timeZone = getCookieValue(context.req, TIME_ZONE_COOKIE) ?? DEFAULT_TIME_ZONE;
  const status = context.params?.status as string;

  const [scheduleResult, translationsResult] = await Promise.allSettled([
    fetchSchedule({ status, locale, timeZone, ... }),
    serverSideTranslations(locale, ["common", "streams"]),
  ]);

  return {
    props: {
      livestreams: scheduleResult.status === "fulfilled" ? scheduleResult.value : [],
      meta: { title: "...", description: "..." },
      ...translations,
    },
  };
};
```

### Static Pages

Pages with no API data use `getStaticProps` instead (`legal-documents`, `about`, `site-news`).

## Dual API Support

Every shared API function supports two backends:

1. **Cloudflare Worker binding** (`APP_WORKER`) -- preferred when available
2. **VSPOApi REST client** -- fallback for non-Cloudflare environments

```tsx
// features/shared/api/livestream.ts
export const fetchLivestreams = async (params): Promise<LivestreamFetchResult> => {
  const cfEnv = getCloudflareEnvironmentContext();

  if (cfEnv) {
    // Direct worker-to-worker call via service binding
    const res = await cfEnv.APP_WORKER.usecases.listStreams({ ... });
    return Ok({ livestreams: res.map(toLivestreamDomain) });
  }

  // Fallback: REST API via VSPOApi client
  const api = new VSPOApi({ baseUrl, apiKey, ... });
  const result = await api.streams.list({ ... });
  if (result.err) return Err(result.err);
  return Ok({ livestreams: result.val.data.map(toLivestreamDomain) });
};
```

### Cloudflare Environment Detection

`lib/cloudflare/context.ts` wraps `@opennextjs/cloudflare` to detect the runtime environment:

```typescript
// Returns { context, isValid, cfEnv } where:
// - context: Result<CloudflareContext> from @opennextjs/cloudflare
// - isValid: true if env.ASSETS binding exists (running on Workers)
// - cfEnv: typed environment with APP_WORKER service binding
```

When `isValid` is true, `cfEnv.APP_WORKER` is available for direct worker-to-worker calls. When false (local dev / Node.js), the fallback REST API path is used.

## Markdown Loading

Static content pages (site-news, about) load markdown files via `lib/markdown.ts` with dual-environment support:

| Environment | Source | Path pattern |
|-------------|--------|-------------|
| Cloudflare Workers | `ASSETS.fetch()` | `/content/{locale}/{category}/{slug}.md` |
| Local dev (Node.js) | Filesystem | `public/content/{locale}/{category}/{slug}.md` |

Features:
- **Content manifest**: `content-manifest.json` indexes available files per locale/category
- **Locale fallback**: Falls back to `ja` if translation is missing
- **Frontmatter parsing**: Extracts YAML-like metadata (title, date, tags)
- **HTML conversion**: Uses `remark` + `remark-html` pipeline

## Shared API Functions

Located in `features/shared/api/`. All return `Result<T, AppError>`.

| Function | Module | Returns |
|----------|--------|---------|
| `fetchLivestreams(params)` | `livestream.ts` | `{ livestreams: Livestream[] }` |
| `fetchClips(params)` | `clip.ts` | `{ clips: Clip[], pagination: Pagination }` |
| `fetchEvents(params)` | `event.ts` | `{ events: Event[] }` |
| `fetchFreechats(params)` | `freechat.ts` | `{ freechats: Freechat[] }` |
| `fetchVspoMembers()` | `channel.ts` | `{ members: Channel[] }` |

### Data Transformation

API responses are validated against Zod schemas before returning:

```
API Response -> Zod schema.parse() -> Domain type -> Result<T, AppError>
```

This ensures type safety at the boundary between external data and application code.

## Feature-Level Service Orchestration

Each feature has a `*Service.ts` that composes multiple shared API calls using `Promise.allSettled`. This handles partial failures gracefully -- if one API call fails, the page still renders with available data:

```tsx
// features/clips/api/clipService.ts
const [youtubeResult, twitchResult, shortsResult, membersResult] =
  await Promise.allSettled([
    fetchClips({ platform: "youtube", ... }),
    fetchClips({ platform: "twitch", ... }),
    fetchClips({ platform: "youtube", clipType: "short", ... }),
    fetchVspoMembers(),
  ]);

// Each result is checked individually; failures fall back to empty arrays
```
