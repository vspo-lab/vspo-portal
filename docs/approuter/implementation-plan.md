# App Router Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the vspo-schedule Next.js 15 frontend from Pages Router to App Router while preserving all UI/UX, deployed on Cloudflare Workers via OpenNEXT.

**Architecture:** Hybrid migration — build infrastructure first, validate with 2 pilot pages on CF Workers, then migrate i18n (next-intl) and remaining 10 pages together, finish with PWA (@serwist/next). Container logic moves to Server Component `page.tsx`, presenters stay as `"use client"` components.

**Tech Stack:** Next.js 15.5.14, @opennextjs/cloudflare, next-intl, MUI v7 + Emotion, @serwist/next, Cloudflare Workers

**Spec:** `docs/approuter/design.md`, `docs/approuter/phases.md`, `docs/approuter/i18n-migration.md`, `docs/approuter/mui-app-router.md`, `docs/approuter/cloudflare-barriers.md`

**Working directory:** `service/vspo-schedule/v2/web/` (all paths below are relative to this)

---

**PR structure note:** The spec defines 4 PRs but this plan uses 3: PR1 combines Phase 1+2 (infrastructure + pilot validation) since pilot validation is a low-risk verification of the infrastructure work. The Go/No-Go gate (Task 5) still exists within PR1 before merging. PR2 = Phase 3+4, PR3 = Phase 5.

**Important: `_app.tsx` does NOT run for App Router pages.** Code in `_app.tsx` (including `appWithTranslation`, `import "@/lib/i18n"`, and the provider tree) is only executed for `pages/` routes. App Router pages in `app/` get their providers from `app/layout.tsx` and do not have access to the i18next runtime.

## PR 1 — Phase 1: Infrastructure + Phase 2: Pilot Validation

### Task 1: Create AppProviders Client Component

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
          <VideoModalContextProvider>
            {children}
          </VideoModalContextProvider>
        </TimeZoneContextProvider>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
```

Note: `ThemeModeProvider` (in `src/context/Theme.tsx`) already wraps `ThemeProvider` + `CssBaseline`. Do NOT duplicate them.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```
feat(web): add AppProviders client component for App Router
```

---

### Task 2: Create Root Layout (`app/layout.tsx`)

**Files:**
- Create: `src/app/layout.tsx`

- [ ] **Step 1: Create root layout**

Migrate from `_document.tsx` and `_app.tsx`:
- Global CSS imports (from `_app.tsx` lines 1-3): `@fortawesome/fontawesome-svg-core/styles.css`, `globals.css`, `normalize.css`
- FontAwesome `config.autoAddCss = false` (from `_app.tsx` line 16)
- `InitColorSchemeScript` (from `_document.tsx` line 61)
- Global `<Head>` tags (from `_document.tsx` lines 27-58): preconnect links, keywords, og:type, og:image, twitter:card, robots, manifest, apple-touch-icon, theme-color
- Google Ads script (from `_document.tsx` lines 33-38, production only)
- `GoogleAnalytics` component (from `_app.tsx` line 41)
- `AppProviders` wrapping children

```typescript
// src/app/layout.tsx
import "@fortawesome/fontawesome-svg-core/styles.css";
import "@/styles/globals.css";
import "@/styles/normalize.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Metadata } from "next";
import Script from "next/script";
import { AppProviders } from "@/components/AppProviders";
import { GoogleAnalytics } from "@/features/shared/components/Elements";

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
  return (
    <html lang="ja" suppressHydrationWarning>
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
        <AppProviders>{children}</AppProviders>
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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```
feat(web): add App Router root layout with providers and global metadata
```

---

### Task 3: Create Locale Layout and Route Groups

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/(content)/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create root page redirect**

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/schedule/all");
}
```

- [ ] **Step 2: Create locale layout (placeholder — next-intl added in Phase 3)**

```typescript
// src/app/[locale]/layout.tsx
export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Create (content) route group layout with ContentLayout**

Note: ContentLayout requires per-page props (title, path, etc.), so it cannot be used at the route group level. Each page will wrap its content in ContentLayout individually, matching the current per-page `getLayout` pattern. The `(content)` group layout is a simple passthrough.

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

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 5: Commit**

```
feat(web): add locale layout, route groups, and root redirect
```

---

### Task 4: Create Pilot Pages (privacy-policy, terms)

**Files:**
- Create: `src/app/[locale]/(content)/privacy-policy/page.tsx`
- Create: `src/app/[locale]/(content)/terms/page.tsx`
- Delete: `src/pages/privacy-policy.tsx`
- Delete: `src/pages/terms.tsx`

Reference the existing serverSideProps pattern:
- `src/features/legal-documents/pages/PrivacyPolicyPage/serverSideProps.ts` — uses `getStaticProps`, calls `serverSideTranslations(locale, ["common", "privacy"])`, then renders `PrivacyPolicyPageContainer`
- `src/features/legal-documents/pages/TermsPage/serverSideProps.ts` — same pattern with `"terms"` namespace

- [ ] **Step 1: Create privacy-policy page**

For Phase 2, bypass i18n (next-intl not installed yet). Import the presenter directly and pass a minimal `t` function or hardcode values temporarily.

```typescript
// src/app/[locale]/(content)/privacy-policy/page.tsx
import type { Metadata } from "next";
import { PrivacyPolicyPageContainer } from "@/features/legal-documents/pages/PrivacyPolicyPage/container";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "すぽじゅーる | プライバシーポリシー",
  description: "プライバシーポリシー",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyPageContainer />;
}
```

Note: `PrivacyPolicyPageContainer` uses `useTranslation("privacy")` from `next-i18next`. During Phase 2, the `pages/` i18n system (including `appWithTranslation` in `_app.tsx`) is still active, but App Router pages don't go through `_app.tsx`. The container's `useTranslation` call will fail. Two options:
1. Create a temporary wrapper that provides hardcoded translations
2. Refactor container to accept `t` as a prop (already partially done — the presenter accepts `t`)

Use option 2: Import the presenter directly and pass translations inline.

```typescript
// src/app/[locale]/(content)/privacy-policy/page.tsx
import type { Metadata } from "next";
import { PrivacyPolicyPagePresenter } from "@/features/legal-documents/pages/PrivacyPolicyPage/presenter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "すぽじゅーる | プライバシーポリシー",
  description: "プライバシーポリシー",
};

export default function PrivacyPolicyPage() {
  // Temporary: bypass i18n container, render presenter directly
  // Full i18n integration happens in Phase 3 (Task 7)
  const t = ((key: string) => key) as unknown as Parameters<
    typeof PrivacyPolicyPagePresenter
  >[0]["t"];
  return <PrivacyPolicyPagePresenter t={t} />;
}
```

- [ ] **Step 2: Create terms page (same pattern)**

```typescript
// src/app/[locale]/(content)/terms/page.tsx
import type { Metadata } from "next";
import { TermsPagePresenter } from "@/features/legal-documents/pages/TermsPage/presenter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "すぽじゅーる | 利用規約",
  description: "利用規約",
};

export default function TermsPage() {
  const t = ((key: string) => key) as unknown as Parameters<
    typeof TermsPagePresenter
  >[0]["t"];
  return <TermsPagePresenter t={t} />;
}
```

- [ ] **Step 3: Delete pages/ counterparts**

Delete `src/pages/privacy-policy.tsx` and `src/pages/terms.tsx`.

- [ ] **Step 4: Verify build**

Run: `pnpm cf:build`
Expected: Build succeeds. Both `app/` routes and remaining `pages/` routes coexist.

- [ ] **Step 5: Preview locally**

Run: `pnpm cf:preview`
Verify: Navigate to `/privacy-policy` and `/terms` — they render (with raw translation keys, which is expected).
Verify: Navigate to `/schedule/all` — still works via pages/ router.

- [ ] **Step 6: Commit**

```
feat(web): add pilot App Router pages (privacy-policy, terms)
```

---

### Task 5: Cloudflare Workers Validation

**Files:** None (verification only)

- [ ] **Step 1: Measure bundle size**

Run: `pnpm cf:build && ls -la .open-next/worker.js`
Check: Compressed size < 10 MiB.

If available: `cat .open-next/worker.js.meta.json | jq '.outputs'`

- [ ] **Step 2: Local preview smoke test**

Run: `pnpm cf:preview`
Check all items:
1. `/privacy-policy` renders without 500 errors
2. `/terms` renders without 500 errors
3. `/schedule/all` (pages/ route) still works
4. MUI styles render (no unstyled flash)
5. `/en/privacy-policy` responds (locale routing)

- [ ] **Step 3: Document baseline TTFB**

Run: `curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\n" http://localhost:8787/privacy-policy`
Record the value for comparison after full migration.

- [ ] **Step 4: Commit validation results as a note**

```
docs(web): record Phase 2 pilot validation results
```

---

## PR 2 — Phase 3 + Phase 4: i18n Migration + Bulk Page Migration

**Critical:** These phases ship together because removing `i18n` from `next.config.js` breaks all `pages/` routes.

### Task 6: Install next-intl and Create i18n Infrastructure

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/navigation.ts`

- [ ] **Step 1: Install next-intl**

Run: `pnpm add next-intl`

- [ ] **Step 2: Create routing config**

```typescript
// src/i18n/routing.ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "cn", "tw", "ko"],
  defaultLocale: "ja",
  localePrefix: "as-needed",
});
```

- [ ] **Step 3: Create request config with Cloudflare Assets loader**

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
  // Note: getCloudflareEnvironmentContext().cfEnv exposes APP_WORKER, not ASSETS.
  // Access ASSETS from the raw Cloudflare context instead.
  const { context, isValid } = await getCloudflareEnvironmentContext();
  const assets = isValid && !context.err
    ? (context.val?.env as unknown as { ASSETS?: { fetch(url: string): Promise<Response> } })
        ?.ASSETS
    : undefined;

  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, await loadNamespace(locale, ns, assets)]),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;

  const messages = await loadMessages(locale);

  return { locale, messages };
});
```

- [ ] **Step 4: Create navigation wrappers**

```typescript
// src/i18n/navigation.ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 6: Commit**

```
feat(web): add next-intl infrastructure (routing, request config, navigation)
```

---

### Task 7: Rewrite Middleware and Update Locale Layout

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Rewrite middleware**

Replace the custom locale detection with `next-intl` middleware. Preserve `setTimeZone` and `setSessionId` logic.

`next-intl` middleware handles locale detection and sets the `NEXT_LOCALE` cookie automatically, replacing the custom `setLocale` function and `LOCALE_COOKIE` handling. The `LOCALE_COOKIE` import is no longer needed.

Replace the full content of `src/middleware.ts`:

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
  const timeZone = req.cookies.get(TIME_ZONE_COOKIE)?.value ?? DEFAULT_TIME_ZONE;
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

- [ ] **Step 2: Update locale layout with NextIntlClientProvider**

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 3: Commit**

```
feat(web): rewrite middleware for next-intl and wire locale layout
```

---

### Task 8: Update next.config.js

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Remove i18n block, scrollRestoration, next-pwa, and add /default redirect**

Key changes to `next.config.js`:
1. Remove `import ci18n from "./next-i18next.config.js"` (line 2)
2. Remove the entire `withPWA` wrapper and `nextPWA` import (lines 1, 3-21) — PWA will be re-added in Phase 5
3. Remove `i18n: { ... }` block (lines ~71-75)
4. Remove `scrollRestoration: true` from `experimental` (line ~41)
5. Add `/default/:path*` redirect to `redirects()`
6. Export `nextConfig` directly (not wrapped in `withPWA`)

The result should be a clean config without PWA and i18n blocks. Keep: `reactStrictMode`, `transpilePackages`, `compiler.emotion`, `experimental.reactCompiler`, `serverExternalPackages`, `images`, `skipMiddlewareUrlNormalize`, `redirects` (with added `/default` redirect).

- [ ] **Step 2: Delete next-i18next.config.js**

Delete: `next-i18next.config.js`

- [ ] **Step 3: Add next-intl plugin to next.config.js**

Add `import createNextIntlPlugin from "next-intl/plugin"` and wrap the config:

```javascript
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
// ... existing config ...
export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Verify build**

Run: `pnpm cf:build`

- [ ] **Step 5: Commit**

```
feat(web): update next.config for App Router (remove i18n block, add next-intl plugin)
```

---

### Task 9: Update Pilot Pages with next-intl

**Files:**
- Modify: `src/app/[locale]/(content)/privacy-policy/page.tsx`
- Modify: `src/app/[locale]/(content)/terms/page.tsx`

- [ ] **Step 1: Update privacy-policy with next-intl**

```typescript
// src/app/[locale]/(content)/privacy-policy/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PrivacyPolicyPageContainer } from "@/features/legal-documents/pages/PrivacyPolicyPage/container";

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
  return <PrivacyPolicyPageContainer />;
}
```

Note: `PrivacyPolicyPageContainer` still uses `useTranslation("privacy")` from next-i18next. It must be updated to use `useTranslations("privacy")` from next-intl. Do that now:

- [ ] **Step 2: Update PrivacyPolicyPageContainer to use next-intl**

Modify `src/features/legal-documents/pages/PrivacyPolicyPage/container.tsx`:

```typescript
import { useTranslations } from "next-intl";
import type * as React from "react";
import { PrivacyPolicyPagePresenter } from "./presenter";

export const PrivacyPolicyPageContainer: React.FC = () => {
  const t = useTranslations("privacy");
  return <PrivacyPolicyPagePresenter t={t} />;
};
```

- [ ] **Step 3: Update terms page and container (same pattern)**

Update `src/app/[locale]/(content)/terms/page.tsx` with `generateMetadata` using `getTranslations`.

Update `src/features/legal-documents/pages/TermsPage/container.tsx` to use `useTranslations("terms")`.

- [ ] **Step 4: Verify build**

Run: `pnpm cf:build`

- [ ] **Step 5: Commit**

```
feat(web): wire next-intl into pilot pages
```

---

### Task 10: Migrate Legal Document Presenters (returnObjects → next-intl)

**Files:**
- Modify: `src/features/legal-documents/pages/PrivacyPolicyPage/presenter.tsx`
- Modify: `src/features/legal-documents/pages/TermsPage/presenter.tsx`

The presenters use `t("key", { returnObjects: true })` which is an **i18next-specific feature**. `next-intl` does not support `returnObjects`. Instead, use `t.raw("key")` to get raw values (arrays/objects) from translations.

Also, the presenters import `TFunction` from `next-i18next` which will break after uninstalling the package.

- [ ] **Step 1: Update PrivacyPolicyPagePresenter**

Replace `import type { TFunction } from "next-i18next"` with a generic type. Replace all `t("key", { returnObjects: true }) as Type` with `t.raw("key") as Type`.

```typescript
// src/features/legal-documents/pages/PrivacyPolicyPage/presenter.tsx
import type React from "react";
import { useTranslations } from "next-intl";
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
        {(t.raw("article5.links") as Array<{ text: string; url: string }>).map(
          (link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
            </li>
          ),
        )}
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

Since the presenter now calls `useTranslations` directly, the container becomes unnecessary. The page can render the presenter directly.

- [ ] **Step 2: Apply same pattern to TermsPagePresenter**

Replace `TFunction` import, `returnObjects` calls → `t.raw()`, and move `useTranslations` into the presenter.

- [ ] **Step 3: Simplify the page.tsx files**

Update `src/app/[locale]/(content)/privacy-policy/page.tsx` and `terms/page.tsx` to render the presenter directly (no container needed):

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
    <ContentLayout title="プライバシーポリシー" path="/privacy-policy" maxPageWidth="lg" padTop>
      <PrivacyPolicyPagePresenter />
    </ContentLayout>
  );
}
```

- [ ] **Step 4: Delete container files (now unused)**

Delete `src/features/legal-documents/pages/PrivacyPolicyPage/container.tsx` and `src/features/legal-documents/pages/TermsPage/container.tsx`.

- [ ] **Step 5: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 6: Commit**

```
refactor(web): migrate legal document presenters to next-intl (returnObjects → t.raw)
```

---

### Task 11: Refactor ContentLayout (Remove CustomHead)

**Files:**
- Modify: `src/features/shared/components/Layout/ContentLayout.tsx`

- [ ] **Step 1: Remove CustomHead from ContentLayout**

In `src/features/shared/components/Layout/ContentLayout.tsx`:
- Remove the `import { CustomHead } from "../Head/Head"` line
- Remove the `<CustomHead ... />` JSX (around line 100)
- Remove `headTitle` and `canonicalPath` from `ContentLayoutProps` type (no longer needed; metadata handled by `generateMetadata`)
- Keep `title`, `description`, `path` props as they're still used by Header

Note: The `(content)/layout.tsx` is already a passthrough (set up in Task 3). Each page wraps its own content in ContentLayout individually, passing its own title. This matches the current per-page `getLayout` pattern.

- [ ] **Step 2: Commit**

```
refactor(web): remove CustomHead from ContentLayout, prepare for App Router metadata
```

---

### Task 11: Refactor useLocale Hook

**Files:**
- Modify: `src/hooks/locale.ts`

- [ ] **Step 1: Rewrite useLocale to use next-intl**

Replace the content of `src/hooks/locale.ts`:

```typescript
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

### Task 12: Migrate Shared Components (useTranslation → useTranslations, next/router → next-intl navigation)

**Files:** 36 files need `useTranslation` updates, 16 files need `next/router` updates. Many overlap. Update them by feature area.

- [ ] **Step 1: Migrate shared layout components**

Files:
- `src/features/shared/components/Layout/Header.tsx` — `useTranslation` → `useTranslations`
- `src/features/shared/components/Layout/Footer.tsx` — same
- `src/features/shared/components/Layout/Navigation.tsx` — same + `useRouter` from `next/router` → `useRouter` from `@/i18n/navigation`

- [ ] **Step 2: Migrate shared element components**

Files:
- `src/features/shared/components/Elements/Control/LanguageSelector.tsx` — `useTranslation` → `useTranslations`
- `src/features/shared/components/Elements/Control/TimeZoneSelector.tsx` — same + `useRouter` → next-intl
- `src/features/shared/components/Elements/Modal/VideoModal.tsx` — same + `useRouter` → next-intl
- `src/features/shared/components/Elements/Card/VideoCard.tsx` — `useTranslation` → `useTranslations`
- `src/features/shared/components/Elements/Snackbar/AlertSnackbar.tsx` — same
- `src/features/shared/components/Elements/Drawer/Drawer.tsx` — same
- `src/features/shared/components/Elements/Button/ThemeToggleButton.tsx` — same
- `src/features/shared/components/Elements/Link/Breadcrumb.tsx` — same + `useRouter` → next-intl
- `src/features/shared/components/Elements/Link/Link.tsx` — `useRouter` → next-intl `Link`

For each file:
1. Replace `import { useTranslation } from "next-i18next"` → `import { useTranslations } from "next-intl"`
2. Replace `const { t } = useTranslation("ns")` → `const t = useTranslations("ns")`
3. Replace `import { useRouter } from "next/router"` → `import { useRouter } from "@/i18n/navigation"` (or `usePathname`, `useLocale` as needed)
4. Replace `router.locale` → `useLocale()` from `next-intl`
5. Replace `router.asPath` → `usePathname()`

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```
refactor(web): migrate shared components from next-i18next to next-intl
```

---

### Task 13: Migrate About Page

**Files:**
- Create: `src/app/[locale]/(content)/about/page.tsx`
- Modify: `src/features/about/pages/AboutPage/container.tsx` — `useRouter` → next-intl
- Delete: `src/pages/about.tsx`

- [ ] **Step 1: Read the current about serverSideProps**

Check `src/features/about/pages/AboutPage/serverSideProps.ts` for data fetching logic. Move that logic into the page's async Server Component.

- [ ] **Step 2: Create App Router about page**

```typescript
// src/app/[locale]/(content)/about/page.tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AboutPageComponent from "@/features/about/pages/AboutPage";
import { ContentLayout } from "@/features/shared/components/Layout/ContentLayout";
// Import the data fetching logic from the existing serverSideProps
// Adapt getServerSideProps to a plain async function

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
  // TODO: Extract data fetching logic from
  // src/features/about/pages/AboutPage/serverSideProps.ts
  // into a standalone async function (e.g., fetchAboutSections(locale))
  // and call it here. The key pattern:
  //   1. Read the existing getServerSideProps body
  //   2. Move the fetch logic into a plain async function
  //   3. Call it from this Server Component
  const sections = await fetchAboutSections(locale);

  return (
    <ContentLayout title="About" path="/about" maxPageWidth="md" padTop>
      <AboutPageComponent sections={sections} />
    </ContentLayout>
  );
}
```

**Implementation note:** Read `src/features/about/pages/AboutPage/serverSideProps.ts` to understand the exact data fetching. Extract the logic (minus `serverSideTranslations` which is no longer needed) into a reusable async function. The `cookies()` API from `next/headers` provides access to timezone and session cookies that were previously in `context.req`.

- [ ] **Step 3: Update about container for next-intl**

Migrate `useTranslation` → `useTranslations` and `useRouter` → next-intl navigation in `src/features/about/pages/AboutPage/container.tsx`.

- [ ] **Step 4: Delete `src/pages/about.tsx`**

- [ ] **Step 5: Verify build**

Run: `pnpm cf:build`

- [ ] **Step 6: Commit**

```
feat(web): migrate about page to App Router
```

---

### Task 14: Migrate Freechat Page

**Files:**
- Create: `src/app/[locale]/(content)/freechat/page.tsx`
- Delete: `src/pages/freechat.tsx`

Same pattern as Task 13. Read `src/features/freechat/pages/FreechatPage/serverSideProps.ts`, extract data fetching into the async Server Component page.

- [ ] **Step 1: Create App Router freechat page**
- [ ] **Step 2: Delete `src/pages/freechat.tsx`**
- [ ] **Step 3: Verify build**
- [ ] **Step 4: Commit**

```
feat(web): migrate freechat page to App Router
```

---

### Task 15: Migrate Site News Pages

**Files:**
- Create: `src/app/[locale]/(content)/site-news/page.tsx`
- Create: `src/app/[locale]/(content)/site-news/[id]/page.tsx`
- Modify: `src/features/site-news/pages/*/container.tsx` — `useRouter` + `useTranslation` → next-intl
- Delete: `src/pages/site-news/index.tsx` (if it exists at the pages level — check actual structure)
- Delete: `src/pages/site-news/[id].tsx`

- [ ] **Step 1: Read existing serverSideProps for both pages**
- [ ] **Step 2: Create App Router pages**
- [ ] **Step 3: Migrate containers to next-intl**
- [ ] **Step 4: Delete pages/ counterparts**
- [ ] **Step 5: Verify build**
- [ ] **Step 6: Commit**

```
feat(web): migrate site-news pages to App Router
```

---

### Task 16: Migrate Clips Pages (4 pages)

**Files:**
- Create: `src/app/[locale]/(standalone)/clips/page.tsx`
- Create: `src/app/[locale]/(standalone)/clips/twitch/page.tsx`
- Create: `src/app/[locale]/(standalone)/clips/youtube/page.tsx`
- Create: `src/app/[locale]/(standalone)/clips/youtube/shorts/page.tsx`
- Modify: Clips presenters and containers — `useTranslation` + `useRouter` → next-intl
- Delete: `src/pages/clips/` directory

Multi-namespace migration: Clips components use `useTranslation(["clips", "common"])`. Split to:
```typescript
const tClips = useTranslations("clips");
const tCommon = useTranslations("common");
```

- [ ] **Step 1: Read existing serverSideProps for all 4 clips pages**
- [ ] **Step 2: Create App Router pages (standalone group, no ContentLayout)**
- [ ] **Step 3: Migrate clips components to next-intl**
- [ ] **Step 4: Delete pages/ counterparts**
- [ ] **Step 5: Verify build**
- [ ] **Step 6: Commit**

```
feat(web): migrate clips pages to App Router
```

---

### Task 17: Migrate Schedule Page (Most Complex)

**Files:**
- Create: `src/app/[locale]/(content)/schedule/[status]/page.tsx`
- Modify: `src/features/schedule/pages/ScheduleStatus/container.tsx` — heavy `useRouter` usage
- Modify: `src/features/schedule/pages/ScheduleStatus/components/*` — `useTranslation` + `useRouter`
- Modify: `src/features/schedule/hooks/useGroupedLivestreams.ts` — `useTranslation`
- Delete: `src/pages/schedule/[status].tsx`

This is the most complex page. The container has extensive `useRouter` usage for:
- `router.query` (status, limit, date, memberType, platform)
- `router.push` for filter changes
- `router.locale` for timezone

- [ ] **Step 1: Read all schedule serverSideProps and container code thoroughly**
- [ ] **Step 2: Create App Router schedule page**

Key: `searchParams` replaces `router.query`. The async Server Component receives `params: { locale, status }` and `searchParams: { limit?, date?, memberType?, platform? }`.

- [ ] **Step 3: Migrate schedule container and sub-components**

Replace `router.query` access with `useSearchParams()`. Replace `router.push` with next-intl `useRouter().push()`. Replace `router.locale` with `useLocale()`.

- [ ] **Step 4: Migrate DateSearchDialog and LivestreamContent components**
- [ ] **Step 5: Delete `src/pages/schedule/[status].tsx`**
- [ ] **Step 6: Verify build**
- [ ] **Step 7: Commit**

```
feat(web): migrate schedule page to App Router
```

---

### Task 18: Migrate Multiview Page

**Files:**
- Create: `src/app/[locale]/(standalone)/multiview/page.tsx`
- Modify: Multiview components — `useTranslation(["multiview", "common"])` → split calls
- Delete: `src/pages/multiview.tsx`

Multi-namespace migration: `useTranslation(["multiview", "common"])` → two `useTranslations` calls.

Almost entirely Client Component (react-grid-layout). The page.tsx Server Component just wraps the presenter.

- [ ] **Step 1: Create App Router multiview page**
- [ ] **Step 2: Migrate multiview components to next-intl**
- [ ] **Step 3: Delete `src/pages/multiview.tsx`**
- [ ] **Step 4: Verify build**
- [ ] **Step 5: Commit**

```
feat(web): migrate multiview page to App Router
```

---

### Task 19: Cleanup — Delete Pages Router Artifacts

**Files:**
- Delete: `src/pages/_app.tsx`
- Delete: `src/pages/_document.tsx`
- Delete: `src/pages/` directory (should be empty now)
- Delete: `src/lib/i18n/cf-assets.ts`
- Delete: `src/lib/i18n/server.ts`
- Delete: `src/features/shared/components/Head/Head.tsx` (CustomHead, no longer used)
- Delete: All `serverSideProps.ts` files under `src/features/` (no longer needed — data fetching is in page.tsx Server Components)
- Delete: `src/lib/utils.ts` `getInitializedI18nInstance` function (if only used by serverSideProps)

- [ ] **Step 1: Uninstall old i18n packages**

Run: `pnpm remove next-i18next i18next react-i18next`

- [ ] **Step 2: Delete all listed files**

- [ ] **Step 3: Verify no imports reference deleted files**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Run quality checks**

Run: `pnpm cf:build`

- [ ] **Step 5: Commit**

```
refactor(web): remove Pages Router artifacts and old i18n packages
```

---

### Task 20: Full Verification

- [ ] **Step 1: Build for Cloudflare**

Run: `pnpm cf:build`
Expected: Success.

- [ ] **Step 2: Local preview — test all pages**

Run: `pnpm cf:preview`

Test matrix (each page × `/ja` (default) and `/en`):
- `/schedule/all` and `/en/schedule/all`
- `/clips` and `/en/clips`
- `/clips/twitch` and `/en/clips/twitch`
- `/clips/youtube` and `/en/clips/youtube`
- `/clips/youtube/shorts` and `/en/clips/youtube/shorts`
- `/site-news` and `/en/site-news`
- `/about` and `/en/about`
- `/freechat` and `/en/freechat`
- `/multiview` and `/en/multiview`
- `/privacy-policy` and `/en/privacy-policy`
- `/terms` and `/en/terms`
- `/` redirects to `/schedule/all`

- [ ] **Step 3: Verify quality gates**

Run: `./scripts/post-edit-check.sh`

- [ ] **Step 4: Commit any fixes**

---

## PR 3 — Phase 5: PWA + Cleanup

### Task 21: Migrate PWA (next-pwa → @serwist/next)

**Files:**
- Modify: `next.config.js`
- Create: `src/app/sw.ts` (or equivalent Serwist service worker entry)

- [ ] **Step 1: Install @serwist/next**

Run: `pnpm remove next-pwa && pnpm add @serwist/next serwist`

- [ ] **Step 2: Configure @serwist/next in next.config.js**

Wrap `nextConfig` with `withSerwist` (replaces the old `withPWA`). Configure runtime caching to match the old pattern:
- URL pattern: `https://www.vspo-schedule.com`
- Handler: StaleWhileRevalidate
- Cache name: vspo-schedule
- Max entries: 30, max age: 60s

Refer to @serwist/next docs for exact API.

- [ ] **Step 3: Create service worker entry**

- [ ] **Step 4: Verify build + preview**

Run: `pnpm cf:build && pnpm cf:preview`

- [ ] **Step 5: Commit**

```
feat(web): migrate PWA from next-pwa to @serwist/next
```

---

### Task 22: Migrate Sitemap (next-sitemap → App Router native)

**Files:**
- Create: `src/app/sitemap.ts`
- Delete: `next-sitemap.config.js`

- [ ] **Step 1: Create App Router sitemap**

```typescript
// src/app/sitemap.ts
import type { MetadataRoute } from "next";

const BASE_URL = "https://www.vspo-schedule.com";
const locales = ["en", "cn", "ko", "tw"];

export default function sitemap(): MetadataRoute.Sitemap {
  const schedulePages = [
    { path: "/schedule/all", changeFrequency: "daily" as const, priority: 0.8 },
  ];

  const clipsPages = [
    { path: "/clips", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/clips/youtube", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/clips/twitch", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/clips/youtube/shorts", changeFrequency: "daily" as const, priority: 0.8 },
  ];

  const allPages = [...schedulePages, ...clipsPages];

  return allPages.flatMap((page) => [
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

- [ ] **Step 2: Uninstall next-sitemap**

Run: `pnpm remove next-sitemap`

- [ ] **Step 3: Delete `next-sitemap.config.js`**

- [ ] **Step 4: Remove `next-sitemap` from build script**

In `package.json`, change `"build": "next build && next-sitemap"` to `"build": "next build"`.

- [ ] **Step 5: Commit**

```
feat(web): migrate sitemap to App Router native
```

---

### Task 23: Add Error Pages

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/[locale]/error.tsx`
- Create: `src/app/[locale]/loading.tsx`

- [ ] **Step 1: Create not-found page**

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

- [ ] **Step 2: Create error boundary**

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

- [ ] **Step 3: Create loading page**

```typescript
// src/app/[locale]/loading.tsx
export default function Loading() {
  return null;
}
```

- [ ] **Step 4: Commit**

```
feat(web): add error, not-found, and loading pages
```

---

### Task 24: Final Cleanup and Quality Gates

- [ ] **Step 1: Run quality checks**

Run: `./scripts/post-edit-check.sh`

This runs Biome lint, TypeScript type check, and knip.

- [ ] **Step 2: Fix any lint/type errors**

- [ ] **Step 3: Verify full build**

Run: `pnpm cf:build && pnpm cf:preview`

- [ ] **Step 4: Smoke test all routes**

Same test matrix as Task 20 Step 2, plus:
- PWA manifest loads
- Service worker registers
- `/sitemap.xml` returns valid XML

- [ ] **Step 5: Final commit**

```
chore(web): final cleanup after App Router migration
```
