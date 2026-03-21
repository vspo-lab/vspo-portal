# PWA Configuration

## Overview

The app is a Progressive Web App via [`@serwist/next`](https://serwist.pages.dev/). Users can install it to their home screen for a native-like experience.

## Configuration

`@serwist/next` wraps the Next.js config in `next.config.js`:

```javascript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(withNextIntl(nextConfig));
```

| Setting | Value | Description |
|---------|-------|-------------|
| `swSrc` | `src/app/sw.ts` | Service worker source file |
| `swDest` | `public/sw.js` | Compiled service worker output |
| `disable` | dev only | Disabled in development mode |

## Service Worker

`src/app/sw.ts` configures the Serwist service worker:

```typescript
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

| Setting | Value | Description |
|---------|-------|-------------|
| `precacheEntries` | `self.__SW_MANIFEST` | Auto-generated precache manifest |
| `skipWaiting` | `true` | Activate new SW immediately |
| `clientsClaim` | `true` | Take control of all clients on activation |
| `navigationPreload` | `true` | Preload navigation requests |
| `runtimeCaching` | `defaultCache` | Default caching strategies from `@serwist/next/worker` |

## Manifest

`public/manifest.json`:

| Field | Value |
|-------|-------|
| Name | すぽじゅーる |
| Start URL | `/schedule/all` |
| Display | `standalone` |
| Theme color | `#7266cf` (VSPO purple) |
| Background | `#7266cf` |
| Orientation | `portrait` |
| Icons | 192x192, 256x256, 384x384, 512x512 (PNG) |

## HTML Integration

The root layout (`app/layout.tsx`) includes manifest and icon metadata:

```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
  other: { "theme-color": "#fff" },
};
```
