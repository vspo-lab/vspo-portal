# API Testing (Project-Specific Patterns)

> General API testing guidelines: [docs/testing/api-testing.md](../testing/api-testing.md)
> TDD workflow: [docs/web-frontend/twada-tdd.md](./twada-tdd.md)

## Quick Start

```bash
pnpm --filter vspo-schedule-v2-web test:run  # Run all tests including API tests
```

## Architecture

This repo is a frontend-only Next.js (Pages Router) application. There is no backend server in this codebase. API interactions are handled through the `@vspo-lab/api` package, which provides:

```text
Next.js Page (SSR)
    └── features/**/api/*Service.ts
            └── VSPOApi client (@vspo-lab/api)
                    ├── Production: HTTP requests to external API
                    └── Local/Test: MockHandler (static mock data)
```

### What to Mock in API Tests

| Layer | What to Mock | How |
|-------|-------------|-----|
| `VSPOApi` client methods | HTTP calls to external API | `vi.fn()` on `streams.list`, `events.list`, etc. |
| `MockHandler` | Pre-built static data for all endpoints | Import directly from `@vspo-lab/api/mock` |
| Cloudflare bindings | `APP_WORKER` service binding | Mock `getCloudflareEnvironmentContext()` |
| `wrap()` behavior | Error wrapping | Return `Ok(...)` or `Err(...)` directly |

## MockHandler (Built-in Mock System)

The `@vspo-lab/api` package ships with a `MockHandler` that provides static mock data for every endpoint. This is the primary mechanism for local development and can be reused in tests.

```typescript
import { MockHandler } from "@vspo-lab/api/mock";
import type { ListStreamsParams, ListClipsParams } from "@vspo-lab/api";

// Get mock streams
const streams = MockHandler.getStreams({} as ListStreamsParams);

// Get mock clips filtered by platform
const clips = MockHandler.getClips({ platform: "youtube", clipType: "clip" } as ListClipsParams);

// Search streams by ID
const searched = MockHandler.searchStreams({ streamIds: ["id-1", "id-2"] });

// Get a specific event
const event = MockHandler.getEvent("event-id-123");

// Get mock creators, freechats, events
const creators = MockHandler.getCreators({});
const freechats = MockHandler.getFreechats({});
const events = MockHandler.getEvents({});
```

`MockHandler` is automatically activated when `ENV=local` or the API base URL contains `localhost`.

## VSPOApi Client Mock

For tests that need to control API responses (success/failure), mock the `VSPOApi` client directly:

```typescript
import { Ok, Err, AppError } from "@vspo-lab/error";
import { VSPOApi } from "@vspo-lab/api";

vi.mock("@vspo-lab/api", () => ({
  VSPOApi: vi.fn().mockImplementation(() => ({
    streams: {
      list: vi.fn().mockResolvedValue(Ok({ streams: [] })),
      search: vi.fn().mockResolvedValue(Ok({ videos: [] })),
    },
    clips: {
      list: vi.fn().mockResolvedValue(Ok({ clips: [] })),
    },
    events: {
      list: vi.fn().mockResolvedValue(Ok({ events: [] })),
      get: vi.fn().mockResolvedValue(Ok({ id: "e-1" })),
      create: vi.fn().mockResolvedValue(Ok({ id: "e-new" })),
    },
    creators: {
      list: vi.fn().mockResolvedValue(Ok({ creators: [] })),
    },
    freechats: {
      list: vi.fn().mockResolvedValue(Ok({ freechats: [] })),
    },
  })),
}));
```

## Data Fetching Layer Test Example

```typescript
// Testing service/vspo-schedule/v2/web/src/features/shared/api/livestream.ts
import { fetchLivestreams } from "@/features/shared/api/livestream";
import { Ok, Err, AppError } from "@vspo-lab/error";

describe("fetchLivestreams", () => {
  it("Returns Ok with transformed livestreams on success", async () => {
    // Mock VSPOApi.streams.list to return raw API data
    mockStreamsList.mockResolvedValue(
      Ok({
        streams: [
          {
            rawId: "yt-123",
            title: "Test Stream",
            platform: "youtube",
            status: "live",
            startedAt: "2025-01-01T00:00:00Z",
            creatorName: "Test Creator",
          },
        ],
      }),
    );

    const result = await fetchLivestreams({
      limit: 10,
      lang: "ja",
      status: "all",
      order: "asc",
      timezone: "Asia/Tokyo",
      startedDate: "2025-01-01",
    });

    expect(result.err).toBeUndefined();
    expect(result.val?.livestreams).toHaveLength(1);
    expect(result.val?.livestreams[0].id).toBe("yt-123");
  });

  it("Returns Err wrapped in AppError on API failure", async () => {
    mockStreamsList.mockResolvedValue(
      Err(new AppError({ message: "Server error", code: "INTERNAL_SERVER_ERROR" })),
    );

    const result = await fetchLivestreams({
      limit: 10,
      lang: "ja",
      status: "all",
      order: "asc",
      timezone: "Asia/Tokyo",
    });

    expect(result.err).toBeDefined();
    expect(result.err?.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
```

## Cloudflare Service Binding Mock

When testing the Cloudflare Workers path (used in production), mock the environment context:

```typescript
import { getCloudflareEnvironmentContext } from "@/lib/cloudflare/context";

vi.mock("@/lib/cloudflare/context", () => ({
  getCloudflareEnvironmentContext: vi.fn().mockResolvedValue({
    cfEnv: {
      APP_WORKER: {
        newStreamUsecase: () => ({
          list: vi.fn().mockResolvedValue(Ok({ streams: [] })),
        }),
      },
    },
  }),
}));
```

## Result Type Assertion Helpers

```typescript
import type { Result } from "@vspo-lab/error";
import { AppError } from "@vspo-lab/error";

/** Assert that a Result is Ok and return its value */
function expectOk<T>(result: Result<T, AppError>): T {
  expect(result.err).toBeUndefined();
  expect(result.val).toBeDefined();
  return result.val!;
}

/** Assert that a Result is Err and return the error */
function expectErr(result: Result<unknown, AppError>): AppError {
  expect(result.err).toBeDefined();
  return result.err!;
}
```

## File Structure

```text
service/vspo-schedule/v2/web/
├── src/
│   ├── features/shared/api/         # Data fetching functions (primary test targets)
│   │   ├── livestream.ts            # fetchLivestreams (uses VSPOApi)
│   │   ├── clip.ts                  # fetchClips
│   │   ├── event.ts                 # fetchEvents
│   │   ├── freechat.ts              # fetchFreechats
│   │   └── channel.ts               # fetchChannels
│   ├── features/*/api/*Service.ts   # Feature-specific data fetching
│   └── lib/cloudflare/context.ts    # Cloudflare env access
├── __tests__/                       # Test files (when added)
├── vitest.config.ts
└── vitest.setup.ts

packages/api/
├── src/
│   ├── client.ts                    # VSPOApi class (HTTP client)
│   ├── index.ts                     # Public exports
│   ├── mock/
│   │   ├── index.ts                 # MockHandler + isLocalEnv
│   │   └── data/                    # Static mock data
│   │       ├── streams.ts
│   │       ├── creators.ts
│   │       ├── events.ts
│   │       ├── freechats.ts
│   │       ├── twitchClips.ts
│   │       ├── youtubeClips.ts
│   │       └── youtubeShorts.ts
│   └── gen/openapi.ts               # Generated API types (from orval)
└── package.json
```
