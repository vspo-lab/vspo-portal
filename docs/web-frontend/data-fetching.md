# Data Fetching

## Async Server Components

Data is fetched directly in the page body of async Server Components. There is no `getServerSideProps` or `getStaticProps`.

### Dynamic Pages (Runtime Data)

Pages that need runtime data export `dynamic = "force-dynamic"` and fetch in the component body:

```typescript
// app/[locale]/(content)/schedule/[status]/page.tsx
export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; status: string }>;
  searchParams: Promise<{ limit?: string; date?: string }>;
}) {
  const { locale, status } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const timeZone = cookieStore.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;

  const schedule = await fetchSchedule({
    startedDate, limit, locale, status, order, timeZone,
  });

  const t = await getTranslations({ locale, namespace: "streams" });

  return (
    <ContentLayout title={t("titles.streamSchedule")} path={`/schedule/${status}`}>
      <ScheduleStatusContainer livestreams={schedule.livestreams || []} ... />
    </ContentLayout>
  );
}
```

Key patterns:

- `params` and `searchParams` are `Promise` values (awaited in body)
- `cookies()` from `next/headers` replaces `req.cookies`
- Translation loading via `getTranslations` (no `serverSideTranslations`)

### Static Pages (SSG)

Pages without API data use `generateStaticParams` for static generation:

```typescript
// app/[locale]/(content)/about/page.tsx
export async function generateStaticParams() {
  return [
    { locale: "en" }, { locale: "ja" }, { locale: "cn" },
    { locale: "tw" }, { locale: "ko" },
  ];
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const slugs = await getAllMarkdownSlugs("about");
  const sections = await Promise.all(
    slugs.map((slug) => getMarkdownContent(locale, "about", slug)),
  );

  return (
    <ContentLayout title="About" path="/about" maxPageWidth="md" padTop>
      <AboutPageContainer sections={sections} locale={locale} />
    </ContentLayout>
  );
}
```

SSG pages: `about`, `privacy-policy`, `terms`, `site-news`.

## Per-Page SEO with generateMetadata

Each page exports `generateMetadata` for dynamic title/description:

```typescript
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; status: string }>;
}): Promise<Metadata> {
  const { locale, status } = await params;
  const t = await getTranslations({ locale, namespace: "streams" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("titles.streamSchedule")}`,
    description: t("description"),
  };
}
```

## Dual API Support

Every shared API function supports two backends:

1. **Cloudflare Worker binding** (`APP_WORKER`) -- preferred when available
2. **VSPOApi REST client** -- fallback for non-Cloudflare environments

```typescript
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

`lib/cloudflare/context.ts` wraps `@opennextjs/cloudflare` to detect the runtime environment. When `isValid` is true, `cfEnv.APP_WORKER` is available for direct worker-to-worker calls. When false (local dev / Node.js), the fallback REST API path is used.

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

```text
API Response -> Zod schema.parse() -> Domain type -> Result<T, AppError>
```

## Feature-Level Service Orchestration

Each feature has a `*Service.ts` that composes multiple shared API calls using `Promise.allSettled`. This handles partial failures gracefully -- if one API call fails, the page still renders with available data:

```typescript
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
