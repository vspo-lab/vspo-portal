# Server Architecture

## Overview

vspo-portal is a **Next.js 16 App Router frontend** deployed on **Cloudflare Workers** via the OpenNext adapter. There is no backend server in this repository. The application consumes an external REST API through Cloudflare Workers Service Binding (`APP_WORKER`) or the `@vspo-lab/api` client as fallback.

The architecture follows a "frontend-only" model: async Server Components fetch data from the external API at request time, and the rendered HTML is streamed to the client via Suspense. All business logic and data persistence reside in the external API service.

---

## System Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Next.js 16 App Router                      │ │
│  │                                                       │ │
│  │  Async Server Components ── APP_WORKER ── External    │ │
│  │  Suspense Streaming         (Service Binding)  API   │ │
│  │  ISR / force-dynamic        @vspo-lab/api (fallback) │ │
│  └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

Key points:

- **No backend logic** lives in this repository. No database, no ORM, no DI container.
- **Async Server Components** fetch data via Cloudflare Workers Service Binding (`APP_WORKER`) or `VSPOApi` REST client as fallback.
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

```text
1. User requests a page
2. Cloudflare Workers invokes Next.js App Router
3. Async Server Component calls shared API function
4. API function checks for Cloudflare environment:
   a. If available: calls APP_WORKER service binding (worker-to-worker RPC)
   b. If not: calls external API via VSPOApi REST client
5. External API returns response
6. Result is wrapped in Result<T, AppError>
7. Server Component checks result.err
   - If err: returns fallback UI
   - Otherwise: passes data to Client Component as props
8. HTML is streamed to the client via Suspense
```

Example in an async Server Component:

```typescript
// app/[locale]/(content)/schedule/[status]/page.tsx
export const dynamic = "force-dynamic";

async function ScheduleContent({ locale, status }: Props) {
  const schedule = await fetchSchedule({ locale, status });
  return <ScheduleStatusContainer livestreams={schedule.livestreams || []} />;
}

export default async function SchedulePage({ params }: { params: Promise<...> }) {
  return (
    <ContentLayout title={title} path={`/schedule/${status}`}>
      <Suspense fallback={<ScheduleSkeleton />}>
        <ScheduleContent locale={locale} status={status} />
      </Suspense>
    </ContentLayout>
  );
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
| `retry` | `{ attempts?: number; backoff?: (retryCount: number) => number }` | Retry configuration |

### Request Headers

Every API request includes the following headers:

```text
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
| Framework | Next.js 16 App Router |
| API Communication | `@vspo-lab/api` (Orval-generated, Axios-based) |
| Error Handling | `Result<T, AppError>` -- no try-catch |
| Authentication | Cloudflare Access headers + API key |
| Retry | Exponential backoff (default 3 attempts) |
| Local Development | MockHandler returns mock data when `isLocalEnv()` is true |
| Code Organization | Feature-based structure under `src/features/` |

---

## Bot Dashboard Backend (Astro SSR)

The bot-dashboard (`service/bot-dashboard/`) uses Astro 6 SSR as its backend, not the Hono-based server described above. It follows the same Clean Architecture principles but with Astro-specific patterns.

### Feature Module Structure

Each feature follows the domain/repository/usecase pattern:

```text
features/<name>/
├── domain/       # Zod schemas + companion objects
├── repository/   # API access via vspo-server RPC (guild: implemented, channel: mocked)
└── usecase/      # Business logic orchestration
```

### Astro Actions

Server-side form handlers defined in `src/actions/index.ts`. Each action:

1. Calls `requireAuth(context)` for authentication
2. Delegates to a usecase
3. Maps `Result.err` to `ActionError`

### Session & Middleware

- **Session backend:** Cloudflare Workers KV via Astro.session API
- **Middleware** (`src/middleware.ts`): Sets locale from session, injects user/accessToken into `Astro.locals`, protects `/dashboard/*` routes
- **Auth flow:** Discord OAuth2 (authorize → callback → session creation)

### Service Binding

The bot-dashboard connects to `vspo-server` via Cloudflare Workers Service Binding (`APP_WORKER`), typed as `ApplicationService` from the shared `api.d.ts` (symlinked from vspo-schedule). Guild membership detection (`getBotGuildIds`) is implemented via `DiscordService.listBotGuildIds()` RPC. Channel configuration APIs remain mocked pending Phase 5 integration.
