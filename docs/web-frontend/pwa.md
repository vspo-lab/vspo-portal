# PWA Configuration

## Overview

The app is a Progressive Web App via [next-pwa](https://github.com/shadowwalker/next-pwa). Users can install it to their home screen for a native-like experience.

## Configuration

Defined in `next.config.js`:

```javascript
const withPWA = nextPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [/* ... */],
});
```

| Setting | Value | Description |
|---------|-------|-------------|
| `dest` | `"public"` | Service worker output directory |
| `register` | `true` | Auto-register service worker |
| `skipWaiting` | `true` | Activate new SW immediately (no reload needed) |
| `disable` | dev only | Disabled in development mode |

## Caching Strategy

Runtime caching uses **StaleWhileRevalidate** for the production domain:

| Setting | Value |
|---------|-------|
| URL pattern | `https://www.vspo-schedule.com/*` |
| Strategy | StaleWhileRevalidate |
| Cache name | `vspo-schedule` |
| Max entries | 30 |
| Max age | 60 seconds |
| Cacheable statuses | 0, 200 |

This serves cached responses immediately while revalidating in the background. The 60-second max age keeps content fresh for a schedule-focused app.

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

`_document.tsx` includes:

- `<link rel="manifest" href="/manifest.json">`
- `<link rel="apple-touch-icon" href="/icon.png">`
- `<meta name="theme-color" content="#fff">`
