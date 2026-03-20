# Server Architecture

## Overview

vspo-portal is a **Next.js 15 App Router frontend** deployed on **Cloudflare Workers** via the OpenNext adapter. There is no backend server in this repository. The application consumes an external REST API through the `@vspo-lab/api` package, which provides an OpenAPI-generated client.

The architecture follows a "frontend-only" model: Server Components fetch data from the external API at request time, and the rendered HTML is delivered to the client. All business logic and data persistence reside in the external API service.

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Next.js 15 App Router                     │ │
│  │                                                       │ │
│  │  Server Components ─── @vspo-lab/api ──── External   │ │
│  │  Client Components     (Axios + Retry)     REST API  │ │
│  │  Route Handlers                                       │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

Key points:

- **No backend logic** lives in this repository. No database, no ORM, no DI container.
- **Server Components** call the external API directly via `VSPOApi`.
- **Cloudflare Access** headers authenticate requests to the external API.
- **OpenNext adapter** bridges Next.js to the Cloudflare Workers runtime.

---

## Package Structure

### `packages/api/` -- OpenAPI-Generated Client (Orval)

The API client is auto-generated from an OpenAPI specification using Orval. It provides the `VSPOApi` class, which exposes entity-specific getters for each API domain.

```typescript
import { VSPOApi } from "@vspo-lab/api";

const api = new VSPOApi({
  apiKey: "...",
  cfAccessClientId: "...",
  cfAccessClientSecret: "...",
  sessionId: "...",
  baseUrl: "https://api.example.com",
  retry: { attempts: 3, backoffMs: 1000 },
});

// Entity-specific getters
const streamsResult = await api.streams.list({ status: "live" });
const creatorsResult = await api.creators.getById("creator-id");
const clipsResult = await api.clips.list({ limit: 20 });
const eventsResult = await api.events.list({});
const freechatsResult = await api.freechats.list({});
```

Entity getters:

| Getter | Domain |
|--------|--------|
| `.streams` | Live streams, scheduled streams, archives |
| `.creators` | VTuber / creator profiles |
| `.clips` | Clip videos |
| `.events` | Events and announcements |
| `.freechats` | Free chat streams |

### `packages/errors/` -- Result Type and AppError

Provides the `Result<T, AppError>` discriminated union for explicit error handling. Application code must never use `try-catch`.

```typescript
import { Ok, Err, AppError, wrap } from "@vspo-lab/error";

// AppError structure
type AppError = {
  code: string;
  message: string;
  status: number;
  retry: boolean;
  cause?: unknown;
};

// Result is a discriminated union
type Result<T, E> = { ok: true; val: T } | { ok: false; err: E };
```

### `packages/dayjs/` -- UTC-First Date Utilities

Wraps dayjs with UTC-first conventions. All date operations default to UTC, and localized formatting is available per language code.

```typescript
import { convertToUTC, formatToLocalizedDate } from "@vspo-lab/dayjs";
```

### `packages/logging/` -- Structured Logging

Provides structured logging with `AsyncLocalStorage` for automatic `requestId` propagation across the request lifecycle.

```typescript
import { logger } from "@vspo-lab/logging";

logger.info("Fetching streams", { count: 10 });
// Output includes requestId from AsyncLocalStorage context
```

---

## Data Flow

The primary data flow for a page render:

```
1. User requests a page
2. Cloudflare Workers invokes Next.js App Router
3. Server Component calls VSPOApi method
4. VSPOApi sends HTTP request to external API
   - Includes CF-Access headers for authentication
   - Includes x-session-id header for session tracking
   - Axios handles the HTTP transport
5. External API returns JSON response
6. VSPOApi wraps response in Result<T, AppError>
7. Server Component checks result.ok
   - If true: renders data
   - If false: renders error state
8. HTML is returned to the client
```

Example in a Server Component:

```typescript
// app/schedule/page.tsx (Server Component)
import { createApi } from "@/lib/api";

export default async function SchedulePage() {
  const api = createApi();
  const result = await api.streams.list({ status: "scheduled" });

  if (!result.ok) {
    return <ErrorDisplay error={result.err} />;
  }

  return <ScheduleList streams={result.val} />;
}
```

---

## API Client Pattern

### Constructor Configuration

The `VSPOApi` class accepts the following configuration:

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | `string` | API key for authenticating with the external API |
| `cfAccessClientId` | `string` | Cloudflare Access Service Token client ID |
| `cfAccessClientSecret` | `string` | Cloudflare Access Service Token client secret |
| `sessionId` | `string` | Session ID for request tracking |
| `baseUrl` | `string` | Base URL of the external API |
| `retry` | `{ attempts: number; backoffMs: number }` | Retry configuration |

### Request Headers

Every API request includes the following headers:

```
CF-Access-Client-Id: <cfAccessClientId>
CF-Access-Client-Secret: <cfAccessClientSecret>
x-api-key: <apiKey>
x-session-id: <sessionId>
```

### Retry Logic

The client includes built-in retry with exponential backoff:

- **Default attempts**: 3
- **Backoff strategy**: Exponential (e.g., 1s, 2s, 4s)
- **Retryable conditions**: Network errors and 5xx responses
- **Non-retryable**: 4xx responses (client errors)

```typescript
// Retry is transparent to the caller
const result = await api.streams.list({ status: "live" });
// If the first attempt fails with a 503, the client automatically retries
// up to the configured number of attempts before returning an Err result.
```

### Return Type

All entity methods return `Promise<Result<T, AppError>>`:

```typescript
const result = await api.streams.list(params);

if (result.ok) {
  const streams = result.val; // T -- the typed response data
} else {
  const error = result.err;  // AppError -- structured error
  console.error(error.message, { code: error.code, status: error.status });
}
```

---

## Error Handling

### Result<T, AppError> Pattern

All fallible operations return `Result<T, AppError>` instead of throwing exceptions.

```typescript
// Checking results
const result = await api.creators.getById(id);

if (!result.ok) {
  // Handle error -- result.err is AppError
  logger.error("Failed to fetch creator", {
    code: result.err.code,
    message: result.err.message,
    status: result.err.status,
  });
  return;
}

// Safe to access result.val
const creator = result.val;
```

### AppError Properties

| Property | Type | Description |
|----------|------|-------------|
| `code` | `string` | Machine-readable error code (e.g., `"NOT_FOUND"`, `"INTERNAL_SERVER_ERROR"`) |
| `message` | `string` | Human-readable error description |
| `status` | `number` | HTTP status code |
| `retry` | `boolean` | Whether the operation is safe to retry |
| `cause` | `unknown` | Original error, if any |

### The `wrap` Utility

The `wrap` function converts a Promise into a `Result`, catching any thrown exceptions:

```typescript
import { wrap, AppError } from "@vspo-lab/error";

const result = await wrap(
  axios.get("/some-endpoint"),
  (err) => new AppError({
    message: "Request failed",
    code: "INTERNAL_SERVER_ERROR",
    status: 500,
    retry: true,
    cause: err,
  }),
);
```

---

## Mock System

For local development, the API client supports a mock mode through `MockHandler`.

When `isLocalEnv()` returns `true`, API methods return mock data instead of making actual HTTP calls. This allows frontend development without a running external API.

```typescript
// Internally, the VSPOApi checks the environment
if (isLocalEnv()) {
  // Returns predefined mock data wrapped in Ok(...)
  return Ok(mockStreamsData);
}

// Otherwise, makes the real HTTP request
const response = await axios.get(...);
```

Mock data is colocated with the API client package and mirrors the shape of real API responses.

---

## Web Application

The web application is located at:

```
service/vspo-schedule/v2/web/
```

### Feature-Based Directory Structure

```
src/
├── features/
│   ├── schedule/      # Stream schedule views (daily, weekly)
│   ├── clips/         # Clip video browsing and filtering
│   ├── freechat/      # Free chat stream listings
│   ├── site-news/     # Site announcements and updates
│   ├── shared/        # Cross-feature components and utilities
│   └── multiview/     # Multi-stream viewing layout
├── app/               # Next.js App Router pages and layouts
├── lib/               # Application-level utilities
└── components/        # Global UI components
```

Each feature directory contains its own components, hooks, and utilities scoped to that feature. Shared logic that crosses feature boundaries lives in `features/shared/`.

---

## Summary

| Aspect | Approach |
|--------|----------|
| Runtime | Cloudflare Workers via OpenNext |
| Framework | Next.js 15 App Router |
| API Communication | `@vspo-lab/api` (Orval-generated, Axios-based) |
| Error Handling | `Result<T, AppError>` -- no try-catch |
| Authentication | Cloudflare Access headers + API key |
| Retry | Exponential backoff (default 3 attempts) |
| Local Development | MockHandler returns mock data when `isLocalEnv()` is true |
| Code Organization | Feature-based structure under `src/features/` |
