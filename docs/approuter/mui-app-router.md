# MUI + Emotion App Router SSR Setup

## Overview

MUI v7 + Emotion is maintained as the styling solution. All MUI components are Client Components (`"use client"`). Server Components handle data fetching and pass props to Client Component presenters.

## Current Setup (Pages Router)

```
_app.tsx  → AppCacheProvider (@mui/material-nextjs/v14-pagesRouter)
          → ThemeModeProvider (wraps ThemeProvider + CssBaseline)
_document.tsx → InitColorSchemeScript
            → DocumentHeadTags
```

## Target Setup (App Router)

```
app/layout.tsx (Server Component)
  ├── <InitColorSchemeScript attribute="class" />
  ├── Global CSS imports
  ├── <GoogleAnalytics />
  └── <AppProviders>                (Client Component)
        └── <AppRouterCacheProvider>  (Emotion cache for SSR)
              └── <ThemeModeProvider>   (ThemeProvider + CssBaseline — already included)
                    └── <TimeZoneContextProvider>
                          └── <VideoModalContextProvider>
                                └── {children}
```

**Important:** `ThemeModeProvider` (`src/context/Theme.tsx`) already wraps `ThemeProvider` + `CssBaseline`. Do NOT add another `ThemeProvider` or `CssBaseline` — that would cause double wrapping.

## AppProviders Implementation

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

Note: The `v15` in `@mui/material-nextjs/v15-appRouter` refers to the **Next.js version** (15.x), not the MUI version. This is the correct import for Next.js 15.5.14.

### Fallback: Manual Emotion cache

If `@mui/material-nextjs/v15-appRouter` has issues on Cloudflare Workers, implement manual cache:

```typescript
"use client";

import { useState } from "react";
import createCache from "@emotion/cache";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import { ThemeModeProvider } from "@/context/Theme";
import { TimeZoneContextProvider } from "@/context/TimeZoneContext";
import { VideoModalContextProvider } from "@/context/VideoModalContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const c = createCache({ key: "mui" });
    c.compat = true;
    return c;
  });

  useServerInsertedHTML(() => {
    const names = Object.keys(cache.inserted);
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) {
      const v = cache.inserted[name];
      if (typeof v === "string") styles += v;
    }
    cache.inserted = {};
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeModeProvider>
        <TimeZoneContextProvider>
          <VideoModalContextProvider>
            {children}
          </VideoModalContextProvider>
        </TimeZoneContextProvider>
      </ThemeModeProvider>
    </CacheProvider>
  );
}
```

## Root Layout

```typescript
// app/layout.tsx (Server Component)
import "@fortawesome/fontawesome-svg-core/styles.css";
import "@/styles/globals.css";
import "@/styles/normalize.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppProviders } from "@/components/AppProviders";
import { GoogleAnalytics } from "@/features/shared/components/Elements";
import type { Metadata } from "next";

config.autoAddCss = false;

export const metadata: Metadata = {
  keywords: "VSPO!, Vspo, ぶいすぽっ！, ...",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://yt3.ggpht.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppProviders>
          {children}
        </AppProviders>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
```

## Theme Configuration

The existing theme configuration in `src/context/Theme.tsx` is maintained as-is:

- `createTheme()` with light/dark color schemes
- CSS variables: `cssVariables: { colorSchemeSelector: "class" }`
- Custom palette: `vspoPurple`, `darkBlue`, `gray`, `darkGray`, `videoHighlight`
- Scrollbar mixin for webkit browsers

No changes needed to the theme object itself.

## Emotion Compiler (next.config.js)

Maintained as-is:

```javascript
compiler: {
  emotion: {
    sourceMap: process.env.NODE_ENV !== "production",
    autoLabel: "dev-only",
    labelFormat: "[local]",
  },
},
```

## OpenNEXT / Cloudflare Compatibility

| Setting | Status | Reason |
|---------|--------|--------|
| `useWorkerdCondition: false` | Maintain | Prevents emotion edge-light variant resolution on workerd |
| `serverExternalPackages: ["@emotion/*"]` | Maintain | Prevents edge variants from being included by file tracing |
| `@mui/material-nextjs` package | Update import path | `v14-pagesRouter` → `v15-appRouter` |

## Package Changes

| Action | Package |
|--------|---------|
| Update import path | `@mui/material-nextjs` (change from `v14-pagesRouter` to `v15-appRouter`) |
| No change | `@mui/material`, `@emotion/react`, `@emotion/styled`, `@emotion/cache` |
