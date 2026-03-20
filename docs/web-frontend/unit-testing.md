# Unit Testing Guide

This document summarizes the research results and recommendations for the optimal unit testing tools for this project.

## Related Documents

- `docs/testing/unit-testing.md` - Latest unit test implementation policy (minimal mocks + table-driven)
- `docs/web-frontend/twada-tdd.md` - TDD operational rules based on t_wada

## Quick Start

```bash
# Run tests
pnpm test

# Single run (for CI)
pnpm test:run

# With coverage
pnpm test:coverage
```

## Current State Analysis

### Project State
- **Test files**: 23 files (354 tests)
- **Test framework**: Vitest v4.0.16
- **Test config file**: `vitest.config.ts`

### Primary Components Under Test

```
services/api/
├── domain/           # Domain models and business logic (highest priority)
│   ├── item/         # Item aggregate
│   ├── order/        # Order aggregate
│
├── usecase/          # Application use cases
├── pkg/              # Utility functions
└── infra/repository/ # Repository layer
```

### Technology Stack
- **Runtime**: Node.js (ES Modules)
- **Language**: TypeScript 5.8.3
- **Framework**: Hono
- **ORM**: Drizzle ORM
- **Error handling**: Result type (`@vspo-lab/errors`)

---

## Test Framework Comparison

### 1. Vitest -- **Recommended**

| Criterion | Rating |
|-----------|--------|
| ESM support | Excellent - Native support |
| TypeScript support | Excellent - Zero config |
| Performance | Excellent - 10-20x faster than Jest (watch mode) |
| Hono integration | Excellent - Official support |
| Ease of configuration | Excellent - Zero config |
| Ecosystem | Good - Mature |

**Features:**
- Vite-based for fast startup and HMR
- Jest-compatible API (easy migration)
- Vitest 3.0 released January 2025 (7M+ weekly downloads)
- Test filtering by line number

**Reference links:**
- [Vitest Official](https://vitest.dev/)
- [Vitest 3.0 Release Notes](https://vitest.dev/blog/vitest-3)
- [Migration Guide](https://vitest.dev/guide/migration.html)

---

### 2. Jest

| Criterion | Rating |
|-----------|--------|
| ESM support | Fair - Experimental (complex setup) |
| TypeScript support | Fair - Requires ts-jest |
| Performance | Fair - Slower than Vitest |
| Hono integration | Good - Possible |
| Ease of configuration | Fair - Additional setup needed for ESM/TS |
| Ecosystem | Excellent - Most mature |

**Features:**
- Long-standing de facto standard
- Jest 30 released June 2025 (ESM improvements)
- Recommended when React Native is required

**Reference links:**
- [Jest Official](https://jestjs.io/)
- [Jest vs Vitest Comparison (Medium)](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)

---

### 3. Bun Test

| Criterion | Rating |
|-----------|--------|
| ESM support | Excellent - Native |
| TypeScript support | Excellent - No transpilation needed |
| Performance | Excellent - Fastest (synchronous tests) |
| Hono integration | Good - Possible |
| Ease of configuration | Excellent - Zero config |
| Ecosystem | Fair - Developing |

**Features:**
- 2x faster than Node.js (synchronous tests)
- Async tests degrade performance due to single thread
- Requires adopting the entire Bun runtime

**Reference links:**
- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Node vs Bun Test Runner](https://dev.to/boscodomingo/node-test-runner-vs-bun-test-runner-with-typescript-and-esm-44ih)

---

### 4. Node.js Native Test Runner

| Criterion | Rating |
|-----------|--------|
| ESM support | Good - Supported |
| TypeScript support | Poor - Requires loader (tsx) |
| Performance | Good |
| Hono integration | Good - Possible |
| Ease of configuration | Fair - TypeScript setup needed |
| Ecosystem | Fair - Developing |

**Features:**
- Zero dependencies (built into Node.js)
- Snapshot tests and timer mocks not supported
- Suitable for simple projects

**Reference links:**
- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [Better Stack Comparison Article](https://betterstack.com/community/guides/testing/best-node-testing-libraries/)

---

## Recommendation: Vitest

### Selection Rationale

1. **Native ESM support**: Project uses `"type": "module"`
2. **TypeScript zero config**: No additional setup like ts-jest needed
3. **Official Hono support**: Test helpers and client provided
4. **Fast feedback**: High-speed test execution in CI/development
5. **Jest-compatible API**: Low learning curve

### Performance Comparison

| Benchmark | Vitest | Jest |
|-----------|--------|------|
| Cold start | 4x faster | Baseline |
| Watch mode | 10-20x faster | Baseline |
| Memory usage | 30% reduction | Baseline |

*Reference: [Vitest vs Jest (Better Stack)](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)*

---

## Setup Steps

### 1. Install Dependencies

```bash
# Run in the services/api directory
pnpm add -D vitest @vitest/coverage-v8
```

### 2. Create Vitest Config File

`services/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['domain/**', 'usecase/**', 'pkg/**'],
    },
  },
  resolve: {
    alias: {
      '@': '/services/api',
    },
  },
})
```

### 3. Add Scripts to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 4. TypeScript Configuration (Optional)

Add Vitest types to `services/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

---

## Test Strategy

### Table-Driven Tests (Go-like)

This project adopts **Go-style table-driven tests**.

#### Basic Pattern

```typescript
import { describe, expect, it } from "vitest";

describe("functionName", () => {
  const testCases = [
    {
      name: "Case 1 description",
      input: { /* input values */ },
      expected: { /* expected values */ },
    },
    {
      name: "Case 2 description",
      input: { /* input values */ },
      expected: { /* expected values */ },
    },
  ];

  it.each(testCases)("$name", ({ input, expected }) => {
    const result = targetFunction(input);
    expect(result).toMatchObject(expected);
  });
});
```

#### Practical Example: Item.create

```typescript
describe("Item.create", () => {
  const testCases = [
    {
      name: "Basic item creation",
      input: { name: "Sample Item", status: "active" },
      expected: {
        name: "Sample Item",
        status: "active",
        createdAt: new Date(),
        quantity: 1,
      },
    },
    {
      name: "Item creation with metadata",
      input: {
        name: "Another Item",
        status: "draft",
        metadata: { key: "value" },
      },
      expected: {
        name: "Another Item",
        status: "draft",
        metadata: { key: "value" },
      },
    },
  ];

  it.each(testCases)("$name", ({ input, expected }) => {
    const item = Item.create(input);
    expect(item).toMatchObject(expected);
  });
});
```

#### Type Guard Tests

```typescript
describe("ItemStatus.isActive", () => {
  const testCases = [
    {
      name: "Returns true for an active item",
      profile: activeItem,
      expected: true,
    },
    {
      name: "Returns false for an archived item",
      profile: archivedItem,
      expected: false,
    },
  ];

  it.each(testCases)("$name", ({ profile, expected }) => {
    expect(ItemStatus.isActive(profile)).toBe(expected);
  });
});
```

### Benefits of Table-Driven Tests

1. **Comprehensiveness**: Manage input patterns as a list, preventing omissions
2. **Readability**: Test cases are organized as data
3. **Maintainability**: Adding new cases is easy (just add to the array)
4. **Debugging**: `$name` clearly identifies which case failed

### Domain Model Tests (Highest Priority)

The domain layer contains mostly pure functions and deterministic logic, testable without mocks.

### Use Case Tests

Mocks for repositories and transaction managers are required.

```typescript
// usecase/user.test.ts
import { describe, expect, it, vi } from "vitest";
import { createUser } from "./user";

describe("createUser", () => {
  const testCases = [
    {
      name: "Successfully creates a user",
      mockReturn: { isOk: () => true },
      input: { name: "Test", status: "active" },
      expectedOk: true,
    },
    {
      name: "Fails on repository error",
      mockReturn: { isOk: () => false, error: "DB_ERROR" },
      input: { name: "Test", status: "active" },
      expectedOk: false,
    },
  ];

  it.each(testCases)("$name", async ({ mockReturn, input, expectedOk }) => {
    const mockRepo = {
      save: vi.fn().mockResolvedValue(mockReturn),
    };

    const result = await createUser(mockRepo, input);

    expect(result.isOk()).toBe(expectedOk);
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });
});
```

### Hono Endpoint Tests

Integration tests using Hono's `app.request()`.

```typescript
// infra/http/user.test.ts
import { describe, expect, it } from "vitest";
import { app } from "./app";

describe("GET /api/users/:id", () => {
  const testCases = [
    {
      name: "Retrieves an existing user",
      path: "/api/users/123",
      expectedStatus: 200,
    },
    {
      name: "Returns 404 for non-existent user",
      path: "/api/users/999",
      expectedStatus: 404,
    },
  ];

  it.each(testCases)("$name", async ({ path, expectedStatus }) => {
    const res = await app.request(path);
    expect(res.status).toBe(expectedStatus);
  });
});
```

*Reference: [Hono Testing Guide](https://hono.dev/docs/guides/testing)*

---

## Database Test Strategy

### Option 1: Repository Mocks (Recommended)

```typescript
const mockUserRepo = {
  findById: vi.fn(),
  save: vi.fn(),
}
```

**Advantages**: Fast, no external dependencies, ideal for unit tests

### Option 2: PGlite (In-Memory Postgres)

```typescript
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'

const client = new PGlite()
const db = drizzle(client)
```

**Advantages**: Can test actual SQL
**Note**: Full compatibility is not guaranteed since MySQL is used

*Reference: [Drizzle + PGlite Testing](https://github.com/rphlmr/drizzle-vitest-pg)*

### Option 3: Testcontainers

```typescript
import { MySQLContainer } from '@testcontainers/mysql'

const container = await new MySQLContainer().start()
```

**Advantages**: Production-equivalent MySQL environment
**Disadvantages**: Requires Docker, slower test speed

---

## Directory Structure Proposal

```
services/api/
├── domain/
│   ├── domain/
│   │   ├── user.ts
│   │   └── user.test.ts      # Colocation
│   └── task/
│       ├── task.ts
│       └── task.test.ts
├── usecase/
│   ├── user.ts
│   └── user.test.ts
├── vitest.config.ts
└── vitest.setup.ts            # Global setup
```

**Colocation approach**: Place test files in the same directory as source files

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm --filter server test:run
      - run: pnpm --filter server test:coverage
```

---

## Reference Links

### Official Documentation
- [Vitest Official](https://vitest.dev/)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Hono Testing Helper](https://hono.dev/docs/helpers/testing)

### Comparison Articles
- [Jest vs Vitest: Which Test Runner Should You Use in 2025?](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)
- [Vitest vs Jest | Better Stack](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/)
- [Best Node.js Testing Libraries | Better Stack](https://betterstack.com/community/guides/testing/best-node-testing-libraries/)

### Drizzle ORM Testing
- [Drizzle + Vitest + PGlite Example](https://github.com/rphlmr/drizzle-vitest-pg)
- [NestJS + Drizzle Unit Tests](https://wanago.io/2024/09/23/api-nestjs-drizzle-orm-unit-tests/)

---

## Summary

| Aspect | Recommendation |
|--------|---------------|
| Framework | **Vitest** |
| Priority test target | Domain models (`domain/`) |
| Test placement | Colocation (same directory) |
| DB testing | Repository mocks |
| Coverage | v8 provider |

---

## Test Implementation Guide

### Layer-Based Test Structure

Current tests are divided into the following layers:

```
services/api/
├── domain/                    # Domain model tests
│   ├── item/
│   │   ├── item.test.ts       # Item aggregate
│   │   └── item-status.test.ts
│   ├── order/
│   │   ├── order.test.ts
│   │   └── line-item.test.ts
│   └── report/
│       ├── report.test.ts
│       └── report-item.test.ts
├── usecase/                   # Use case tests
│   ├── item.test.ts
│   └── order.test.ts
├── pkg/                       # Utility tests
│   ├── date.test.ts
│   ├── uuid.test.ts
│   └── textNormalizer.test.ts
├── infra/
│   └── external-api/          # Infra layer tests
│       ├── external-api-service.test.ts
│       └── config-mapping.test.ts
└── test/
    └── integration/           # Integration tests (run separately)
        └── routes/

packages/errors/               # Error handling tests
├── result.test.ts
├── error.test.ts
└── code.test.ts
```

### Use Case Layer Mock Patterns

Use case layer tests mock Repository and TxManager.

#### 1. TxManager Mock

```typescript
import type { TxManager } from "../infra/repository/txManager";

const mockTxManager: TxManager = {
  runTx: vi.fn(async (operation) => operation({} as never)),
};
```

`runTx` executes a callback within a transaction. The mock immediately invokes the callback.

#### 2. Repository Mock

```typescript
import type { UserRepository } from "../infra/repository/user";

// Mock function type definitions
let getByIdMock: ReturnType<
  typeof vi.fn<(id: string) => Promise<Result<User, AppError>>>
>;
let updateMock: ReturnType<
  typeof vi.fn<(user: User) => Promise<Result<User, AppError>>>
>;

beforeEach(() => {
  getByIdMock = vi.fn();
  updateMock = vi.fn();

  const mockUserRepository: UserRepository = {
    from: () => ({
      getById: getByIdMock,
      getByEmail: vi.fn(),
      create: vi.fn(),
      update: updateMock,
      delete: vi.fn(),
    }),
  };
});
```

Since the `from()` pattern is used, the mock follows the same structure.

#### 3. Writing Test Cases

```typescript
describe("getById", () => {
  const testCases = [
    {
      name: "Returns Ok when user is found",
      userId: "user-123",
      repoResult: () => Ok(createMockItem()),
      expectOk: true,
    },
    {
      name: "Returns Err when user is not found",
      userId: "not-found",
      repoResult: () =>
        Err(new AppError({ message: "User not found", code: "NOT_FOUND" })),
      expectOk: false,
      expectedCode: "NOT_FOUND",
    },
  ];

  it.each(testCases)("$name", async ({
    userId,
    repoResult,
    expectOk,
    expectedCode,
  }) => {
    getByIdMock.mockResolvedValue(repoResult());

    const result = await useCase.getById({ userId });

    expect(getByIdMock).toHaveBeenCalledWith(userId);
    if (expectOk) {
      expect(result.err).toBeUndefined();
      expect(result.val).toBeDefined();
    } else {
      expect(result.err).toBeDefined();
      expect(result.err?.code).toBe(expectedCode);
    }
  });
});
```

**Key points:**
- Making `repoResult` a function generates a new Result instance for each test case
- `expectedCode` is only set for error cases

### Infra Layer Mock Patterns

Mock patterns for external API services.

```typescript
const createMockExternalAPI = () => ({
  resources: {
    create: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
  },
  actions: {
    execute: vi.fn(),
  },
  webhooks: {
    verifySignature: vi.fn(),
  },
});

describe("ExternalAPIService", () => {
  describe("createResource", () => {
    const testCases = [
      {
        name: "Can create a resource",
        input: { userId: "user-123", status: "active", name: "Test" },
        mockResult: { id: "res_123", status: "active" },
        expectOk: true,
      },
      {
        name: "Returns Err on external API error",
        input: { userId: "user-123", status: "active", name: "Test" },
        mockError: new Error("External API Error"),
        expectOk: false,
        expectedCode: "INTERNAL_SERVER_ERROR",
      },
    ];

    it.each(testCases)("$name", async ({
      input,
      mockResult,
      mockError,
      expectOk,
      expectedCode,
    }) => {
      const mockAPI = createMockExternalAPI();
      if (mockResult) {
        mockAPI.resources.create.mockResolvedValue(mockResult);
      } else if (mockError) {
        mockAPI.resources.create.mockRejectedValue(mockError);
      }

      const service = createExternalAPIService(mockAPI as never, "secret");
      const result = await service.createResource(input);

      if (expectOk) {
        expect(result.err).toBeUndefined();
      } else {
        expect(result.err?.code).toBe(expectedCode);
      }
    });
  });
});
```

### Test Helper Factories

Create factory functions for domain objects and reuse them.

```typescript
// Mock item factory
const createMockItem = (overrides: Partial<Item> = {}): User => ({
  id: "item-123",
  name: "Test Item",
  status: "active",
  createdAt: new Date(),
  quantity: 1,
  // ...
  },
  },
    category: null,
    description: null,
    price: null,
    quantity: 1,
    tags: [],
    metadata: {},
    ,
    ,
  },
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  ...overrides,
});
```

### Environment Variable Testing

```typescript
describe("config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      API_BASE_URL: "https://api.example.com",
      API_TIMEOUT: "5000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each(testCases)("$name", ({ input, expected }) => {
    expect(getConfig(input)).toBe(expected);
  });
});
```

### Test Naming Conventions

Write test case names in descriptive sentences:

```typescript
const testCases = [
  { name: "Returns Ok when user is found", ... },
  { name: "Returns Err when user is not found", ... },
  { name: "Returns Err when update fails", ... },
  { name: "Returns Err when already processed", ... },
];
```

**Naming patterns:**
- Success cases: `"Can ...", "Returns ..."`
- Error cases: `"Returns Err when ..."`
- Conditional: `"When ... is ..., then ..."`
