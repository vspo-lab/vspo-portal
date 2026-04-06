# Routing Patterns

## Current State

The bot-dashboard uses file-based routing under `src/pages/`:

```text
pages/
  index.astro              # LP / redirect
  404.astro                # Custom 404
  auth/discord.ts          # OAuth initiate
  auth/callback.ts         # OAuth callback
  auth/logout.ts           # Logout
  api/change-locale.ts     # Locale API
  api/guilds/[guildId]/channels.ts  # Channels API
  dashboard/index.astro    # Guild list
  dashboard/[guildId].astro         # Guild detail
  dashboard/announcements.astro     # Announcements
  dashboard/[guildId]/announcements.astro  # Guild announcements
```

### Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | No configured redirects for common typos or legacy URLs | Users hit 404 on mistyped paths |
| 2 | Dynamic route params not validated (e.g. `[guildId]` accepts any string) | Potential for invalid API calls |
| 3 | 404.astro does not use `Astro.response.status = 404` explicitly | SEO crawlers may index 404 pages incorrectly |
| 4 | No `500.astro` error page | Server errors show generic Astro error page |
| 5 | Route priority between `dashboard/[guildId].astro` and `dashboard/announcements.astro` is implicit | Confusing route resolution |
| 6 | No trailing slash consistency policy | Mixed behavior across routes |

---

## 1. Route Priority Order

Astro resolves route conflicts using these rules (in order):

1. Reserved routes (`_astro/`, `_server_islands/`, `_actions/`)
2. More path segments take precedence over fewer
3. Static routes beat dynamic routes (e.g. `announcements.astro` > `[guildId].astro`)
4. Named params beat rest params (`[guildId]` > `[...slug]`)
5. Pre-rendered routes beat server routes
6. Endpoints beat pages
7. File-based routes beat redirects
8. Alphabetical order as tiebreaker

> **Version note**: Global route priority (injected routes, file-based routes, and redirects treated equally) became default in **Astro 5.0** (previously `experimental.globalRoutePriority`).

### Current Priority Analysis

```text
/dashboard/announcements   -> dashboard/announcements.astro  (static wins)
/dashboard/123456789       -> dashboard/[guildId].astro       (dynamic)
/dashboard                 -> dashboard/index.astro           (static wins)
```

This is correct but should be documented in-code with comments for maintainability.

---

## 2. Dynamic Route Parameter Validation

### Current Problem

`[guildId]` accepts any string including non-numeric values. Discord guild IDs are Snowflakes (numeric strings of 17-20 digits).

### Improvement: Validate at Page Level

```astro
---
// src/pages/dashboard/[guildId].astro
const { guildId } = Astro.params;

// Validate Discord Snowflake format
if (!guildId || !/^\d{17,20}$/.test(guildId)) {
  return Astro.redirect("/404");
}
---
```

### Improvement: Validate in Middleware

For consistent validation across all `[guildId]` routes:

```typescript
// src/middleware.ts
const GUILD_ID_PATTERN = /^\/dashboard\/(\d{17,20})(\/|$)/;

if (url.pathname.startsWith("/dashboard/") && !url.pathname.startsWith("/dashboard/announcements")) {
  const match = url.pathname.match(GUILD_ID_PATTERN);
  if (!match) {
    return context.rewrite("/404");
  }
}
```

---

## 3. Configured Redirects

> **Version note**: Configured redirects added in **astro@2.9.0**. External URL redirects supported since **astro@5.2.0**.

### Recommended Configuration

```typescript
// astro.config.ts
export default defineConfig({
  redirects: {
    // Common typos and legacy URLs
    "/guilds": "/dashboard",
    "/servers": "/dashboard",
    "/login": "/auth/discord",
    "/signin": "/auth/discord",
    "/logout": "/auth/logout",
    // Trailing slash normalization
    "/dashboard/[guildId]/": "/dashboard/[guildId]",
  },
});
```

### Dynamic Redirects

For auth-gated redirects, use `Astro.redirect()` in the frontmatter. Note: redirects must happen at the page level, not inside child components, due to HTML streaming.

```astro
---
// src/pages/index.astro
const session = await Astro.session?.get("user");
if (session) {
  return Astro.redirect("/dashboard");
}
---
```

---

## 4. Custom Error Pages

### 404.astro Improvements

```astro
---
// src/pages/404.astro
Astro.response.status = 404;
Astro.response.statusText = "Not Found";
---
<Base title={t("error.notFound")}>
  <main class="flex flex-col items-center justify-center min-h-screen">
    <h1 class="text-4xl font-bold">404</h1>
    <p>{t("error.pageNotFound")}</p>
    <a href="/dashboard" data-astro-prefetch>
      {t("error.backToDashboard")}
    </a>
  </main>
</Base>
```

### 500.astro (New)

```astro
---
// src/pages/500.astro
Astro.response.status = 500;
Astro.response.statusText = "Internal Server Error";
---
<html>
  <head>
    <title>Server Error</title>
  </head>
  <body>
    <h1>500 - Server Error</h1>
    <p>Something went wrong. Please try again later.</p>
    <a href="/dashboard">Return to Dashboard</a>
  </body>
</html>
```

> **Note**: `500.astro` should be minimal HTML without layout imports to avoid cascading failures.

---

## 5. Trailing Slash Configuration

```typescript
// astro.config.ts
export default defineConfig({
  trailingSlash: "never", // Consistent: /dashboard not /dashboard/
});
```

> **Astro 6 breaking change**: Endpoint trailing slash behavior changed. Endpoints whose URLs include a file extension (e.g. `sitemap.xml.ts`) can only be accessed without a trailing slash regardless of `trailingSlash` config.

---

## 6. On-Demand Dynamic Routes (SSR Mode)

Since the project uses `output: "server"`, `getStaticPaths()` is not used. Dynamic routes receive params at request time:

```astro
---
// SSR mode: no getStaticPaths needed
export const prerender = false; // Not needed in 'server' mode

const { guildId } = Astro.params;
// guildId is available directly from the URL
---
```

### Rest Parameters

Only one rest parameter using spread notation is allowed per path in SSR mode:

```text
VALID:   src/pages/[locale]/[...slug].astro
VALID:   src/pages/[...locale]/[slug].astro
INVALID: src/pages/[...locale]/[...slug].astro  (two rest params)
```

---

## 7. Route Grouping Pattern

For better organization without affecting URL structure, use directories:

```text
pages/
  dashboard/
    index.astro           -> /dashboard
    [guildId].astro       -> /dashboard/:guildId
    [guildId]/
      announcements.astro -> /dashboard/:guildId/announcements
    announcements.astro   -> /dashboard/announcements
```

---

## Checklist

- [ ] Add Discord Snowflake validation for `[guildId]` routes
- [ ] Set `Astro.response.status = 404` in `404.astro`
- [ ] Create `500.astro` with minimal HTML
- [ ] Add configured redirects for common paths
- [ ] Set `trailingSlash: "never"` in config
- [ ] Document route priority for the dashboard section
- [ ] Validate endpoint trailing slash behavior for Astro 6

## Cross-References

- [03_PAGE_IMPROVEMENTS.md](./03_PAGE_IMPROVEMENTS.md) — Per-page improvements including 404/500
- [09_SECURITY.md](./09_SECURITY.md) — Auth-gated route protection
- [15_MIDDLEWARE_PATTERNS.md](./15_MIDDLEWARE_PATTERNS.md) — Middleware-based route validation
- [20_API_ROUTES.md](./20_API_ROUTES.md) — API endpoint routing patterns
