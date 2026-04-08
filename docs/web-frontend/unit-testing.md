# Unit Testing (Project-Specific Patterns)

> General unit testing guidelines: [docs/testing/unit-testing.md](../testing/unit-testing.md)
> TDD workflow: [docs/web-frontend/twada-tdd.md](./twada-tdd.md)

## Quick Start

```bash
pnpm --filter vspo-schedule-v2-web test        # Watch mode
pnpm --filter vspo-schedule-v2-web test:run    # Single run (CI)
pnpm --filter vspo-schedule-v2-web test:coverage # With coverage
```

## Mock Patterns

### VSPOApi Client Mock

The `@vspo-lab/api` package provides `MockHandler` for returning static mock data. To mock the `VSPOApi` client in tests:

```typescript
import { Ok, Err, AppError } from "@vspo-lab/error";
import type { VSPOApi } from "@vspo-lab/api";

const createMockVSPOApi = (): Pick<VSPOApi, "streams" | "clips" | "events" | "creators" | "freechats"> => ({
  streams: {
    list: vi.fn().mockResolvedValue(Ok({ streams: [] })),
    search: vi.fn().mockResolvedValue(Ok({ videos: [] })),
  },
  clips: {
    list: vi.fn().mockResolvedValue(Ok({ clips: [] })),
  },
  events: {
    list: vi.fn().mockResolvedValue(Ok({ events: [] })),
    get: vi.fn().mockResolvedValue(Ok({ id: "event-1", title: "Test Event" })),
    create: vi.fn().mockResolvedValue(Ok({ id: "event-new" })),
  },
  creators: {
    list: vi.fn().mockResolvedValue(Ok({ creators: [] })),
  },
  freechats: {
    list: vi.fn().mockResolvedValue(Ok({ freechats: [] })),
  },
});
```

### MockHandler (Built-in Mock Data)

The `@vspo-lab/api` package includes a `MockHandler` that returns pre-defined mock data for local development and testing:

```typescript
import { MockHandler } from "@vspo-lab/api/mock";

// Returns mock stream data
const streams = MockHandler.getStreams({ limit: "10", page: "0" });

// Returns mock clips filtered by platform and clip type
const clips = MockHandler.getClips({ platform: "youtube", clipType: "clip" });

// Returns mock creators
const creators = MockHandler.getCreators({});
```

`MockHandler` is automatically used by `VSPOApi` when `ENV=local` or the base URL contains `localhost` (see `isLocalEnv()`).

### External Service Mock

```typescript
const createMockExternalAPI = () => ({
  resources: { create: vi.fn(), retrieve: vi.fn(), list: vi.fn() },
  actions: { execute: vi.fn() },
  webhooks: { verifySignature: vi.fn() },
});
```

## Data Fetching Test Pattern

```typescript
import { Ok, Err, AppError } from "@vspo-lab/error";

describe("fetchLivestreams", () => {
  const testCases = [
    {
      name: "Returns Ok with livestreams on success",
      apiResult: () => Ok({ streams: [{ rawId: "s-1", title: "Test Stream", startedAt: "2025-01-01T00:00:00Z" }] }),
      expectOk: true,
    },
    {
      name: "Returns Err when API call fails",
      apiResult: () => Err(new AppError({ message: "API Error", code: "INTERNAL_SERVER_ERROR" })),
      expectOk: false,
      expectedCode: "INTERNAL_SERVER_ERROR",
    },
  ];

  it.each(testCases)("$name", async ({ apiResult, expectOk, expectedCode }) => {
    // Mock VSPOApi.streams.list to return the test result
    vi.mocked(mockClient.streams.list).mockResolvedValue(apiResult());
    const result = await fetchLivestreams(params);

    if (expectOk) {
      expect(result.err).toBeUndefined();
      expect(result.val).toBeDefined();
    } else {
      expect(result.err?.code).toBe(expectedCode);
    }
  });
});
```

## Result Type Testing

```typescript
import { Ok, Err } from "@vspo-lab/error";

it("Returns Ok on success", async () => {
  const result = await fetchLivestreams({ limit: 10, lang: "ja", status: "all", order: "asc", timezone: "Asia/Tokyo" });
  expect(result.err).toBeUndefined();
  expect(result.val?.livestreams).toBeDefined();
});

it("Returns Err on API failure", async () => {
  const result = await fetchLivestreams({ limit: 10, lang: "ja", status: "all", order: "asc", timezone: "Asia/Tokyo" });
  expect(result.err).toBeDefined();
  expect(result.err?.code).toBe("INTERNAL_SERVER_ERROR");
});
```

## Test Helper Factory

```typescript
import type { Livestream } from "@/features/shared/domain";

const createMockLivestream = (overrides: Partial<Livestream> = {}): Livestream => ({
  id: "stream-123",
  type: "livestream",
  title: "Test Stream",
  platform: "youtube",
  status: "live",
  thumbnailUrl: "https://example.com/thumb.jpg",
  scheduledStartTime: "2025-01-01T00:00:00Z",
  channelId: "ch-1",
  channelTitle: "Test Channel",
  channelThumbnailUrl: "",
  link: "https://youtube.com/watch?v=test",
  videoPlayerLink: "",
  chatPlayerLink: "",
  tags: [],
  ...overrides,
});
```

## Test Naming Conventions

```typescript
const testCases = [
  { name: "Returns Ok when streams are found", ... },    // Success
  { name: "Returns Err when API is unreachable", ... },  // Error
  { name: "Can filter streams by platform", ... },       // Capability
  { name: "When status is live, then ...", ... },         // Conditional
];
```

## File Structure

```text
service/vspo-schedule/v2/web/
├── src/
│   ├── features/**/api/*.ts          # Data fetching (test these with mocked VSPOApi)
│   ├── features/**/hooks/*.ts        # React hooks (test with renderHook)
│   ├── app/[locale]/*/page.tsx        # App Router page components
│   ├── features/**/pages/*/presenter.tsx  # Presenter components (test rendering)
│   ├── features/shared/domain/       # Domain schemas and types
│   ├── lib/                          # Utility functions
│   └── __tests__/                    # Test files (when added)
├── vitest.config.ts
└── vitest.setup.ts

packages/
├── api/src/
│   ├── client.ts                     # VSPOApi client class
│   ├── mock/index.ts                 # MockHandler for test/local data
│   └── mock/data/                    # Static mock data files
├── errors/src/                       # Result type, AppError
├── dayjs/src/                        # Date utilities
└── logging/src/                      # Logging utilities
```
