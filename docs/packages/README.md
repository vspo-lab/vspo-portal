# Shared Packages

Four internal packages under `packages/`, published as `@vspo-lab/*` workspace dependencies.

## @vspo-lab/error

Result-based error handling. Used throughout the codebase to replace try-catch.

### Types

```typescript
// Result type (discriminated union)
type OkResult<V> = { val: V; err?: never }
type ErrResult<E extends BaseError> = { val?: never; err: E }
type Result<V, E extends BaseError = BaseError> = OkResult<V> | ErrResult<E>
```

### Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `Ok()` | `Ok<V>(val: V): OkResult<V>` | Create a success result |
| `Err()` | `Err<E>(err: E): ErrResult<E>` | Create an error result |
| `wrap()` | `wrap<T, E>(p: Promise<T>, factory: (err) => E): Promise<Result<T, E>>` | Convert a Promise into a Result |

### AppError

```typescript
new AppError({
  message: string,
  code: ErrorCode,       // "NOT_FOUND", "BAD_REQUEST", etc.
  cause?: unknown,       // Original error
  context?: Record<string, unknown>,
  retry?: boolean,       // Whether the operation can be retried
})
```

### Error Code -> HTTP Status Mapping

| Code | Status |
|------|--------|
| `BAD_REQUEST` | 400 |
| `UNAUTHORIZED` | 403 |
| `FORBIDDEN` | 403 |
| `DISABLED` | 403 |
| `INSUFFICIENT_PERMISSIONS` | 403 |
| `USAGE_EXCEEDED` | 403 |
| `NOT_FOUND` | 404 |
| `METHOD_NOT_ALLOWED` | 405 |
| `NOT_UNIQUE` | 409 |
| `PRECONDITION_FAILED` | 412 |
| `RATE_LIMITED` | 429 |
| `INTERNAL_SERVER_ERROR` | 500 |

---

## @vspo-lab/api

Type-safe API client. Types are generated from the backend OpenAPI spec via Orval.

### VSPOApi Client

```typescript
const api = new VSPOApi({
  baseUrl?: string,               // API base URL (default: "http://localhost:3000")
  apiKey?: string,                // API key header
  cfAccessClientId?: string,      // Cloudflare Access credentials
  cfAccessClientSecret?: string,
  sessionId?: string,             // Custom session ID header
  retry?: {
    attempts?: number,            // Default: 3
    backoff?: (retryCount: number) => number,
                                  // Default: (n) => Math.round(Math.exp(n) * 50)
  },
});
```

### Resource Methods

All methods return `Promise<Result<T, AppError>>`.

```typescript
api.streams.list(params)          // List livestreams
api.streams.search(body)          // Search livestreams
api.creators.list(params)         // List creators/channels
api.clips.list(params)            // List clips
api.events.list(params)           // List events
api.events.create(body)           // Create event
api.events.get(id)                // Get single event
api.freechats.list(params)        // List freechat streams
```

### Regenerating Types

```bash
pnpm generate-openapi
```

This runs Orval against the backend OpenAPI spec to regenerate `packages/api/src/gen/`.

---

## @vspo-lab/dayjs

UTC-first date utilities wrapping dayjs with timezone support.

### Functions

| Function | Description |
|----------|-------------|
| `convertToUTC(input)` | Convert any date input to UTC ISO string |
| `convertToUTCDate(input)` | Convert to UTC Date object |
| `getCurrentUTCDate()` | Current time as UTC Date |
| `getCurrentUTCString()` | Current time as UTC ISO string |
| `convertToUTCTimestamp(dateStr, tz)` | Convert from timezone to UTC |
| `addDaysAndConvertToUTC(dateStr, days, tz)` | Add days then convert to UTC |
| `getEndOfDayUTC(dateStr, tz)` | End of day in timezone, as UTC |
| `getPreviousDay(dateStr, tz)` | Previous day in timezone, as UTC |
| `formatToLocalizedDate(input, lang)` | Localized display string |

### Locale/Timezone Map

`LOCALE_TIMEZONE_MAP` maps language codes to locale and timezone:

| Lang | Locale | Timezone |
|------|--------|----------|
| `en` | `en-US` | `UTC` |
| `ja` | `ja-JP` | `Asia/Tokyo` |
| `cn` | `zh-CN` | `Asia/Shanghai` |
| `tw` | `zh-TW` | `Asia/Taipei` |
| `ko` | `ko-KR` | `Asia/Seoul` |
| `fr` | `fr-FR` | `Europe/Paris` |
| `de` | `de-DE` | `Europe/Berlin` |
| `es` | `es-ES` | `Europe/Madrid` |

---

## @vspo-lab/logging

Structured async-context-aware logger using `AsyncLocalStorage`.

### Usage

```typescript
import { AppLogger } from "@vspo-lab/logging";

// Initialize singleton
AppLogger.getInstance({
  LOG_TYPE: "json",
  LOG_MINLEVEL: "info",        // "debug" | "info" | "warn" | "error"
  LOG_HIDE_POSITION: false,
});

// Request-scoped logging
await AppLogger.runWithContext(
  { requestId: "abc-123", service: "web" },
  async () => {
    AppLogger.info("Request started", { path: "/schedule/all" });
    // All logs in this async scope carry requestId + service
  }
);

// Static convenience methods
AppLogger.debug("verbose detail", { key: "value" });
AppLogger.info("normal operation");
AppLogger.warn("something unusual");
AppLogger.error("something failed", { error: err.message });
```

Log levels: `debug`, `info`, `warn`, `error` (filtered by `LOG_MINLEVEL`).

---

## Mock System

`packages/api/src/mock/` provides mock data for local development.

### MockHandler

Exported from `packages/api/src/mock/index.ts`. Returns typed mock data matching the OpenAPI schema:

| Method | Description |
|--------|-------------|
| `getStreams()` | List of mock livestreams |
| `searchStreams(body)` | Filter streams by IDs in request body |
| `getCreators()` | List of mock creators |
| `getClips(params)` | Routes to YouTube clips, Twitch clips, or Shorts based on `platform` and `clipType` params |
| `getEvents()` | List of mock events |
| `getEvent(id)` | Single event by ID |
| `getFreechats()` | List of mock freechat streams |

### Usage

`isLocalEnv()` detects local development (`ENV === "local"` or `baseUrl` includes `"localhost"`). The shared API layer (`features/shared/api/`) falls back to MockHandler when not running on Cloudflare Workers and no API URL is configured.

### Mock Data Files

Located in `packages/api/src/mock/data/`:

| File | Content |
|------|---------|
| `streams.ts` | Livestream objects with YouTube video IDs |
| `creators.ts` | Creator/channel objects |
| `events.ts` | Event objects |
| `freechats.ts` | Freechat stream objects |
| `youtubeClips.ts` | YouTube clip objects |
| `twitchClips.ts` | Twitch clip objects |
| `youtubeShorts.ts` | YouTube Shorts objects |

Each file exports typed data matching `apiGen.*` types from the generated OpenAPI client.

### Adding Mock Data

1. Create or edit a file in `packages/api/src/mock/data/`
2. Export typed data matching the OpenAPI generated types
3. Wire it into `MockHandler` in `packages/api/src/mock/index.ts`
