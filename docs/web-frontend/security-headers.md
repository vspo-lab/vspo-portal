# Security Headers

## Overview

Security headers are configured in two places: `next.config.js` for dynamic responses and `public/_headers` for static asset caching on Cloudflare.

## Response Headers (next.config.js)

The `headers()` function in `next.config.js` applies the following headers to all routes (`/(.*)`):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking by blocking iframe embedding |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information sent to external origins |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables access to camera, microphone, and geolocation APIs |

```javascript
// next.config.js
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ];
},
```

## Static Asset Caching (public/_headers)

`public/_headers` configures Cloudflare-managed caching for static assets (Cloudflare Workers do not run for static asset requests):

```text
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/locales/*
  Cache-Control: public, max-age=3600, s-maxage=86400
```

- `/_next/static/*`: Immutable hashed assets cached for 1 year
- `/locales/*`: Translation JSON files cached for 1 hour client-side, 24 hours at CDN edge
