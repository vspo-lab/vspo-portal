# App Router Migration — Single PR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the vspo-schedule Next.js 15 frontend from Pages Router to App Router in a single PR, preserving all UI/UX, deployed on Cloudflare Workers via OpenNEXT.

**Architecture:** All 5 phases (Infrastructure, i18n, Bulk Page Migration, PWA, Cleanup) combined into one PR. Phase 2 pilot validation is skipped — pages are created directly with full next-intl integration. Container logic moves to Server Component `page.tsx`, presenters stay as `"use client"` components. All data fetching logic from `getServerSideProps` moves into async Server Component page bodies.

**Tech Stack:** Next.js 15.5.14, @opennextjs/cloudflare, next-intl, MUI v7 + Emotion, @serwist/next, Cloudflare Workers

**Spec:** `docs/approuter/design.md`, `docs/approuter/phases.md`, `docs/approuter/i18n-migration.md`, `docs/approuter/mui-app-router.md`, `docs/approuter/cloudflare-barriers.md`

**Working directory:** `service/vspo-schedule/v2/web/` (all paths below are relative to this)

**UI/UX constraint:** All user-facing behavior must remain identical. Presenter components are changed only for i18n hook migration (`useTranslation` → `useTranslations`). No layout, styling, or interaction changes.

---

## Common Transformation Patterns

Reference these patterns throughout all tasks.

### Pattern A: useTranslation → useTranslations

```typescript
// BEFORE (next-i18next):
import { useTranslation } from "next-i18next";
const { t } = useTranslation("namespace");
t("key");

// AFTER (next-intl):
import { useTranslations } from "next-intl";
const t = useTranslations("namespace");
t("key");
```

Multi-namespace:
```typescript
// BEFORE:
const { t } = useTranslation(["clips", "common"]);
t("clips:title");
t("common:loading");

// AFTER:
const tClips = useTranslations("clips");
const tCommon = useTranslations("common");
tClips("title");
tCommon("loading");
```

### Pattern B: useRouter migration

```typescript
// BEFORE (next/router):
import { useRouter } from "next/router";
const router = useRouter();
router.locale       // → useLocale() from "next-intl"
router.asPath       // → usePathname() from "@/i18n/navigation"
router.query        // → useSearchParams() from "next/navigation" or page params/searchParams
router.push(url, undefined, { locale }) // → router.push(url) from "@/i18n/navigation"
router.events       // → removed; use useTransition() for loading states

// AFTER (next-intl navigation):
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
```

### Pattern C: returnObjects → t.raw

```typescript
// BEFORE (i18next):
t("key", { returnObjects: true }) as string[]

// AFTER (next-intl):
t.raw("key") as string[]
```

### Pattern D: TFunction type removal

```typescript
// BEFORE:
import type { TFunction } from "next-i18next";
type Props = { t: TFunction };

// AFTER: Remove t prop entirely; call useTranslations() inside the component.
```

### Pattern G: NextPageWithLayout type removal

```typescript
// BEFORE:
import type { NextPageWithLayout } from "@/pages/_app";
const MyPage: NextPageWithLayout<Props> = ({ ... }) => { ... };
MyPage.getLayout = (page, pageProps) => (
  <ContentLayout ...>{page}</ContentLayout>
);
export default MyPage;

// AFTER: Remove NextPageWithLayout import, remove getLayout.
// The component becomes a plain React.FC<Props>.
// Layout wrapping moves to page.tsx Server Component.
import type React from "react";
export const MyComponent: React.FC<Props> = ({ ... }) => { ... };
```

### Pattern H: Service function req → sessionId

```typescript
// BEFORE:
async function fetchData({ ..., req }: { ..., req: IncomingMessage }) {
  const sessionId = getSessionId(req);
  ...
}

// AFTER:
async function fetchData({ ..., sessionId }: { ..., sessionId?: string }) {
  // Use sessionId directly
  ...
}

// In page.tsx Server Component:
import { cookies } from "next/headers";
const cookieStore = await cookies();
const sessionId = cookieStore.get("x-session-id")?.value;
const data = await fetchData({ ..., sessionId });
```

### Pattern E: Page migration (getServerSideProps → Server Component)

```typescript
// BEFORE (pages/example.tsx):
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { locale, req, res } = context;
  const timeZone = req.cookies[TIME_ZONE_COOKIE] ?? DEFAULT_TIME_ZONE;
  const data = await fetchData({ locale, req });
  const translations = await serverSideTranslations(locale, ["ns"]);
  return { props: { data, ...translations } };
};

// AFTER (app/[locale]/(content)/example/page.tsx):
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ns" });
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function ExamplePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const timeZone = cookieStore.get("time-zone")?.value ?? "Asia/Tokyo";
  const sessionId = cookieStore.get("x-session-id")?.value;
  const data = await fetchData({ locale, sessionId });
  return (
    <ContentLayout title="Example" path="/example">
      <ExamplePresenter data={data} />
    </ContentLayout>
  );
}
```

### Pattern F: router.events → useTransition (loading state)

```typescript
// BEFORE:
const router = useRouter();
const [isLoading, setIsLoading] = useState(false);
useEffect(() => {
  router.events.on("routeChangeStart", () => setIsLoading(true));
  router.events.on("routeChangeComplete", () => setIsLoading(false));
  return () => { /* cleanup */ };
}, [router]);
router.push(url);

// AFTER:
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
const router = useRouter();
const [isLoading, startTransition] = useTransition();
// Wrap navigation in startTransition:
startTransition(() => { router.push(url); });
// isLoading is automatically true during navigation, false after
```

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install next-intl and @serwist/next**

```bash
cd service/vspo-schedule/v2/web
pnpm add next-intl @serwist/next serwist
```

- [ ] **Step 2: Install @mui/material-nextjs App Router support**

The package `@mui/material-nextjs` is already installed (provides both `v14-pagesRouter` and `v15-appRouter` exports). No additional install needed. Verify:

```bash
pnpm ls @mui/material-nextjs
```

- [ ] **Step 3: Commit**

```
chore(web): add next-intl and @serwist/next dependencies
```

---

## Task 2: Create i18n Infrastructure

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`

- [ ] **Step 1: Create routing config**

```typescript
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "cn", "tw", "ko"],
  defaultLocale: "ja",
  localePrefix: "as-needed",
});
```

- [ ] **Step 2: Create request config with Cloudflare Assets loader**

```typescript
// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";
import { routing } from "./routing";

const NAMESPACES = [
  "about",
  "clips",
  "common",
  "events",
  "freechat",
  "meta",
  "multiview",
  "privacy",
  "schedule",
  "site-news",
  "streams",
  "terms",
] as const;

async function loadNamespace(
  locale: string,
  ns: string,
  assets?: { fetch(url: string): Promise<Response> },
): Promise<Record<string, unknown>> {
  if (assets) {
    const response = await assets.fetch(
      `https://placeholder/locales/${locale}/${ns}.json`,
    );
    if (!response.ok) return {};
    return response.json() as Promise<Record<string, unknown>>;
  }
  // Local dev: dynamic import
  return import(`../../../public/locales/${locale}/${ns}.json`).then(
    (m) => m.default,
  );
}

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  const { context, isValid } = await getCloudflareEnvironmentContext();
  const assets =
    isValid && !context.err
      ? (
          context.val?.env as unknown as {
            ASSETS?: { fetch(url: string): Promise<Response> };
          }
        )?.ASSETS
      : undefined;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, await loadNamespace(locale, ns, assets)]),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested &&
    routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  const messages = await loadMessages(locale);

  return { locale, messages };
});
```

- [ ] **Step 3: Create navigation wrappers**

```typescript
// src/i18n/navigation.ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 5: Commit**

```
feat(web): add next-intl infrastructure (routing, request config, navigation)
```

---

## Task 3: Create AppProviders Client Component

**Files:**
- Create: `src/components/AppProviders.tsx`

- [ ] **Step 1: Create AppProviders**

```typescript
// src/components/AppProviders.tsx
"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeModeProvider } from "@/context/Theme";
import { TimeZoneContextProvider } from "@/context/TimeZoneContext";
import { VideoModalContextProvider } from "@/context/VideoModalContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeModeProvider>
        <TimeZoneContextProvider>
          <VideoModalContextProvider>{children}</VideoModalContextProvider>
        </TimeZoneContextProvider>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
```

Note: `ThemeModeProvider` already wraps `ThemeProvider` + `CssBaseline`. Do NOT duplicate them.

- [ ] **Step 2: Commit**

```
feat(web): add AppProviders client component for App Router
```

---

## Task 4: Create App Directory Structure

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/(content)/layout.tsx`

- [ ] **Step 1: Create root layout**

Migrate global concerns from `_document.tsx` and `_app.tsx`:

Note: `<html>` and `<body>` tags are NOT in the root layout — they are in the locale layout (`app/[locale]/layout.tsx`) so the `lang` attribute can be set dynamically from the locale parameter.

```typescript
// src/app/layout.tsx
import "@fortawesome/fontawesome-svg-core/styles.css";
import "@/styles/globals.css";
import "@/styles/normalize.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import type { Metadata } from "next";

config.autoAddCss = false;

export const metadata: Metadata = {
  keywords:
    "VSPO!, Vspo, ぶいすぽっ！, ぶいすぽ, streaming schedule, 配信スケジュール, 直播时间表, 直播時間表, 스트리밍 일정, virtual esports, vtuber, esports, gaming",
  openGraph: {
    type: "website",
    images: "https://www.vspo-schedule.com/page-icon.png",
  },
  twitter: {
    card: "summary_large_image",
    images: "https://www.vspo-schedule.com/page-icon.png",
  },
  robots: "all",
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
  other: { "theme-color": "#fff" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

- [ ] **Step 2: Create root page redirect**

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/schedule/all");
}
```

- [ ] **Step 3: Create locale layout with `<html>`, `<body>`, providers, and NextIntlClientProvider**

This is the main layout that renders `<html>` and `<body>` with the dynamic `lang` attribute. It also wraps children with AppProviders and NextIntlClientProvider.

```typescript
// src/app/[locale]/layout.tsx
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import Script from "next/script";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/AppProviders";
import { GoogleAnalytics } from "@/features/shared/components/Elements";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://yt3.ggpht.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <NextIntlClientProvider messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <GoogleAnalytics />
        {process.env.ENV === "production" &&
          process.env.NEXT_PUBLIC_ADS_GOOGLE && (
            <Script
              src={process.env.NEXT_PUBLIC_ADS_GOOGLE}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
          )}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create (content) route group layout**

ContentLayout requires per-page props (title, path, etc.) so it cannot be shared at the route group level. Each page wraps its own content in ContentLayout individually. The group layout is a passthrough.

```typescript
// src/app/[locale]/(content)/layout.tsx
export default function ContentGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 5: Commit**

```
feat(web): create App Router directory structure with layouts
```

---

## Task 5: Update next.config.js

**Files:**
- Modify: `next.config.js`
- Delete: `next-i18next.config.js`

- [ ] **Step 1: Rewrite next.config.js**

Key changes:
1. Remove `import nextPWA from "next-pwa"` and `withPWA` wrapper
2. Remove `import ci18n from "./next-i18next.config.js"`
3. Remove `i18n: { ... }` block
4. Remove `experimental.scrollRestoration` (Pages Router only)
5. Add `import createNextIntlPlugin from "next-intl/plugin"`
6. Add `/default/:path*` redirect
7. Export via `withNextIntl(nextConfig)` instead of `withPWA(nextConfig)`

The resulting `next.config.js`:

```javascript
import createNextIntlPlugin from "next-intl/plugin";
import pkgJson from "./package.json" with { type: "json" };

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const emotionPackages = Object.keys(pkgJson.dependencies).filter((pkg) =>
  pkg.startsWith("@emotion/"),
);

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-tweet"],
  compiler: {
    emotion: {
      sourceMap: process.env.NODE_ENV !== "production",
      autoLabel: "dev-only",
      labelFormat: "[local]",
    },
  },
  experimental: {
    reactCompiler: true,
  },
  serverExternalPackages: emotionPackages,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        hostname: "localhost",
        protocol: "http",
        port: "3000",
        pathname: "**",
      },
      {
        hostname: "imagegw03.twitcasting.tv",
        protocol: "http",
        port: "",
        pathname: "**",
      },
      ...[
        "i.ytimg.com",
        "vod-secure.twitch.tv",
        "static-cdn.jtvnw.net",
        "imagegw03.twitcasting.tv",
        "secure-dcdn.cdn.nimg.jp",
        "yt3.googleusercontent.com",
        "yt3.ggpht.com",
        "clips-media-assets2.twitch.tv",
      ].map((hostname) => ({
        hostname,
        protocol: "https",
        port: "",
        pathname: "**",
      })),
    ],
  },
  skipMiddlewareUrlNormalize: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/schedule/all",
        permanent: true,
      },
      {
        source: "/notifications/:id*",
        destination: "/site-news/:id*",
        permanent: true,
      },
      {
        source: "/default/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

- [ ] **Step 2: Delete next-i18next.config.js**

Delete: `next-i18next.config.js`

- [ ] **Step 3: Commit**

```
feat(web): update next.config for App Router (remove i18n/PWA, add next-intl plugin)
```

---

## Task 6: Rewrite Middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Replace middleware with next-intl middleware**

Replace the full content of `src/middleware.ts`. Preserve `setTimeZone` and `setSessionId` logic. The custom `setLocale` function is replaced entirely by `createMiddleware(routing)` which handles locale detection and `NEXT_LOCALE` cookie.

```typescript
// src/middleware.ts
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_TIME_ZONE,
  SESSION_ID_COOKIE,
  TIME_ZONE_COOKIE,
} from "./lib/Const";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  setTimeZone(request, response);
  setSessionId(request, response);
  return response;
}

const setTimeZone = (req: NextRequest, res: NextResponse) => {
  const timeZone =
    req.cookies.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;
  res.cookies.set({
    name: TIME_ZONE_COOKIE,
    value: timeZone,
    path: "/",
    maxAge: 34560000,
  });
};

const setSessionId = (req: NextRequest, res: NextResponse) => {
  if (!req.cookies.get(SESSION_ID_COOKIE)?.value) {
    res.cookies.set({
      name: SESSION_ID_COOKIE,
      value: crypto.randomUUID(),
      path: "/",
      maxAge: 34560000,
    });
  }
};

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

- [ ] **Step 2: Commit**

```
feat(web): rewrite middleware for next-intl
```

---

## Task 7: Refactor ContentLayout (Remove CustomHead)

**Files:**
- Modify: `src/features/shared/components/Layout/ContentLayout.tsx`

- [ ] **Step 1: Remove CustomHead from ContentLayout and add `"use client"`**

In `src/features/shared/components/Layout/ContentLayout.tsx`:
1. Add `"use client";` as the first line (ContentLayout uses `useState` and `useEffect`, so it must be a Client Component in App Router)
2. Remove `import { CustomHead } from "../Head/Head";`
3. Remove the `<CustomHead ... />` JSX element (line ~100-105)
4. Remove `headTitle` and `canonicalPath` from `ContentLayoutProps` type (no longer needed — metadata handled by `generateMetadata` in each `page.tsx`)
5. Keep `title`, `description`, `path` props — they're used by Header and Footer

After edit, the render should look like:

```tsx
return (
  <>
    {immersiveStyles}
    <div data-layout-header>
      <Header title={title} />
    </div>
    <AlertSnackbar open={alertOpen} onClose={handleAlertClose} />
    <StyledContainer
      component="main"
      maxWidth={maxPageWidth}
      padTop={padTop}
      className={path === "/multiview" ? "multiview-container" : ""}
    >
      {children}
    </StyledContainer>
    <div data-layout-footer>
      <Footer
        lastUpdateTimestamp={lastUpdateTimestamp}
        description={footerMessage}
      />
    </div>
    <div data-layout-bottom-nav>
      <CustomBottomNavigation />
    </div>
  </>
);
```

- [ ] **Step 2: Commit**

```
refactor(web): remove CustomHead from ContentLayout
```

---

## Task 8: Rewrite useLocale Hook

**Files:**
- Modify: `src/hooks/locale.ts`

- [ ] **Step 1: Rewrite to use next-intl**

Replace the full content of `src/hooks/locale.ts`:

```typescript
// src/hooks/locale.ts
import { useLocale as useNextIntlLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export const useLocale = () => {
  const locale = useNextIntlLocale();
  const router = useRouter();
  const pathname = usePathname();

  const setLocale = (newLocale: string) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale, scroll: false });
    }
  };

  return { locale, setLocale };
};
```

- [ ] **Step 2: Commit**

```
refactor(web): rewrite useLocale hook for next-intl
```

---

## Task 9: Migrate Shared Components

**Files:** Multiple shared components need `useTranslation` → `useTranslations` and `useRouter` → next-intl navigation.

Apply Pattern A (useTranslation → useTranslations) and Pattern B (useRouter migration) to each file.

- [ ] **Step 1: Migrate shared layout components**

| File | Changes |
|------|---------|
| `src/features/shared/components/Layout/Header.tsx` | `useTranslation("common")` → `useTranslations("common")` |
| `src/features/shared/components/Layout/Footer.tsx` | `useTranslation("common")` → `useTranslations("common")`. Also replace any `import Link from "next/link"` with `import { Link } from "@/i18n/navigation"` for locale-aware links. |
| `src/features/shared/components/Layout/Navigation.tsx` | `useTranslation("common")` → `useTranslations("common")`. Replace `import { useRouter } from "next/router"` → `import { usePathname } from "@/i18n/navigation"`. Replace `router.asPath` → `usePathname()`. The path-matching logic (`basePath = pathParts.slice(0, 2).join("/")`) needs to use `pathname` instead of `router.asPath`. |

- [ ] **Step 2: Migrate shared element components**

| File | Changes |
|------|---------|
| `src/features/shared/components/Elements/Link/Link.tsx` | Remove `useRouter` from `next/router`. Remove `useLocale()` import. Replace the entire component with `Link` from `@/i18n/navigation` wrapped in MUI styling. next-intl `Link` auto-handles locale prefixing, so remove manual `/${locale}${href}` logic. Keep MUI `Link` as styling wrapper around next-intl `Link`. |
| `src/features/shared/components/Elements/Link/Breadcrumb.tsx` | `useTranslation("common")` → `useTranslations("common")`. Replace `useRouter` → `usePathname` from `@/i18n/navigation`. Replace `router.asPath` → `pathname`. |
| `src/features/shared/components/Elements/Control/LanguageSelector.tsx` | `useTranslation("common")` → `useTranslations("common")`. Also uses `useLocale()` hook (already migrated in Task 8). |
| `src/features/shared/components/Elements/Control/TimeZoneSelector.tsx` | Replace `import { useRouter } from "next/router"` → `import { useRouter } from "@/i18n/navigation"`. Replace `router.replace(router.asPath, undefined, { scroll: false })` → `router.replace(pathname, { scroll: false })` (add `usePathname` import). |
| `src/features/shared/components/Elements/Modal/VideoModal.tsx` | `useTranslation` → `useTranslations`. Replace `useRouter` from `next/router` → `usePathname` from `@/i18n/navigation`. Replace `router.asPath` → `pathname`. URL change detection: replace `router.events` or `router.asPath` dependency with `pathname` in useEffect. |
| `src/features/shared/components/Elements/Card/VideoCard.tsx` | `useTranslation` → `useTranslations` |
| `src/features/shared/components/Elements/Snackbar/AlertSnackbar.tsx` | `useTranslation` → `useTranslations` (if it uses translations) |
| `src/features/shared/components/Elements/Drawer/Drawer.tsx` | `useTranslation` → `useTranslations` |
| `src/features/shared/components/Elements/Button/ThemeToggleButton.tsx` | `useTranslation` → `useTranslations` |

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```
refactor(web): migrate shared components from next-i18next to next-intl
```

---

## Task 10: Migrate Legal Document Pages (privacy-policy, terms)

**Files:**
- Create: `src/app/[locale]/(content)/privacy-policy/page.tsx`
- Create: `src/app/[locale]/(content)/terms/page.tsx`
- Modify: `src/features/legal-documents/pages/PrivacyPolicyPage/presenter.tsx`
- Modify: `src/features/legal-documents/pages/TermsPage/presenter.tsx`
- Delete: `src/pages/privacy-policy.tsx`
- Delete: `src/pages/terms.tsx`
- Delete: `src/features/legal-documents/pages/PrivacyPolicyPage/container.tsx`
- Delete: `src/features/legal-documents/pages/TermsPage/container.tsx`

- [ ] **Step 1: Refactor PrivacyPolicyPagePresenter**

Remove the `t` prop. Call `useTranslations("privacy")` directly inside the component. Replace all `t("key", { returnObjects: true }) as Type` with `t.raw("key") as Type` (Pattern C). Remove `TFunction` import (Pattern D).

```typescript
// src/features/legal-documents/pages/PrivacyPolicyPage/presenter.tsx
"use client";

import { useTranslations } from "next-intl";
import type React from "react";
import { AgreementDocument } from "@/features/shared/components/Templates";
import { QA_LINK } from "@/lib/Const";

export const PrivacyPolicyPagePresenter: React.FC = () => {
  const t = useTranslations("privacy");

  return (
    <AgreementDocument>
      <h1>{t("pageTitle")}</h1>
      <p>{t("intro")}</p>

      <h2>{t("article1.title")}</h2>
      <p>{t("article1.paragraph1")}</p>
      <p>{t("article1.paragraph2")}</p>

      <h2>{t("article2.title")}</h2>
      <p>{t("article2.content")}</p>

      <h2>{t("article3.title")}</h2>
      <p>{t("article3.intro")}</p>
      <ol>
        {(t.raw("article3.purposes") as string[]).map((purpose) => (
          <li key={purpose}>{purpose}</li>
        ))}
      </ol>

      <h2>{t("article4.title")}</h2>
      <p>{t("article4.content")}</p>

      <h2>{t("article5.title")}</h2>
      <p>{t("article5.paragraph1")}</p>
      <p>{t("article5.paragraph2")}</p>
      <ol>
        {(
          t.raw("article5.links") as Array<{ text: string; url: string }>
        ).map((link) => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.text}
            </a>
          </li>
        ))}
      </ol>

      <h2>{t("article6.title")}</h2>
      <ol>
        {(t.raw("article6.items") as string[]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>

      <h2>{t("article7.title")}</h2>
      <p>
        {t("article7.content")}
        <a href={QA_LINK} target="_blank" rel="noopener noreferrer">
          {t("article7.linkText")}
        </a>
        {t("article7.suffix")}
      </p>
    </AgreementDocument>
  );
};
```

- [ ] **Step 2: Refactor TermsPagePresenter**

Same pattern as Step 1. Call `useTranslations("terms")` directly. Replace `returnObjects` → `t.raw()`. Remove `TFunction` import.

- [ ] **Step 3: Create privacy-policy page**

```typescript
// src/app/[locale]/(content)/privacy-policy/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { PrivacyPolicyPagePresenter } from "@/features/legal-documents/pages/PrivacyPolicyPage/presenter";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default function PrivacyPolicyPage() {
  return (
    <ContentLayout
      title="プライバシーポリシー"
      path="/privacy-policy"
      maxPageWidth="lg"
      padTop
    >
      <PrivacyPolicyPagePresenter />
    </ContentLayout>
  );
}
```

- [ ] **Step 4: Create terms page (same pattern)**

```typescript
// src/app/[locale]/(content)/terms/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { TermsPagePresenter } from "@/features/legal-documents/pages/TermsPage/presenter";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default function TermsPage() {
  return (
    <ContentLayout
      title="利用規約"
      path="/terms"
      maxPageWidth="lg"
      padTop
    >
      <TermsPagePresenter />
    </ContentLayout>
  );
}
```

- [ ] **Step 5: Delete old files**

Delete:
- `src/pages/privacy-policy.tsx`
- `src/pages/terms.tsx`
- `src/features/legal-documents/pages/PrivacyPolicyPage/container.tsx`
- `src/features/legal-documents/pages/TermsPage/container.tsx`
- `src/features/legal-documents/pages/PrivacyPolicyPage/serverSideProps.ts`
- `src/features/legal-documents/pages/TermsPage/serverSideProps.ts`

Update barrel exports (`index.ts`) in both feature directories to remove container re-exports.

- [ ] **Step 6: Commit**

```
feat(web): migrate legal document pages to App Router with next-intl
```

---

## Task 11: Migrate About Page

**Files:**
- Create: `src/app/[locale]/(content)/about/page.tsx`
- Modify: `src/features/about/pages/AboutPage/container.tsx` — remove `useRouter`, use `useLocale` from next-intl
- Delete: `src/pages/about.tsx`

- [ ] **Step 1: Read current serverSideProps**

Read `src/features/about/pages/AboutPage/serverSideProps.ts`. It fetches markdown sections via `getAllMarkdownSlugs("about")` + `getMarkdownContent(locale, "about", slug)`. Extract this logic into the page.tsx Server Component.

- [ ] **Step 2: Create App Router about page**

```typescript
// src/app/[locale]/(content)/about/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AboutPageContainer } from "@/features/about/pages/AboutPage/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import {
  getAllMarkdownSlugs,
  getMarkdownContent,
} from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const slugs = getAllMarkdownSlugs("about");
  const sections = (
    await Promise.all(
      slugs.map(async (slug) => {
        const content = await getMarkdownContent(locale, "about", slug);
        if (!content) return null;
        return {
          slug,
          title: content.metadata?.title ?? slug,
          content: content.content,
          order: content.metadata?.order ?? 0,
        };
      }),
    )
  )
    .filter(Boolean)
    .sort((a, b) => (a!.order as number) - (b!.order as number));

  return (
    <ContentLayout title="About" path="/about" maxPageWidth="md" padTop>
      <AboutPageContainer sections={sections} locale={locale} />
    </ContentLayout>
  );
}
```

- [ ] **Step 3: Update container for next-intl**

Modify `src/features/about/pages/AboutPage/container.tsx`:
- Remove `import { useRouter } from "next/router"` — locale is now a prop from the Server Component
- Accept `locale` as a prop instead of reading from router
- Remove `getLayout` static method (layout is now in page.tsx)
- Remove `NextPageWithLayout` type import → use `React.FC<Props>` (Pattern G)

- [ ] **Step 4: Delete old files**

Delete: `src/pages/about.tsx`, `src/features/about/pages/AboutPage/serverSideProps.ts`

- [ ] **Step 5: Verify build**

Run: `pnpm tsc --noEmit`

- [ ] **Step 6: Commit**

```
feat(web): migrate about page to App Router
```

---

## Task 12: Migrate Freechat Page

**Files:**
- Create: `src/app/[locale]/(content)/freechat/page.tsx`
- Delete: `src/pages/freechat.tsx`

- [ ] **Step 1: Read serverSideProps and create page**

Read `src/features/freechat/pages/FreechatPage/serverSideProps.ts`. It calls `fetchFreechatService()` and returns `freechats[]` with `lastUpdateTimestamp`. Move this into the Server Component:

```typescript
// src/app/[locale]/(content)/freechat/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FreechatPageContainer } from "@/features/freechat/pages/FreechatPage/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { fetchFreechatService } from "@/features/freechat/api/freechatService";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "freechat" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function FreechatPage() {
  const freechats = await fetchFreechatService();
  const lastUpdateTimestamp = Date.now();

  return (
    <ContentLayout
      title="Free Chat"
      path="/freechat"
      maxPageWidth="lg"
      padTop
      lastUpdateTimestamp={lastUpdateTimestamp}
    >
      <FreechatPageContainer freechats={freechats} />
    </ContentLayout>
  );
}
```

Note: Adapt `fetchFreechatService` call based on its actual signature. If it uses `req`, change to accept `sessionId?: string` (Pattern H). Also remove `serverSideTranslations` import/call and `translations` from return in `freechatService.ts`.

- [ ] **Step 2: Update container — remove getLayout (Pattern G), remove NextPageWithLayout, migrate useTranslation**

- [ ] **Step 3: Delete old files**

Delete: `src/pages/freechat.tsx`, `src/features/freechat/pages/FreechatPage/serverSideProps.ts`

- [ ] **Step 4: Commit**

```
feat(web): migrate freechat page to App Router
```

---

## Task 13: Migrate Site News Pages

**Files:**
- Create: `src/app/[locale]/(content)/site-news/page.tsx`
- Create: `src/app/[locale]/(content)/site-news/[id]/page.tsx`
- Modify: `src/features/site-news/pages/SiteNewsPage/container.tsx`
- Modify: `src/features/site-news/pages/SiteNewsDetailPage/container.tsx`
- Delete: `src/pages/site-news/index.tsx`
- Delete: `src/pages/site-news/[id].tsx`

- [ ] **Step 1: Read both serverSideProps**

- `SiteNewsPage/serverSideProps.ts` → calls `getAllSiteNewsItems(locale)`
- `SiteNewsDetailPage/serverSideProps.ts` → calls `getSiteNewsItem(locale, id)`, returns 404 if not found

- [ ] **Step 2: Create site-news list page**

```typescript
// src/app/[locale]/(content)/site-news/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SiteNewsPageContainer } from "@/features/site-news/pages/SiteNewsPage/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { getAllSiteNewsItems } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site-news" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function SiteNewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const siteNewsItems = await getAllSiteNewsItems(locale);

  return (
    <ContentLayout title="Site News" path="/site-news" maxPageWidth="md" padTop>
      <SiteNewsPageContainer siteNewsItems={siteNewsItems} />
    </ContentLayout>
  );
}
```

- [ ] **Step 3: Create site-news detail page**

```typescript
// src/app/[locale]/(content)/site-news/[id]/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteNewsDetailPageContainer } from "@/features/site-news/pages/SiteNewsDetailPage/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { getSiteNewsItem } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const siteNewsItem = await getSiteNewsItem(locale, id);
  if (!siteNewsItem) return { title: "Not Found" };
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${siteNewsItem.title}`,
    description: siteNewsItem.content?.slice(0, 160),
  };
}

export default async function SiteNewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const siteNewsItem = await getSiteNewsItem(locale, id);
  if (!siteNewsItem) notFound();

  return (
    <ContentLayout
      title={siteNewsItem.title}
      path={`/site-news/${id}`}
      maxPageWidth="md"
      padTop
    >
      <SiteNewsDetailPageContainer siteNewsItem={siteNewsItem} />
    </ContentLayout>
  );
}
```

- [ ] **Step 4: Update containers**

Both `SiteNewsPage/container.tsx` and `SiteNewsDetailPage/container.tsx`:
- Replace `import { useRouter } from "next/router"` → `import { useLocale } from "next-intl"`
- Replace `router.locale ?? DEFAULT_LOCALE` → `useLocale()`
- Replace `useTranslation("site-news")` → `useTranslations("site-news")`
- Remove `getLayout` static method (Pattern G)
- Remove `NextPageWithLayout` type import → use `React.FC<Props>`

Also update `SiteNewsPage/presenter.tsx`:
- Replace `import Link from "next/link"` → `import { Link } from "@/i18n/navigation"` for locale-aware routing

- [ ] **Step 5: Delete old files**

Delete: `src/pages/site-news/index.tsx`, `src/pages/site-news/[id].tsx`, both `serverSideProps.ts`

- [ ] **Step 6: Commit**

```
feat(web): migrate site-news pages to App Router
```

---

## Task 14: Migrate Clips Pages (4 pages)

**Files:**
- Create: `src/app/[locale]/(standalone)/clips/page.tsx`
- Create: `src/app/[locale]/(standalone)/clips/twitch/page.tsx`
- Create: `src/app/[locale]/(standalone)/clips/youtube/page.tsx`
- Create: `src/app/[locale]/(standalone)/clips/youtube/shorts/page.tsx`
- Modify: Clips containers and presenters
- Delete: `src/pages/clips/` directory

- [ ] **Step 1: Read all clips serverSideProps**

Read the three serverSideProps files:
- `ClipsHome/serverSideProps.ts` — fetches popular clips by period, returns `popularYoutubeClips`, `popularShortsClips`, `popularTwitchClips`, `vspoMembers`
- `YouTubeClips/serverSideProps.ts` — higher-order function with `{ type: "clip" | "short" }`, handles pagination (ITEMS_PER_PAGE=24), query params for sort/page
- `TwitchClips/serverSideProps.ts` — pagination, order, period filtering

- [ ] **Step 2: Create clips home page**

```typescript
// src/app/[locale]/(standalone)/clips/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ClipsHomeContainer } from "@/features/clips/pages/ClipsHome/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
// Import the data fetching logic from serverSideProps — adapt to async function

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clips" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function ClipsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { locale } = await params;
  const { period } = await searchParams;
  // Extract data fetching from ClipsHome/serverSideProps.ts
  // Call fetchClipService() with appropriate params
  // Pass data as props to container
  const data = await fetchClipsHomeData({ locale, period });
  const lastUpdateTimestamp = Date.now();

  return (
    <ContentLayout title="Clips" path="/clips" lastUpdateTimestamp={lastUpdateTimestamp}>
      <ClipsHomeContainer {...data} />
    </ContentLayout>
  );
}
```

Adapt `fetchClipsHomeData` from the existing `getServerSideProps` logic.

- [ ] **Step 3: Create youtube clips page**

Similar pattern. Note: `searchParams` replaces `router.query` for `page`, `orderKey`, `period` params.

```typescript
// src/app/[locale]/(standalone)/clips/youtube/page.tsx
// Pattern E: Extract serverSideProps logic into page body
// Pass clips, pagination, orderKey, currentPeriod to container
```

- [ ] **Step 4: Create youtube shorts page**

Same as Step 3 but with `{ type: "short" }`.

- [ ] **Step 5: Create twitch clips page**

Same pattern with TwitchClips serverSideProps logic.

- [ ] **Step 6: Migrate clips components to next-intl**

| File | Changes |
|------|---------|
| `src/features/clips/pages/ClipsHome/container.tsx` | Remove `getLayout`, remove `NextPageWithLayout` import (Pattern G). Change type to `React.FC<Props>`. |
| `src/features/clips/pages/YouTubeClips/container.tsx` | Same: remove `getLayout`, remove `NextPageWithLayout` import. Change type to `React.FC<Props>`. |
| `src/features/clips/pages/TwitchClips/container.tsx` | Same: remove `getLayout`, remove `NextPageWithLayout` import. Change type to `React.FC<Props>`. |
| `src/features/clips/components/containers/ClipTabsAndList.tsx` | Replace `useRouter` from `next/router` → `useRouter` from `@/i18n/navigation`. Replace `router.push` query param updates with `useSearchParams` + URLSearchParams pattern. |
| All clips presenters using `useTranslation` | `useTranslation(["clips", "common"])` → split into `useTranslations("clips")` + `useTranslations("common")` |

Also: Refactor `clipService.ts` — remove `serverSideTranslations` import/call, remove `translations` from return. If `fetchClipService` or `fetchSingleClipService` accepts `req`, change to accept `sessionId?: string` (Pattern H).

- [ ] **Step 7: Delete old files**

Delete: `src/pages/clips/` directory, all clips `serverSideProps.ts` files

- [ ] **Step 8: Commit**

```
feat(web): migrate clips pages to App Router
```

---

## Task 15: Migrate Schedule Page (Most Complex)

**Files:**
- Create: `src/app/[locale]/(content)/schedule/[status]/page.tsx`
- Modify: `src/features/schedule/pages/ScheduleStatus/container.tsx`
- Modify: `src/features/schedule/pages/ScheduleStatus/components/DateSearchDialogContainer.tsx`
- Modify: `src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/presenter.tsx`
- Modify: `src/features/schedule/hooks/useGroupedLivestreams.ts`
- Delete: `src/pages/schedule/[status].tsx`

- [ ] **Step 1: Read all schedule code thoroughly**

Read:
- `src/features/schedule/pages/ScheduleStatus/serverSideProps.ts` — complex data fetching with filters
- `src/features/schedule/pages/ScheduleStatus/container.tsx` — uses `router.events` for loading, `router.push` for tab navigation
- `src/features/schedule/pages/ScheduleStatus/components/DateSearchDialogContainer.tsx` — uses `router.push` with query params
- `src/features/schedule/pages/ScheduleStatus/components/LivestreamContent/presenter.tsx` — uses `router.push` for date navigation

- [ ] **Step 2: Create App Router schedule page**

```typescript
// src/app/[locale]/(content)/schedule/[status]/page.tsx
import { getCurrentUTCDate } from "@vspo-lab/dayjs";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { ScheduleStatusContainer } from "@/features/schedule/pages/ScheduleStatus/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { fetchSchedule } from "@/features/schedule/api/scheduleService";
import { DEFAULT_TIME_ZONE, SESSION_ID_COOKIE, TIME_ZONE_COOKIE } from "@/lib/Const";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; status: string }>;
}): Promise<Metadata> {
  const { locale, status } = await params;
  const t = await getTranslations({ locale, namespace: "streams" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  let title = "";
  switch (status) {
    case "all": title = t("titles.streamSchedule"); break;
    case "live": title = t("titles.live"); break;
    case "upcoming": title = t("titles.upcoming"); break;
    case "archive": title = t("titles.archive"); break;
    default: title = t("titles.dateStatus", { date: status }); break;
  }

  const description = t("description");
  return {
    title: `${tCommon("spodule")} | ${title}`,
    description,
  };
}

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; status: string }>;
  searchParams: Promise<{
    limit?: string;
    date?: string;
    memberType?: string;
    platform?: string;
  }>;
}) {
  const { locale, status } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();

  const timeZone = cookieStore.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;
  const sessionId = cookieStore.get(SESSION_ID_COOKIE)?.value;

  // Favorite search conditions from cookie
  let favoriteCondition = null;
  const favoriteCookie = cookieStore.get("favorite-search-condition")?.value;
  if (favoriteCookie) {
    try {
      favoriteCondition = JSON.parse(favoriteCookie);
    } catch {
      // Invalid JSON, ignore
    }
  }

  const startedDate =
    typeof query.date === "string"
      ? query.date
      : formatDate(getCurrentUTCDate(), "yyyy-MM-dd", { timeZone });

  const limit =
    typeof query.limit === "string"
      ? Number.parseInt(query.limit, 10)
      : status === "archive"
        ? 300
        : 50;

  const order = status === "archive" ? "desc" : "asc";

  const memberType =
    favoriteCondition?.memberType && favoriteCondition.memberType !== "vspo_all"
      ? favoriteCondition.memberType
      : typeof query.memberType === "string"
        ? query.memberType
        : undefined;

  const platform = favoriteCondition?.platform
    ? favoriteCondition.platform
    : typeof query.platform === "string"
      ? query.platform
      : undefined;

  // Adapt fetchSchedule to accept sessionId instead of req
  const schedule = await fetchSchedule({
    startedDate,
    limit,
    locale: locale ?? "ja",
    status: (status as "live" | "upcoming" | "archive" | "all") || "all",
    order: order as "asc" | "desc",
    timeZone,
    memberType,
    platform,
    sessionId,
  });

  const lastUpdateTimestamp = Date.now();
  const t = await getTranslations({ locale, namespace: "streams" });
  const footerMessage = t("membersOnlyStreamsHidden");

  let title = "";
  switch (status) {
    case "all": title = t("titles.streamSchedule"); break;
    case "live": title = t("titles.live"); break;
    case "upcoming": title = t("titles.upcoming"); break;
    case "archive": title = t("titles.archive"); break;
    default: title = t("titles.streamSchedule"); break;
  }

  return (
    <ContentLayout
      title={title}
      path={`/schedule/${status}`}
      lastUpdateTimestamp={lastUpdateTimestamp}
      footerMessage={footerMessage}
    >
      <ScheduleStatusContainer
        livestreams={schedule.livestreams || []}
        events={schedule.events}
        timeZone={timeZone}
        locale={locale}
        liveStatus={status}
        isArchivePage={status === "archive"}
      />
    </ContentLayout>
  );
}
```

**Important:** `fetchSchedule` currently accepts `req` for `getSessionId(req)`. Modify `fetchSchedule` to accept an optional `sessionId?: string` parameter instead. Update `src/features/schedule/api/scheduleService.ts` accordingly — replace the `req` parameter with `sessionId`, and use it directly instead of calling `getSessionId(req)`.

- [ ] **Step 3: Migrate schedule container — replace router.events with useTransition**

Modify `src/features/schedule/pages/ScheduleStatus/container.tsx`:

1. Replace `import { useRouter } from "next/router"` → `import { useRouter } from "@/i18n/navigation"`
2. Replace `router.events` loading state with `useTransition` (Pattern F):
   - `const [isLoading, startTransition] = useTransition();`
   - Wrap `router.push` in `startTransition(() => { ... })`
3. Remove `getLayout` static method

```typescript
// Key changes in container.tsx:
import { useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

// Replace the router.events useEffect with:
const [isLoading, startTransition] = useTransition();

const handleStatusFilterChange = (status: "live" | "upcoming" | "all") => {
  if (status === currentStatusFilter) return;
  setCurrentStatusFilter(status);
  startTransition(() => {
    router.push(`/schedule/${status}`);
  });
};
```

- [ ] **Step 4: Migrate DateSearchDialogContainer**

Replace `useRouter` from `next/router` → `useRouter` from `@/i18n/navigation`. Replace `router.push` with query params:

```typescript
// BEFORE:
router.push({
  pathname: router.pathname,
  query: { ...router.query, date, memberType, platform },
}, undefined, { shallow: false });

// AFTER:
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const router = useRouter();
const pathname = usePathname();
const searchParams = useSearchParams();

// Build new URL with updated search params:
const params = new URLSearchParams(searchParams.toString());
if (date) params.set("date", date);
if (memberType) params.set("memberType", memberType);
if (platform) params.set("platform", platform);
router.push(`${pathname}?${params.toString()}`);
```

- [ ] **Step 5: Migrate LivestreamContent presenter**

Replace `useRouter` → `useRouter` from `@/i18n/navigation`. Replace `useTranslation("schedule")` → `useTranslations("schedule")`.

For date navigation:
```typescript
// BEFORE:
router.push(`/schedule/${formattedDate}`, undefined, { shallow: false });

// AFTER:
router.push(`/schedule/${formattedDate}`);
```

- [ ] **Step 6: Migrate all remaining schedule components**

| File | Changes |
|------|---------|
| `src/features/schedule/hooks/useGroupedLivestreams.ts` | `useTranslation("schedule")` → `useTranslations("schedule")` |
| `src/features/schedule/pages/ScheduleStatus/presenter.tsx` | `useTranslation("streams")` → `useTranslations("streams")` |
| `src/features/schedule/pages/ScheduleStatus/components/DateSearchDialog.tsx` | `useTranslation("schedule")` → `useTranslations("schedule")` |
| `src/features/schedule/pages/ScheduleStatus/components/EventsContent/presenter.tsx` | `useTranslation("streams")` → `useTranslations("streams")` |

Also: Refactor `scheduleService.ts` — remove `serverSideTranslations` import/call, remove `translations` from return. Change `req` parameter to `sessionId?: string` (Pattern H).

- [ ] **Step 7: Delete old files**

Delete: `src/pages/schedule/[status].tsx`, `src/features/schedule/pages/ScheduleStatus/serverSideProps.ts`

- [ ] **Step 8: Verify build**

Run: `pnpm tsc --noEmit`

- [ ] **Step 9: Commit**

```
feat(web): migrate schedule page to App Router
```

---

## Task 16: Migrate Multiview Page

**Files:**
- Create: `src/app/[locale]/(standalone)/multiview/page.tsx`
- Modify: Multiview components — `useTranslation(["multiview", "common"])` → split calls
- Delete: `src/pages/multiview.tsx`

- [ ] **Step 1: Read serverSideProps and create page**

Read `src/features/multiview/pages/MultiviewPage/serverSideProps.ts`. It calls `fetchMultiviewService()`. Create the page:

```typescript
// src/app/[locale]/(standalone)/multiview/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MultiviewPageContainer } from "@/features/multiview/pages/MultiviewPage/container";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
import { fetchMultiviewService } from "@/features/multiview/api/multiviewService";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "multiview" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${tCommon("spodule")} | ${t("title")}`,
    description: t("description"),
  };
}

export default async function MultiviewPage() {
  const livestreams = await fetchMultiviewService();
  const lastUpdateTimestamp = Date.now();

  return (
    <ContentLayout
      title="Multiview"
      path="/multiview"
      lastUpdateTimestamp={lastUpdateTimestamp}
    >
      <MultiviewPageContainer livestreams={livestreams} />
    </ContentLayout>
  );
}
```

- [ ] **Step 2: Migrate multiview container and components**

Container: Remove `getLayout`, remove `NextPageWithLayout` import (Pattern G). Change type to `React.FC<Props>`.

Migrate all multiview components using `useTranslation`:

| File | Changes |
|------|---------|
| `src/features/multiview/pages/MultiviewPage/container.tsx` | Remove `getLayout`, `NextPageWithLayout`. |
| `src/features/multiview/pages/MultiviewPage/presenter.tsx` | `useTranslation(["multiview", "common"])` → `useTranslations("multiview")` + `useTranslations("common")` |
| `src/features/multiview/components/UrlInput.tsx` | `useTranslation("multiview")` → `useTranslations("multiview")` |
| `src/features/multiview/components/StreamSelectorPresenter.tsx` | Same |
| `src/features/multiview/components/VideoPlayerPresenter.tsx` | Same |
| `src/features/multiview/components/ChatCellPresenter.tsx` | Same |
| `src/features/multiview/components/MultiviewGridPresenter.tsx` | Same |
| `src/features/multiview/components/SimplePlaybackControlsPresenter.tsx` | Same |
| `src/features/multiview/components/LayoutSelectorPresenter.tsx` | Same |
| Any other multiview files using `useTranslation` | Same pattern |

Also: Refactor `multiviewService.ts` — remove `serverSideTranslations` import/call. If it accepts `req`, change to `sessionId` (Pattern H).

- [ ] **Step 3: Delete old files**

Delete: `src/pages/multiview.tsx`, `serverSideProps.ts`

- [ ] **Step 4: Commit**

```
feat(web): migrate multiview page to App Router
```

---

## Task 17: Delete Pages Router Artifacts

**Files:**
- Delete: `src/pages/_app.tsx`
- Delete: `src/pages/_document.tsx`
- Delete: `src/pages/` directory (should be empty now)
- Delete: `src/lib/i18n/cf-assets.ts`
- Delete: `src/lib/i18n/server.ts`
- Delete: `src/lib/i18n.ts`
- Delete: `src/features/shared/components/Head/Head.tsx`
- Delete: All remaining `serverSideProps.ts` files
- Modify: `src/lib/utils.ts` — remove `getInitializedI18nInstance` function

- [ ] **Step 1: Uninstall old i18n packages**

```bash
pnpm remove next-i18next i18next react-i18next
```

- [ ] **Step 2: Uninstall next-pwa**

```bash
pnpm remove next-pwa
```

- [ ] **Step 3: Delete all listed files**

Delete each file listed above. For `src/lib/utils.ts`, remove only `getInitializedI18nInstance` and its i18next-related imports — keep the other utility functions (`groupBy`, `getSiteNewsTagColor`, `formatDate`, `getSessionId`, `getCookieValue`).

- [ ] **Step 4: Verify no imports reference deleted files**

Run: `pnpm tsc --noEmit`

Fix any broken imports (e.g., barrel exports in `index.ts` files that re-export deleted modules).

- [ ] **Step 5: Commit**

```
refactor(web): remove Pages Router artifacts and old i18n packages
```

---

## Task 18: Migrate PWA (next-pwa → @serwist/next)

**Files:**
- Modify: `next.config.js`
- Create: `src/app/sw.ts` (service worker entry)

- [ ] **Step 1: Configure @serwist/next in next.config.js**

Add `withSerwist` wrapper around the config:

```javascript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

// Chain with next-intl:
export default withSerwist(withNextIntl(nextConfig));
```

- [ ] **Step 2: Create service worker entry**

```typescript
// src/app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

- [ ] **Step 3: Verify build**

Run: `pnpm cf:build`

- [ ] **Step 4: Commit**

```
feat(web): migrate PWA from next-pwa to @serwist/next
```

---

## Task 19: Sitemap + Error Pages

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/not-found.tsx`
- Create: `src/app/[locale]/error.tsx`
- Create: `src/app/[locale]/loading.tsx`
- Delete: `next-sitemap.config.js`

- [ ] **Step 1: Create App Router sitemap**

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const BASE_URL = "https://www.vspo-schedule.com";
const locales = ["en", "cn", "ko", "tw"];

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: "/schedule/all", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/clips", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/clips/youtube", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/clips/twitch", changeFrequency: "daily" as const, priority: 0.8 },
    {
      path: "/clips/youtube/shorts",
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ];

  return pages.flatMap((page) => [
    {
      url: `${BASE_URL}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    },
    ...locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
  ]);
}
```

- [ ] **Step 2: Uninstall next-sitemap and clean up**

```bash
pnpm remove next-sitemap
```

Delete: `next-sitemap.config.js`

In `package.json`, change `"build": "next build && next-sitemap"` → `"build": "next build"` (if next-sitemap is in the build script).

- [ ] **Step 3: Create error pages**

```typescript
// src/app/not-found.tsx
export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h1>404 - Page Not Found</h1>
    </div>
  );
}
```

```typescript
// src/app/[locale]/error.tsx
"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <h1>Something went wrong</h1>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
```

```typescript
// src/app/[locale]/loading.tsx
export default function Loading() {
  return null;
}
```

- [ ] **Step 4: Commit**

```
feat(web): add sitemap, error pages; remove next-sitemap
```

---

## Task 20: Final Cleanup + Build Verification

- [ ] **Step 1: Run quality checks**

```bash
cd service/vspo-schedule/v2/web
./scripts/post-edit-check.sh
```

This runs Biome lint, TypeScript type check, and knip.

- [ ] **Step 2: Fix any lint/type errors**

Common issues:
- Unused imports from deleted modules
- Missing `"use client"` directives on components using hooks
- Type mismatches from changed function signatures

- [ ] **Step 2.5: Update test files**

Test files that mock `next/router` and/or `next-i18next` need updating:
- Replace `vi.mock("next/router")` → mock `@/i18n/navigation` and `next-intl`
- Replace `useTranslation` mocks → `useTranslations` mocks
- Search for all test files: `grep -r "next/router\|next-i18next\|useTranslation" --include="*.test.*" src/`
- Update each mock to use the new module paths

- [ ] **Step 3: Verify full build**

```bash
pnpm cf:build
```

- [ ] **Step 4: Local preview — test all pages**

```bash
pnpm cf:preview
```

Test matrix (each page × default locale and `/en`):

| Page | Default | English |
|------|---------|---------|
| Schedule | `/schedule/all` | `/en/schedule/all` |
| Clips | `/clips` | `/en/clips` |
| Clips YouTube | `/clips/youtube` | `/en/clips/youtube` |
| Clips Twitch | `/clips/twitch` | `/en/clips/twitch` |
| Clips Shorts | `/clips/youtube/shorts` | `/en/clips/youtube/shorts` |
| Site News | `/site-news` | `/en/site-news` |
| About | `/about` | `/en/about` |
| Freechat | `/freechat` | `/en/freechat` |
| Multiview | `/multiview` | `/en/multiview` |
| Privacy Policy | `/privacy-policy` | `/en/privacy-policy` |
| Terms | `/terms` | `/en/terms` |
| Root redirect | `/` → `/schedule/all` | |
| Sitemap | `/sitemap.xml` | |

Verify:
- All pages render correctly
- MUI styles render server-side (no FOUC)
- Locale switching works
- Bottom navigation shows correct active state
- Header/footer display properly
- Schedule tab switching works with loading overlay
- Clips pagination/sorting works
- Date search dialog works

- [ ] **Step 5: Measure bundle size**

```bash
ls -la .open-next/worker.js
```

Check: Compressed size < 10 MiB.

- [ ] **Step 6: Commit any final fixes**

```
chore(web): final cleanup after App Router migration
```
