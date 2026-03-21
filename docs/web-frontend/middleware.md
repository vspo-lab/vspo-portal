# Middleware

## Overview

`src/middleware.ts` intercepts all requests (except `/_next`, `/api/`, and static files) to handle locale routing, timezone, and session tracking.

## Request Flow

```text
Request
  → Skip if static file / _next / api
  → setLocale(): resolve and set NEXT_LOCALE cookie
  → setTimeZone(): initialize time-zone cookie
  → setSessionId(): generate x-session-id if missing
  → NextResponse (with cookies set)
```

## Locale Resolution

Priority order:

1. URL path prefix (e.g., `/en/schedule/all` -> `en`)
2. `NEXT_LOCALE` cookie
3. `Accept-Language` header (parsed for best match)
4. Default: `ja`

If the URL has no locale prefix, middleware redirects to `/{locale}/{path}`.

Supported locales: `en`, `ja`, `cn`, `tw`, `ko`.

## Timezone

Sets `time-zone` cookie if not present. Default: `Asia/Tokyo`.

The cookie is read by `getServerSideProps` to format dates in the user's timezone. Users can change it via the `TimeZoneSelector` component, which updates the cookie and triggers a page refresh.

## Session ID

Generates a `crypto.randomUUID()` and stores it in the `x-session-id` cookie if not present. Used for analytics and API request tracking.

## Cookie Settings

All cookies share the same configuration:

| Setting | Value |
|---------|-------|
| `maxAge` | 34560000 (400 days) |
| `path` | `/` |

| Cookie | Purpose | Default |
|--------|---------|---------|
| `NEXT_LOCALE` | User's locale | `ja` |
| `time-zone` | User's timezone | `Asia/Tokyo` |
| `x-session-id` | Analytics session | Auto-generated UUID |
