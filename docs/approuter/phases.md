# App Router Migration Phases

5-phase hybrid migration: infrastructure first → pilot validation → i18n → bulk pages → PWA/cleanup.

## Phase Overview

```
Phase 1: Infrastructure        ← app/layout, MUI+Emotion SSR, providers, global CSS/meta
Phase 2: Pilot Validation       ← /privacy-policy, /terms → CF Workers verification
Phase 3: i18n Migration         ← next-i18next → next-intl
Phase 4: Bulk Page Migration    ← Remaining 10 pages to app/, next/router migration
Phase 5: PWA + Cleanup          ← next-pwa → @serwist/next, sitemap, pages/ removal
```

**Critical constraint:** Phase 3 and Phase 4 must be executed consecutively without gap. Removing `i18n` config from `next.config.js` breaks `pages/` i18n. Ship as a single PR.

---

## Phase 1: Infrastructure

**Goal:** Create App Router skeleton, verify coexistence with `pages/`.

| Step | Task | Details |
|------|------|---------|
| 1-1 | Create `app/layout.tsx` | Root Server Component: `<html>`, `<body>`, `<InitColorSchemeScript attribute="class" />`, global CSS imports (`@fortawesome/fontawesome-svg-core/styles.css`, `globals.css`, `normalize.css`), FontAwesome `config.autoAddCss = false`, `<GoogleAnalytics />` |
| 1-2 | Migrate global `<Head>` tags | Move `_document.tsx` head content to `app/layout.tsx` metadata export: preconnect links, Google Ads script, charset, keywords, og:type, og:image, twitter:card, robots, manifest, apple-touch-icon, theme-color |
| 1-3 | Create `AppRouterCacheProvider` setup | Use `@mui/material-nextjs/v15-appRouter` `AppRouterCacheProvider`. Note: `ThemeModeProvider` already wraps `ThemeProvider` + `CssBaseline`, so do NOT duplicate them. The cache provider wraps around `ThemeModeProvider`. |
| 1-4 | Create `AppProviders` Client Component | Wrap: `AppRouterCacheProvider` → `ThemeModeProvider` → `TimeZoneContextProvider` → `VideoModalContextProvider` |
| 1-5 | Create `app/[locale]/layout.tsx` | Placeholder for now. `NextIntlClientProvider` added in Phase 3. |
| 1-6 | Create `app/page.tsx` | `redirect("/schedule/all")` |
| 1-7 | Create Route Groups | `(content)/layout.tsx` with ContentLayout, `(standalone)/` empty |
| 1-8 | Verify build | `pnpm cf:build` + `pnpm cf:preview` — app/ skeleton coexists with pages/ |

**Deliverable:** `app/` directory skeleton. All existing `pages/` routes continue to work.

**PR scope:** Single PR for infrastructure.

---

## Phase 2: Pilot Validation

**Goal:** Prove App Router pages work on Cloudflare Workers.

**i18n note:** Pilot pages (`privacy-policy`, `terms`) currently use `useTranslation("privacy")` / `useTranslation("terms")` from next-i18next. During Phase 2, the pages/ i18n system is still active. The pilot pages will temporarily hardcode or inline their minimal text content, bypassing i18n. Full i18n integration happens in Phase 3.

| Step | Task | Details |
|------|------|---------|
| 2-1 | Create pilot pages | `app/[locale]/(content)/privacy-policy/page.tsx`, `terms/page.tsx` as Server Components. Load markdown content directly (no i18n hooks). |
| 2-2 | Implement `generateMetadata` | Metadata for both pilot pages (hardcoded or locale-based without next-intl) |
| 2-3 | Delete `pages/` counterparts | Remove `pages/privacy-policy.tsx`, `pages/terms.tsx` |
| 2-4 | Build verification | `pnpm cf:build` success |
| 2-5 | Local Workers preview | `pnpm cf:preview` — verify rendering |
| 2-6 | Dev environment deploy | Deploy to dev CF Workers |
| 2-7 | Validation checklist | See [Validation Checklist](#phase-2-validation-checklist) below |
| 2-8 | Go/No-Go decision | Pass → Phase 3. Fail → investigate and fix. |

**Deliverable:** 2 pilot pages running on CF Workers via App Router.

**PR scope:** Single PR for pilot pages.

### Phase 2 Validation Checklist

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | Basic rendering | Pages render correctly, no 500 errors |
| 2 | Emotion SSR | MUI styles render server-side, no FOUC |
| 3 | Bundle size | `.open-next/worker.js` compressed < 10 MiB |
| 4 | Cold start TTFB | Measured. Document baseline for comparison. |
| 5 | Router coexistence | Both `app/` and `pages/` routes respond correctly |
| 6 | Locale routing | `/privacy-policy` and `/en/privacy-policy` both work |

### If Validation Fails

| Problem | Action |
|---------|--------|
| Build/runtime error | Check OpenNEXT releases for fixes. Pin dependencies if needed. |
| Bundle size > 10 MiB | Investigate with ESBuild Bundle Analyzer. Dynamic import splitting. |
| Cold start 2x+ worse | Optimize Server Component bundle. Report to OpenNEXT if systemic. |
| Router coexistence broken | Fall back to big-bang migration (all pages in one PR). |

---

## Phase 3: i18n Migration

**Goal:** Replace next-i18next with next-intl.

| Step | Task | Details |
|------|------|---------|
| 3-1 | Install next-intl | `pnpm add next-intl` |
| 3-2 | Create `src/i18n/routing.ts` | locales: `["en","ja","cn","tw","ko"]`, defaultLocale: `"ja"`, localePrefix: `"as-needed"` |
| 3-3 | Create `src/i18n/request.ts` | `getRequestConfig` with Cloudflare Assets loader. Load all 12 namespaces: `about`, `clips`, `common`, `events`, `freechat`, `meta`, `multiview`, `privacy`, `schedule`, `site-news`, `streams`, `terms` |
| 3-4 | Create `src/i18n/navigation.ts` | Typed `Link`, `redirect`, `usePathname`, `useRouter` wrappers |
| 3-5 | Rewrite `middleware.ts` | `createMiddleware(routing)` + existing timezone/sessionId logic |
| 3-6 | Update `app/[locale]/layout.tsx` | Add `NextIntlClientProvider` with messages |
| 3-7 | Remove `i18n` from `next.config.js` | Delete `i18n: { defaultLocale, locales, localeDetection }` block |
| 3-8 | Remove `experimental.scrollRestoration` | Pages Router only feature |
| 3-9 | Delete `next-i18next.config.js` | No longer needed |
| 3-10 | Add `/default/:path*` redirect | Redirect legacy pseudo-locale URLs to root |
| 3-11 | Update pilot pages | Replace hardcoded text with `getTranslations` / `useTranslations` |
| 3-12 | Verify | `pnpm cf:build` + `pnpm cf:preview` — pilot pages with next-intl on all locales |

**Deliverable:** next-intl fully wired. Pilot pages work with new i18n.

**PR scope:** Combined with Phase 4 into a single PR (i18n config removal breaks pages/ routes).

---

## Phase 4: Bulk Page Migration

**Goal:** Migrate all remaining 10 pages from `pages/` to `app/`.

### Migration Order (simple → complex)

| Step | Pages | Complexity | Notes |
|------|-------|-----------|-------|
| 4-1 | `about` | Low | Markdown loading, simple layout |
| 4-2 | `freechat` | Low | Single API call |
| 4-3 | `site-news`, `site-news/[id]` | Low-Medium | List + detail pages |
| 4-4 | `clips`, `clips/twitch`, `clips/youtube`, `clips/youtube/shorts` | Medium | 4 similar pages, standalone layout |
| 4-5 | `schedule/[status]` | High | Complex filters, query params, date fallback, multiple API calls |
| 4-6 | `multiview` | Medium | Almost entirely Client Component (react-grid-layout) |

### Per-Page Migration Steps

For each page:
1. Create `app/[locale]/(content or standalone)/<route>/page.tsx` as async Server Component
2. Move `getServerSideProps` logic into the async Server Component body
3. Add `export const dynamic = "force-dynamic"`
4. Implement `generateMetadata` (replace CustomHead)
5. Replace `useTranslation("ns")` → `useTranslations("ns")` in Client Components
6. For multi-namespace usage (`useTranslation(["clips", "common"])`), split into multiple `useTranslations` calls
7. Replace `serverSideTranslations()` — remove entirely (next-intl auto-resolves)
8. Delete corresponding `pages/*.tsx` file

### next/router → next/navigation Migration

**16 files** must migrate from `next/router` to `next/navigation` + `next-intl` navigation wrappers. This is done as part of each page's migration.

Key replacements:
- `import { useRouter } from "next/router"` → `import { useRouter } from "@/i18n/navigation"`
- `router.locale` → `useLocale()` from `next-intl`
- `router.asPath` → `usePathname()` + `useSearchParams()`
- `router.query` → `useSearchParams()` or page `searchParams` prop
- `router.push(url, undefined, { locale })` → `useRouter().push(url)` (locale handled by next-intl Link)
- `import Link from "next/link"` → `import { Link } from "@/i18n/navigation"`

Refactor `src/hooks/locale.ts` to use `next-intl` locale utilities instead of `next/router`.

### ContentLayout Refactoring

Remove embedded `CustomHead` from `ContentLayout`. The `title`, `description`, `path`, `canonicalPath` props used for `CustomHead` are no longer needed — metadata is handled by `generateMetadata` in each `page.tsx`.

### `next/dynamic` in VideoModalContext

`VideoModalContext.tsx` uses `next/dynamic` with `{ ssr: false }` for lazy loading. This continues to work in Client Components. Validate during migration but no code change expected.

### Cleanup

| Step | Task |
|------|------|
| 4-7 | Delete `_app.tsx`, `_document.tsx` |
| 4-8 | Delete `pages/` directory |
| 4-9 | Uninstall `next-i18next`, `i18next`, `react-i18next` |
| 4-10 | Delete `src/lib/i18n/cf-assets.ts` (CloudflareAssetsBackend for i18next) |
| 4-11 | Delete `src/lib/i18n/server.ts` (unified i18next loader) |
| 4-12 | Full verification: `pnpm cf:build` + `pnpm cf:preview` |
| 4-13 | Dev deploy: all pages x all locales verification |

**Deliverable:** All pages on App Router. `pages/` directory deleted.

**PR scope:** Single PR together with Phase 3.

---

## Phase 5: PWA + Cleanup

**Goal:** Finalize migration. Replace remaining Pages Router dependencies.

| Step | Task | Details |
|------|------|---------|
| 5-1 | PWA migration | Uninstall `next-pwa`, install `@serwist/next`. Rewrite service worker config. |
| 5-2 | Sitemap migration | Replace `next-sitemap` → `app/sitemap.ts` (App Router native). Delete `next-sitemap.config.js`. |
| 5-3 | Error pages | Add `not-found.tsx`, `error.tsx`, `loading.tsx` |
| 5-4 | Cleanup | Remove dead imports, unused config files, leftover Pages Router references |
| 5-5 | Quality gates | Biome lint + TypeScript type check + knip |
| 5-6 | Dev deploy + full test | All pages, all locales, PWA install, offline behavior |
| 5-7 | Production deploy | Deploy to production CF Workers |

**Deliverable:** Migration complete. Production on App Router.

**PR scope:** Single PR for PWA + cleanup.

---

## Rollback Strategy

| Scenario | Action |
|----------|--------|
| Phase 1-2 issues | Delete `app/` directory. `pages/` untouched. |
| Phase 3-4 issues | Revert the combined PR. All pages back to `pages/`. |
| Production issues | Cloudflare Workers instant rollback to previous deployment. |

## PR Structure

| PR | Content | Merge Target |
|----|---------|-------------|
| PR 1 | Phase 1: Infrastructure | develop |
| PR 2 | Phase 2: Pilot pages | develop |
| PR 3 | Phase 3+4: i18n + bulk page migration | develop |
| PR 4 | Phase 5: PWA + cleanup | develop |
