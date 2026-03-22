# Routing

## App Router Structure

Pages live in `src/app/[locale]/` using the App Router convention. Each page is an async Server Component that fetches data and renders directly.

```text
src/app/
├── layout.tsx                    # Root layout (metadata only, returns children)
├── sitemap.ts                    # App Router native sitemap
├── sw.ts                         # Service worker (@serwist/next)
├── not-found.tsx
├── page.tsx                      # Root redirect
└── [locale]/
    ├── layout.tsx                # Locale layout (html, body, providers, NextIntlClientProvider)
    ├── error.tsx
    ├── loading.tsx
    ├── (content)/                # Route group: pages with ContentLayout
    │   ├── layout.tsx            # Passthrough layout
    │   ├── schedule/[status]/page.tsx
    │   ├── freechat/page.tsx
    │   ├── about/page.tsx
    │   ├── site-news/page.tsx
    │   ├── site-news/[id]/page.tsx
    │   ├── privacy-policy/page.tsx
    │   └── terms/page.tsx
    └── (standalone)/             # Route group: clips and multiview (own layout)
        ├── layout.tsx            # Passthrough layout
        ├── clips/page.tsx
        ├── clips/youtube/page.tsx
        ├── clips/youtube/shorts/page.tsx
        ├── clips/twitch/page.tsx
        └── multiview/page.tsx
```

## Route Groups

| Group | Purpose | Pages |
|-------|---------|-------|
| `(content)` | Standard pages wrapped in `ContentLayout` by each page | schedule, freechat, about, site-news, privacy-policy, terms |
| `(standalone)` | Full-width pages with custom layouts | clips, multiview |

Route groups do not affect the URL path. Both groups use passthrough layouts (`<>{children}</>`) -- the actual layout wrapping (`ContentLayout`) is done inside each page's Server Component.

## Layout Hierarchy

### Root Layout (`app/layout.tsx`)

Global metadata only. Returns `children` without wrapping in `<html>` or `<body>` (delegated to locale layout).

### Locale Layout (`app/[locale]/layout.tsx`)

Renders the full HTML shell with providers:

```tsx
export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
```

### Page Structure

Each page is an async Server Component that wraps its content in `ContentLayout`:

```tsx
export default async function SchedulePage({ params, searchParams }) {
  const { locale, status } = await params;
  // ... fetch data, get translations ...

  return (
    <ContentLayout title={title} path={`/schedule/${status}`}>
      <ScheduleStatusContainer livestreams={schedule.livestreams} ... />
    </ContentLayout>
  );
}
```

No more `NextPageWithLayout` or `getLayout` pattern.

## Route Map

| Path | Page File | Feature | Rendering |
|------|-----------|---------|-----------|
| `/` | `app/page.tsx` | redirect -> `/schedule/all` | - |
| `/schedule/all` | `(content)/schedule/[status]/page.tsx` | schedule | Dynamic |
| `/schedule/live` | `(content)/schedule/[status]/page.tsx` | schedule | Dynamic |
| `/schedule/upcoming` | `(content)/schedule/[status]/page.tsx` | schedule | Dynamic |
| `/schedule/archive` | `(content)/schedule/[status]/page.tsx` | schedule | Dynamic |
| `/clips` | `(standalone)/clips/page.tsx` | clips | Dynamic |
| `/clips/youtube` | `(standalone)/clips/youtube/page.tsx` | clips | Dynamic |
| `/clips/youtube/shorts` | `(standalone)/clips/youtube/shorts/page.tsx` | clips | Dynamic |
| `/clips/twitch` | `(standalone)/clips/twitch/page.tsx` | clips | Dynamic |
| `/freechat` | `(content)/freechat/page.tsx` | freechat | Dynamic |
| `/multiview` | `(standalone)/multiview/page.tsx` | multiview | Dynamic |
| `/about` | `(content)/about/page.tsx` | about | SSG |
| `/site-news` | `(content)/site-news/page.tsx` | site-news | SSG |
| `/site-news/[id]` | `(content)/site-news/[id]/page.tsx` | site-news | ISR (3600s) |
| `/privacy-policy` | `(content)/privacy-policy/page.tsx` | legal | SSG |
| `/terms` | `(content)/terms/page.tsx` | legal | SSG |

All routes are locale-prefixed at runtime: `/{locale}/schedule/all`, etc. The default locale (`ja`) omits the prefix (`localePrefix: "as-needed"`).

### Redirects (next.config.js)

- `/` -> `/schedule/all`
- `/notifications/*` -> `/site-news/*` (legacy URL support)

## Layout System

See [Styling - Layout Components](./styling.md#layout-components) for ContentLayout, Header, Footer, and Navigation details.

Route definitions live in `constants/navigation.ts`:

```typescript
const internalRoutes = {
  list: "/schedule/all",
  archive: "/schedule/archive",
  live: "/schedule/live",
  upcoming: "/schedule/upcoming",
  freechat: "/freechat",
  clip: "/clips",
  multiview: "/multiview",
  about: "/about",
  "site-news": "/site-news",
};
```

## Middleware

See [Middleware](./middleware.md) for the full request flow, locale resolution algorithm, timezone/session handling, and cookie settings.
