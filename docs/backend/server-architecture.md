# Server Architecture

## Overview

vspo-portal is a **Next.js 15 Pages Router frontend** deployed on **Cloudflare Workers** via the OpenNext adapter. There is no backend server in this repository. The application consumes an external REST API through the `@vspo-lab/api` package, which provides an OpenAPI-generated client.

The architecture follows a "frontend-only" model: pages fetch data from the external API at request time via `getServerSideProps`/`getStaticProps`, and the rendered HTML is delivered to the client. All business logic and data persistence reside in the external API service.

---

## System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Next.js 15 Pages Router                    │ │
│  │                                                       │ │
│  │  getServerSideProps ─── @vspo-lab/api ──── External   │ │
│  │  Page Components        (Axios + Retry)    REST API  │ │
│  │  API Routes                                           │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

Key points:

- **No backend logic** lives in this repository. No database, no ORM, no DI container.
- **Server-side rendering** (`getServerSideProps` / `getStaticProps`) calls the external API via `VSPOApi`.
- **Cloudflare Access** headers authenticate requests to the external API.
- **OpenNext adapter** bridges Next.js to the Cloudflare Workers runtime.

---

## Internal Packages

Four shared packages under `packages/`. See [Shared Packages](../packages/README.md) for full API reference.

| Package | Purpose |
|---------|---------|
| `@vspo-lab/api` | OpenAPI-generated client (`VSPOApi`) with retry and mock support |
| `@vspo-lab/error` | `Result<T, AppError>` type -- no try-catch |
| `@vspo-lab/dayjs` | UTC-first date utilities |
| `@vspo-lab/logging` | Structured logging with `AsyncLocalStorage` context |

---

## Data Flow

The primary data flow for a page render:

```
1. User requests a page
2. Cloudflare Workers invokes Next.js Pages Router
3. getServerSideProps calls VSPOApi method
4. VSPOApi sends HTTP request to external API
   - Includes CF-Access headers for authentication
   - Includes x-session-id header for session tracking
   - Axios handles the HTTP transport
5. External API returns JSON response
6. VSPOApi wraps response in Result<T, AppError>
7. getServerSideProps checks result.err
   - If err: returns error props
   - Otherwise: returns data as props
8. HTML is returned to the client
```

Example in a page with `getServerSideProps`:

```typescript
// pages/schedule/index.tsx
import { createApi } from "@/lib/api";

export const getServerSideProps = async () => {
  const api = createApi();
  const result = await api.streams.list({ status: "scheduled" });

  if (result.err) {
    return { props: { error: result.err } };
  }

  return { props: { streams: result.val } };
};
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
| `retry` | `{ attempts?: number; backoff?: (retryCount: number) => number }` | Retry configuration |

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

if (result.err) {
  const error = result.err;  // AppError -- structured error
  console.error(error.message, { code: error.code, status: error.status });
} else {
  const streams = result.val; // T -- the typed response data
}
```

For error handling patterns and the `wrap` utility, see [Shared Packages](../packages/README.md#vspo-laberror).
For mock data setup, see [Shared Packages -- Mock System](../packages/README.md#mock-system).
For frontend directory structure and feature modules, see [Frontend Architecture](../web-frontend/architecture.md).

---

## Summary

| Aspect | Approach |
|--------|----------|
| Runtime | Cloudflare Workers via OpenNext |
| Framework | Next.js 15 Pages Router |
| API Communication | `@vspo-lab/api` (Orval-generated, Axios-based) |
| Error Handling | `Result<T, AppError>` -- no try-catch |
| Authentication | Cloudflare Access headers + API key |
| Retry | Exponential backoff (default 3 attempts) |
| Local Development | MockHandler returns mock data when `isLocalEnv()` is true |
| Code Organization | Feature-based structure under `src/features/` |
