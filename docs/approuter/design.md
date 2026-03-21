# App Router Migration Design

## Decision Summary

| Item | Decision | Rationale |
|------|----------|-----------|
| Next.js version | 15.5.14 (maintain current) | Already stable. OpenNEXT has good support for Next.js 15. |
| i18n | next-intl | App Router de facto standard. Server Components support, type-safe, routing integration. |
| Styling | MUI + Emotion (maintain, `"use client"`) | Lowest UI/UX risk. MUI official App Router + Emotion setup guide available. |
| Migration approach | Hybrid (infrastructure first → pilot → bulk pages) | Infrastructure validation before page migration minimizes rework. 12 pages is feasible for bulk migration. |
| Data fetching | Phase 1: all dynamic SSR → Phase 2: per-page optimization | Safety first. Reproduce current behavior, optimize later. |
| PWA | @serwist/next (migrate from next-pwa) | Official App Router support, actively maintained successor. |

## Directory Structure (Post-Migration)

```
src/
├── app/
│   ├── layout.tsx                  # Root layout (html, body, global head tags, GA, CSS imports)
│   ├── page.tsx                    # redirect("/schedule/all")
│   ├── not-found.tsx
│   ├── sitemap.ts                  # App Router native sitemap
│   ├── [locale]/
│   │   ├── layout.tsx              # next-intl provider, locale validation
│   │   ├── (content)/              # Route Group: ContentLayout applied
│   │   │   ├── layout.tsx          # ContentLayout wrapper (refactored, no CustomHead)
│   │   │   ├── schedule/
│   │   │   │   └── [status]/
│   │   │   │       └── page.tsx
│   │   │   ├── site-news/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── freechat/
│   │   │   │   └── page.tsx
│   │   │   ├── privacy-policy/
│   │   │   │   └── page.tsx
│   │   │   └── terms/
│   │   │       └── page.tsx
│   │   └── (standalone)/           # Route Group: No ContentLayout
│   │       ├── clips/
│   │       │   ├── page.tsx
│   │       │   ├── twitch/
│   │       │   │   └── page.tsx
│   │       │   └── youtube/
│   │       │       ├── page.tsx
│   │       │       └── shorts/
│   │       │           └── page.tsx
│   │       └── multiview/
│   │           └── page.tsx
├── features/                       # Existing feature modules (unchanged)
│   ├── schedule/
│   ├── clips/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Layout/             # ContentLayout refactored (remove CustomHead)
│   │   │   └── Elements/           # "use client" (MUI widgets)
│   │   ├── api/                    # Existing API layer (reused as-is)
│   │   └── domain/                 # Zod schemas (unchanged)
│   └── ...
├── i18n/                           # next-intl configuration
│   ├── request.ts                  # getRequestConfig (CF Assets loader)
│   ├── routing.ts                  # Routing definition
│   └── navigation.ts              # Link, redirect wrappers
├── middleware.ts                    # next-intl middleware + timezone/session
└── context/                        # "use client" providers (minimal changes)
    ├── Theme.tsx                   # ThemeModeProvider (includes ThemeProvider + CssBaseline)
    ├── TimeZoneContext.tsx         # TimeZoneContextProvider
    └── VideoModalContext.tsx       # VideoModalContextProvider
```

## Server / Client Component Boundary

### Server Components (default)

- `app/layout.tsx` — Root HTML, global meta, GA script
- `app/[locale]/layout.tsx` — next-intl provider
- `app/[locale]/*/page.tsx` — Data fetching (replaces getServerSideProps)
- `features/*/api/*` — API calls (Cloudflare service binding / VSPOApi)
- `features/shared/domain/*` — Zod schemas

### Client Components ("use client")

- `features/shared/components/Layout/ContentLayout.tsx` — MUI styled layout
- `features/shared/components/Elements/*` — MUI interactive widgets
- `features/*/pages/*/presenter.tsx` — MUI styled UI presenters
- `context/Theme.tsx` — ThemeModeProvider (ThemeProvider + CssBaseline)
- `context/TimeZoneContext.tsx` — TimeZoneContextProvider
- `context/VideoModalContext.tsx` — VideoModalContextProvider

### Mapping from Current Patterns

```
Current (Pages Router):
  getServerSideProps → Container → Presenter

After (App Router):
  page.tsx (Server Component, async) → Presenter ("use client")
```

The existing Container/Presenter pattern maps naturally:
- **Container** logic (data fetching, param parsing) → `page.tsx` Server Component
- **Presenter** (MUI UI rendering) → `"use client"` component receiving props

## Page Migration Mapping

| Current Page | App Router Path | Notes |
|---|---|---|
| `pages/schedule/[status].tsx` | `app/[locale]/(content)/schedule/[status]/page.tsx` | Most complex. Filters, query params, fallback logic. |
| `pages/clips/index.tsx` | `app/[locale]/(standalone)/clips/page.tsx` | |
| `pages/clips/twitch/index.tsx` | `app/[locale]/(standalone)/clips/twitch/page.tsx` | |
| `pages/clips/youtube/index.tsx` | `app/[locale]/(standalone)/clips/youtube/page.tsx` | |
| `pages/clips/youtube/shorts/index.tsx` | `app/[locale]/(standalone)/clips/youtube/shorts/page.tsx` | |
| `pages/site-news/index.tsx` | `app/[locale]/(content)/site-news/page.tsx` | |
| `pages/site-news/[id].tsx` | `app/[locale]/(content)/site-news/[id]/page.tsx` | |
| `pages/about.tsx` | `app/[locale]/(content)/about/page.tsx` | Markdown loading |
| `pages/freechat.tsx` | `app/[locale]/(content)/freechat/page.tsx` | |
| `pages/multiview.tsx` | `app/[locale]/(standalone)/multiview/page.tsx` | react-grid-layout (client heavy) |
| `pages/privacy-policy.tsx` | `app/[locale]/(content)/privacy-policy/page.tsx` | **Pilot page** |
| `pages/terms.tsx` | `app/[locale]/(content)/terms/page.tsx` | **Pilot page** |

**Total: 12 pages** (2 pilot + 10 remaining)

## Metadata Migration

**Before:** `CustomHead` component (manual per page, embedded inside ContentLayout)
**After:** App Router `generateMetadata` API + global metadata in root layout

### Global metadata (from `_document.tsx` → `app/layout.tsx`)

The following tags currently in `_document.tsx` `<Head>` move to root layout metadata:

- `preconnect` links (yt3.ggpht.com, googletagmanager.com)
- Google Ads script (production only)
- `charset`, `keywords`, `og:type`, `og:image`, `twitter:card`, `twitter:image`
- `robots`, `manifest`, `apple-touch-icon`, `theme-color`

### Per-page metadata (`generateMetadata`)

```typescript
// Example: app/[locale]/(content)/schedule/[status]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, status } = await params;
  const t = await getTranslations({ locale, namespace: "schedule" });
  return {
    title: t("meta.title", { status }),
    description: t("meta.description"),
    alternates: { canonical: `/${status}` },
  };
}
```

### ContentLayout refactoring

`ContentLayout` currently embeds `CustomHead` internally (receives `title`, `description`, `path`, `canonicalPath` props). Since `next/head` does not work in App Router, ContentLayout must be refactored to **remove** the embedded `CustomHead`. Metadata is handled by `generateMetadata` in each `page.tsx` instead.

## Router Migration (next/router → next/navigation)

**16 files** import `useRouter` from `next/router`. The API differs significantly:

| `next/router` | `next/navigation` | Notes |
|---|---|---|
| `router.push(url)` | `router.push(url)` | Similar, but no `locale` option |
| `router.replace(url)` | `router.replace(url)` | Similar |
| `router.locale` | Use `useLocale()` from `next-intl` | |
| `router.asPath` | `usePathname()` + `useSearchParams()` | Split into two hooks |
| `router.query` | `useSearchParams()` or page `params`/`searchParams` props | |
| `router.events` | Removed. Use `usePathname()` + `useEffect()` | |

### Affected files

- `features/schedule/pages/ScheduleStatus/container.tsx`
- `features/about/pages/AboutPage/container.tsx`
- `features/site-news/pages/*/container.tsx` (2 files)
- `features/clips/pages/*/presenter.tsx` (3 files)
- `features/clips/components/containers/ClipTabsAndList.tsx`
- `features/shared/components/Layout/Navigation.tsx`
- `features/shared/components/Elements/Link/Breadcrumb.tsx`
- `features/shared/components/Elements/Link/Link.tsx`
- `features/shared/components/Elements/Modal/VideoModal.tsx`
- `features/shared/components/Elements/Control/TimeZoneSelector.tsx`
- `features/schedule/pages/ScheduleStatus/components/DateSearchDialogContainer.tsx`
- `features/schedule/pages/ScheduleStatus/components/LivestreamContent/presenter.tsx`
- `hooks/locale.ts`

For locale-aware navigation, use `Link`, `redirect`, `useRouter`, `usePathname` from `src/i18n/navigation.ts` (next-intl typed wrappers) instead of direct `next/navigation` imports.

## Translation Hook Migration Scope

**36 files** (76 occurrences) use `useTranslation` from `next-i18next`. All must be migrated to `useTranslations` from `next-intl`.

### Multi-namespace pattern

Some components use `useTranslation(["clips", "common"])` with array namespaces. `next-intl`'s `useTranslations` accepts only a single namespace. Migration pattern:

```typescript
// Before:
const { t } = useTranslation(["clips", "common"]);
t("clips:title");
t("common:loading");

// After:
const tClips = useTranslations("clips");
const tCommon = useTranslations("common");
tClips("title");
tCommon("loading");
```

## Global CSS Migration

`_app.tsx` imports the following CSS files that must move to `app/layout.tsx`:

```typescript
import "@fortawesome/fontawesome-svg-core/styles.css";
import "@/styles/globals.css";
import "@/styles/normalize.css";
```

Also, FontAwesome `config.autoAddCss = false` must be set in the root layout or a dedicated setup file.

## GoogleAnalytics Component

Currently rendered in `_app.tsx` outside the provider tree. Must be placed in `app/layout.tsx` (e.g., in `<body>` alongside providers).

## Redirect Handling

| Redirect | Implementation |
|----------|---------------|
| `/` → `/schedule/all` | `app/page.tsx` with `redirect()` + `next.config.js` redirect (maintained) |
| `/notifications/:id*` → `/site-news/:id*` | `next.config.js` redirect (maintained) |

## next.config.js Changes

| Setting | Action |
|---------|--------|
| `i18n` block | **Remove** (next-intl handles routing) |
| `experimental.reactCompiler` | Maintain |
| `experimental.scrollRestoration` | **Remove** (Pages Router only; App Router handles scroll differently) |
| `compiler.emotion` | Maintain |
| `serverExternalPackages` | Maintain (`@emotion/*`) |
| PWA plugin | Replace `next-pwa` → `@serwist/next` |
| `redirects()` | Maintain |
| `images` | Maintain |
| `skipMiddlewareUrlNormalize` | Re-evaluate (may not be needed with next-intl) |

## `"default"` Pseudo-Locale Redirect Strategy

The current system uses `"default"` as `defaultLocale` in next-i18next config. If any `/default/...` URLs have been indexed by search engines, add a redirect:

```javascript
// next.config.js redirects()
{ source: "/default/:path*", destination: "/:path*", permanent: true }
```
