# i18n Migration: next-i18next → next-intl

## Overview

| | Before | After |
|---|--------|-------|
| Library | next-i18next + i18next + react-i18next | next-intl |
| Config file | `next-i18next.config.js` + `next.config.js` i18n block | `src/i18n/routing.ts` + `src/i18n/request.ts` |
| Server translation | `serverSideTranslations(locale, ns)` | Automatic via `getRequestConfig` |
| Client hook | `useTranslation("ns")` → `{ t }` | `useTranslations("ns")` → `t` |
| Server hook | N/A (props only) | `getTranslations({ locale, namespace })` |
| Middleware | Custom locale detection | `createMiddleware(routing)` |
| Translation files | `public/locales/{locale}/{ns}.json` | `public/locales/{locale}/{ns}.json` (unchanged) |
| CF Workers loader | `CloudflareAssetsBackend` (custom i18next backend) | Custom loader in `getRequestConfig` |

## Migration Scope

**36 files** (76 occurrences) use `useTranslation` from `next-i18next`. All must be migrated.

Key areas:
- Page containers and presenters
- Shared layout components (`ContentLayout`, `Header`, `Footer`, `Navigation`)
- Element components (`VideoCard`, `VideoModal`, `LanguageSelector`, `TimeZoneSelector`, etc.)
- Hooks (`useGroupedLivestreams`)

## Routing Configuration

### `src/i18n/routing.ts`

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "cn", "tw", "ko"],
  defaultLocale: "ja",
  localePrefix: "as-needed", // /schedule/all → ja, /en/schedule/all → en
});
```

**Key change:** The `"default"` pseudo-locale is eliminated. `next-intl` uses `"ja"` directly as `defaultLocale`.

**SEO note:** Add redirect for any indexed `/default/...` URLs:
```javascript
// next.config.js redirects()
{ source: "/default/:path*", destination: "/:path*", permanent: true }
```

### `src/i18n/navigation.ts`

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

Use these typed wrappers instead of `next/link`, `next/navigation` for locale-aware navigation.

## Translation Loading (Cloudflare Assets)

### `src/i18n/request.ts`

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale ?? routing.defaultLocale;
  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
  };
});
```

The `loadMessages` function reuses the dual-environment pattern from `src/lib/cloudflare/context.ts`:
- Check `getCloudflareEnvironmentContext()`
- If valid (CF Workers): fetch from ASSETS binding
- If invalid (local dev): import JSON files directly

### All 12 Namespaces

```typescript
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

async function loadMessages(locale: string) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, await loadNamespace(locale, ns)])
  );
  return Object.fromEntries(entries);
}
```

## Middleware Rewrite

### Before

```typescript
// Custom locale detection: path prefix → cookie → Accept-Language → default
function setLocale(request, response) { ... }
function setTimeZone(request, response) { ... }
function setSessionId(request, response) { ... }
```

### After

```typescript
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Preserve existing logic
  setTimeZone(request, response);
  setSessionId(request, response);

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

`next-intl` middleware handles: locale detection (Accept-Language, cookie), locale prefix routing, redirect to localized paths. This replaces the custom `setLocale` function entirely.

## Component Migration Patterns

### Server Components

```typescript
// Before: not possible (getServerSideProps only)
// After:
import { getTranslations } from "next-intl/server";

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return <h1>{t("about.title")}</h1>;
}
```

### Client Components (single namespace)

```typescript
// Before:
import { useTranslation } from "next-i18next";
const { t } = useTranslation("common");

// After:
import { useTranslations } from "next-intl";
const t = useTranslations("common");
```

### Client Components (multiple namespaces)

```typescript
// Before:
import { useTranslation } from "next-i18next";
const { t } = useTranslation(["clips", "common"]);
t("clips:title");
t("common:loading");

// After:
import { useTranslations } from "next-intl";
const tClips = useTranslations("clips");
const tCommon = useTranslations("common");
tClips("title");
tCommon("loading");
```

**Key differences:**
- No destructuring needed (`useTranslations` returns `t` directly)
- Single namespace per call (use multiple calls for multiple namespaces)
- Translation key syntax unchanged (`t("key")`, `t("nested.key")`)
- Interpolation syntax unchanged (`t("greeting", { name })`)

### Metadata

```typescript
// Before: CustomHead component with useTranslation
// After:
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("title"), description: t("description") };
}
```

## Files to Delete

| File | Reason |
|------|--------|
| `next-i18next.config.js` | Replaced by `src/i18n/routing.ts` |
| `src/lib/i18n/cf-assets.ts` | CloudflareAssetsBackend replaced by `src/i18n/request.ts` loader |
| `src/lib/i18n/server.ts` | Unified loader replaced by next-intl `getRequestConfig` |
| `src/lib/i18n/index.ts` | i18next initialization (if exists) |
| `next.config.js` i18n block | Not used by App Router |

## Packages

| Action | Package |
|--------|---------|
| Install | `next-intl` |
| Uninstall | `next-i18next`, `i18next`, `react-i18next` |

## Translation Files

**No changes to translation files.** `public/locales/{locale}/{ns}.json` files are reused as-is. next-intl consumes the same JSON format.
