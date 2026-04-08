# Advanced Astro Feature Utilization

## 1. Experimental Route Caching (Astro 6)

### Overview

Astro 6's `experimental.routeCache` caches responses from server-rendered pages, avoiding re-rendering for identical requests.

### Current Issues

- Dashboard pages are SSR on every request — guild lists and channel settings do not change frequently
- Want to return responses efficiently within Cloudflare Workers CPU time limits
- Want to reduce unnecessary calls to the Bot API (Service Binding)

### Configuration

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    routeCache: true,
  },
});
```

### Cache Configuration in Pages

```astro
---
// pages/dashboard/guilds.astro
const cache = Astro.routeCache;

// 5 minute cache + 1 hour stale-while-revalidate
cache.set({
  maxAge: 300,        // 5 minutes
  swr: 3600,          // 1 hour stale-while-revalidate
  tags: ["guilds", `user:${Astro.locals.user?.id}`],
});

const guilds = await fetchGuilds();
---
```

### Cache Invalidation

```typescript
// Invalidate cache after adding a channel in an Action
import { cacheInvalidate } from "astro:cache";

handler: async (input, context) => {
  await addChannel(input);
  // Invalidate all guild-related caches
  await cacheInvalidate({ tags: [`guild:${input.guildId}`] });
  return { success: true };
}
```

### Candidate Pages

| Page | Cache Strategy | Reason |
|------|---------------|--------|
| `/` (LP) | `maxAge: 3600` | Static content, low change frequency |
| `/announcements` | `maxAge: 1800` | Announcements do not change frequently |
| `/dashboard/guilds` | `maxAge: 300, swr: 3600` | Guild list uses a shorter cache |
| `/dashboard/[guildId]` | `maxAge: 60, swr: 300` | Channel settings have a higher update frequency |

### Caveats

- **Experimental feature**: The API may change
- **Consistency with authentication**: Cache keys must be separated per user (`tags: ["user:xxx"]`)
- **Cloudflare Workers**: `memoryCache()` depends on the worker lifecycle. Consider combining with KV or the Cache API

## 2. Page Partials

### Overview

Pages with `export const partial = true` return HTML fragments without `<html>` / `<head>` / `<body>`. Ideal for partial updates using htmx or fetch.

### Current Issues

- Full page reload after adding/removing channels
- Partial updates are done via React Islands, but re-fetching SSR-rendered tables requires MPA reload

### Usage Pattern: Table Partial Update

```astro
---
// pages/partials/channel-table.astro
export const partial = true;

const guildId = Astro.url.searchParams.get("guildId");
const channels = await fetchChannels(guildId);
---
<table>
  {channels.map(ch => (
    <tr>
      <td>{ch.name}</td>
      <td>{ch.language}</td>
    </tr>
  ))}
</table>
```

### Client Side (React Component)

```tsx
// features/channel/components/ChannelTableRefresher.tsx
const refreshTable = async (guildId: string) => {
  const res = await fetch(`/partials/channel-table?guildId=${guildId}`);
  const html = await res.text();
  document.getElementById("channel-table")!.innerHTML = html;
};
```

### Choosing Between Partial and React Island

| Method | Data Fetching | State Management | Suitable For |
|--------|--------------|-----------------|-------------|
| Page Partial | Server (SSR) | None | Table re-rendering, list updates |
| React Island | Client | React state | Forms, modals, real-time UI |
| MPA Reload | Server (SSR) | None | Page navigation, post-form submission |

### Benefits

- Reuse server-side data fetching logic
- No need to provide a separate JSON API for the client
- Particularly effective within dashboards where SEO is not needed

## 3. Custom Error Pages

### Current State

- `404.astro` exists (with a button directing to the landing page)
- `500.astro` is not implemented

### Adding 500.astro

```astro
---
// src/pages/500.astro
import Base from "~/layouts/Base.astro";
import Header from "~/features/shared/components/Header.astro";
import Footer from "~/features/shared/components/Footer.astro";

const { error } = Astro.props;
const locale = Astro.locals.locale ?? "ja";
const t = {
  ja: { title: "サーバーエラー", message: "申し訳ありません。問題が発生しました。", back: "トップへ戻る" },
  en: { title: "Server Error", message: "Sorry, something went wrong.", back: "Back to Home" },
};
---
<Base title={t[locale].title}>
  <Header />
  <main>
    <h1>{t[locale].title}</h1>
    <p>{t[locale].message}</p>
    {import.meta.env.DEV && error && <pre>{error.message}</pre>}
    <a href="/">{t[locale].back}</a>
  </main>
  <Footer />
</Base>
```

### error prop (Astro 4.11+)

- `Astro.props.error` is the `Error` object from the server error
- Do not display stack traces to users in production
- `Astro.locals` retains values set by middleware (e.g., locale)

## 4. Astro.rewrite() Pattern

### Overview

`Astro.rewrite()` rewrites a request to a different route within a page component. The URL does not change.

### Usage Pattern 1: Conditional 404 Fallback

```astro
---
// pages/dashboard/[guildId].astro
const guild = await fetchGuild(guildId);
if (!guild) {
  return Astro.rewrite("/404");
}
---
```

### Usage Pattern 2: Feature Flag-based Switching

```astro
---
// pages/dashboard/settings.astro
const hasNewSettings = featureFlags.get("new-settings-ui");
if (hasNewSettings) {
  return Astro.rewrite("/dashboard/settings-v2");
}
---
<!-- Legacy UI -->
```

### Difference from Middleware rewrite

| Method | Execution Timing | Use Case |
|--------|-----------------|----------|
| `context.rewrite()` (middleware) | Before page processing | Routing changes, auth fallback |
| `Astro.rewrite()` (page) | During page processing | Branching based on data fetch results |

## 5. Astro 6 Breaking Changes Preparation

### Key Changes to Be Aware Of

| Change | Impact | Action |
|--------|--------|--------|
| `squoosh` → `sharp` | Image optimization library change | `sharp` is now default; use `passthroughImageService` for Cloudflare |
| Legacy content collections removed | Old API in `src/content/` | Not used in this project → no impact |
| `astro:env` is now stable | Experimental flag no longer needed | Can remove `experimental.env` |
| Markdown config rename | `markdown.remarkPlugins` → unchanged | Markdown not used in this project |
| Cookie encoding | Encoding change for some cookie values | Verify session cookie compatibility |

### Cloudflare Workers-specific Notes

```typescript
// astro.config.ts
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthroughImageService",
    // Astro 6: Verify platformProxy configuration changes
    platformProxy: {
      enabled: true,
    },
  }),
});
```

### Upgrade Checklist

- [ ] Upgrade to `astro@6`
- [ ] Verify compatible version of `@astrojs/cloudflare`
- [ ] Clean up experimental flags (`astro:env` → stable)
- [ ] Test cookie encoding compatibility
- [ ] Verify `sharp` vs `passthroughImageService` behavior

## 6. View Transitions Enhancement

### Current State

`10_VIEW_TRANSITIONS.md` covers MPA page transition acceleration. Additional points to consider:

### Loading State During Page Transitions

```astro
<script>
  document.addEventListener("astro:before-preparation", () => {
    document.getElementById("loading-bar")?.classList.add("active");
  });
  document.addEventListener("astro:after-swap", () => {
    document.getElementById("loading-bar")?.classList.remove("active");
  });
</script>
```

### Transitions After Form Submission

After submitting Astro Actions (`accept: "form"`), an MPA reload occurs. Combining with View Transitions enables smooth transitions:

```astro
<form method="POST" action={actions.addChannel} data-astro-reload>
  <!-- data-astro-reload: Skip View Transitions and do a full reload -->
  <!-- Prioritize reload for data integrity on form submissions -->
</form>
```

## Migration Checklist

### Route Caching

- [ ] Consider enabling `experimental.routeCache`
- [ ] Define cache strategy per page
- [ ] Design per-user cache keys
- [ ] Implement post-Action cache invalidation pattern

### Page Partials

- [ ] Create a channel table partial update
- [ ] Create a Partial fetch helper for React components
- [ ] Gradual migration from MPA reload to Partial updates

### Error Pages

- [ ] Create `src/pages/500.astro`
- [ ] i18n support (retrieve locale from `Astro.locals`)
- [ ] Error detail display in development environment

### Astro 6 Preparation

- [ ] Evaluate breaking changes impact
- [ ] Verify Cloudflare adapter compatibility
- [ ] Test cookie encoding
- [ ] Audit experimental flags
