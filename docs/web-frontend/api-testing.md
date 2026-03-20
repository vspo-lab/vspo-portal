# API Testing Strategy

## Overview

This document summarizes the tool selection and implementation strategy for API integration testing in this project.

**Note**: This project uses `@hono/zod-openapi` and auto-generates **OpenAPI 3.1 specifications** at the `/doc` endpoint. This provides high compatibility with OpenAPI-based testing tools.

## Related Documents

- `docs/testing/api-testing.md` - Latest API test implementation policy (minimal mocks + table-driven)
- `docs/web-frontend/twada-tdd.md` - TDD operational rules based on t_wada

## Tool Selection

### Recommended Stack

| Category | Tool | Rationale |
|----------|------|-----------|
| **Test framework** | Vitest | Native ESM and TypeScript support, fast |
| **API test client** | Hono testClient | Type-safe, Hono-native, IDE completion support |
| **OpenAPI contract testing** | Schemathesis | Auto-generated tests from OpenAPI spec, edge case detection |
| **Mocking** | Vitest built-in | vi.mock, vi.fn are sufficient |
| **Coverage** | v8 (Vitest built-in) | No additional setup needed |

---

## OpenAPI-Based Testing Tool Comparison

Since this project publishes the OpenAPI spec at `/doc`, the following tools can be leveraged.

### Tool List

| Tool | Features | Language | CI Integration | Recommendation |
|------|----------|----------|----------------|----------------|
| **Schemathesis** | Property-based testing, automatic edge case detection | Python | Excellent | 3/3 |
| **Dredd** | Consistency verification against OpenAPI spec | Node.js | Excellent | 2/3 |
| **Prism** | Mock server + validation proxy | Node.js | Good | 2/3 |
| **Step CI** | YAML-based test definitions | Node.js | Excellent | 2/3 |
| **Bruno** | Git-friendly API client | Electron | Good | 1/3 |
| **Hoppscotch** | OSS API client + CLI | Node.js | Good | 1/3 |

### Schemathesis (Recommended)

A property-based testing tool that **automatically generates thousands of test cases** from the OpenAPI spec.

**Advantages**:
- Auto-generates tests from OpenAPI spec (no manual test writing needed)
- Automatically detects edge cases and validation bugs
- Typically finds 5-15 issues on first run
- Used by Spotify, JetBrains, Red Hat, etc.
- Easy GitHub Actions integration

**Disadvantages**:
- Requires Python (additional dependency for Node.js projects)
- Endpoints requiring authentication need configuration

```bash
# Install
pip install schemathesis

# Basic run
schemathesis run http://localhost:8787/doc

# With authentication
schemathesis run http://localhost:8787/doc \
  --header "Authorization: Bearer $TOKEN"
```

### Dredd

A contract testing tool that **verifies consistency** between the OpenAPI spec and actual API responses.

**Advantages**:
- Node.js native (no additional runtime needed)
- Prevents divergence between documentation and implementation
- Easy CI/CD integration

**Disadvantages**:
- Complex authentication and dynamic data require hooks
- Tests are insufficient if the spec is incomplete

```bash
# Install
pnpm add -D dredd

# Run
dredd http://localhost:8787/doc http://localhost:8787
```

### Prism

**Generates a mock server** from the OpenAPI spec + operates as a validation proxy.

**Advantages**:
- Useful as a mock server during frontend development
- Detects contract violations with the `--errors` flag

**Disadvantages**:
- More of a development support tool than a test runner

```bash
# Start mock server
prism mock http://localhost:8787/doc

# Validation proxy
prism proxy http://localhost:8787/doc http://localhost:8787 --errors
```

### Step CI

A lightweight framework for defining test scenarios **in YAML**.

**Advantages**:
- Declarative test definitions in YAML
- Import from OpenAPI possible
- Easy CI/CD integration

**Disadvantages**:
- Manual test case definition required

```yaml
# stepci.yml
version: "1.1"
env:
  baseUrl: http://localhost:8787

tests:
  health:
    items:
      - name: Health check
        http:
          url: ${{ env.baseUrl }}/health
          method: GET
          check:
            status: 200
```

### Bruno / Hoppscotch

Git-friendly **API clients** + test execution via CLI.

**Features**:
- OSS alternatives to Postman/Insomnia
- Manage collections as files (Git-manageable)
- Automate tests via CLI

**Good fit for**:
- Primarily manual API testing with some automation
- Migration from Postman

---

### Candidate Comparison

#### Test Framework: Vitest vs Jest

| Criterion | Vitest | Jest |
|-----------|--------|------|
| **ESM support** | Native | Experimental, requires setup |
| **TypeScript** | Native | Requires ts-jest |
| **Performance** | Fast (HMR-based) | Relatively slow |
| **Configuration** | Minimal | Requires babel, ts-jest, etc. |
| **Memory usage** | ~30% reduction | Issues at scale |
| **Jest compatibility** | 95% compatible | - |

**Conclusion**: Since this project uses ESM + TypeScript, **Vitest is adopted**.

#### API Test Client: testClient vs Supertest

| Criterion | Hono testClient | Supertest |
|-----------|-----------------|-----------|
| **Type safety** | Full type inference | None |
| **IDE completion** | Route auto-completion | None |
| **Framework** | Hono-specific | Generic (Express, etc.) |
| **Server startup** | Not required (direct testing) | Auto-binds |
| **Learning curve** | Low (for Hono users) | Low |

**Conclusion**: Since Hono is used, the type-safe **testClient is adopted**.

## Vitest + testClient Integration Test Design

Specific integration test design based on this project's structure.

### Design Policy

- **Use real DB**: Use MySQL started by `pnpm dev` as-is
- **Mock only external services**: Only mock external APIs, email sending, notification services, etc.
- **Mock authentication**: Inject test users directly

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Test Layer                             │
├─────────────────────────────────────────────────────────────┤
│  testClient(app) ──▶ Routes ──▶ UseCase ──▶ Repository     │
│       ↑                 ↑          ↑           ↑            │
│    Type-safe       Auth mock   Real Container  Real DB      │
│                                     ↓                       │
│                         Mock only external services         │
│                    (ExternalAPI, AuthService, Email, etc.)   │
└─────────────────────────────────────────────────────────────┘
```

### External Services to Mock

| Service | File | Purpose |
|---------|------|---------|
| `ThirdPartyAPIClient` | `infra/external/apiClient.ts` | Communication with external API |
| `AuthService` | `infra/auth/tokenService.ts` | Auth token issuance |
| `AlertService` | `infra/notification/notificationService.ts` | Notification sending |
| `FileStorageService` | `infra/storage/fileStorageService.ts` | File storage operations |
| `MessageService` | `infra/email/emailService.ts` | Email sending |

---

## Setup Steps

### 1. Install Dependencies

```bash
pnpm add -D vitest @vitest/coverage-v8 --filter server
```

### 2. Create Vitest Config File

`services/api/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['domain/**', 'usecase/**', 'infra/**'],
      exclude: ['**/*.test.ts', '**/node_modules/**'],
    },
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000, // Longer timeout due to DB operations
    // Serial execution (to avoid DB state conflicts)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
})
```

### 3. Test Setup File

`services/api/test/setup.ts`:

```typescript
import { beforeAll, afterAll, afterEach, vi } from 'vitest'
import { getDb } from '../infra/repository/mysql/db'

// Environment variables (expected to be read from .env.local, but can be set explicitly)
beforeAll(() => {
  process.env.NODE_ENV = 'test'
})

// Reset mocks after each test
afterEach(() => {
  vi.restoreAllMocks()
})

// Close DB connection after tests finish
afterAll(async () => {
  const dbResult = await getDb()
  if (!dbResult.err) {
    // Close Drizzle connection pool (if needed)
  }
})
```

### 4. Add package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Test Helper Design

### Directory Structure

```
services/api/
├── test/
│   ├── setup.ts                 # Global setup
│   ├── helpers/
│   │   ├── createTestApp.ts     # Test app factory
│   │   ├── createTestContainer.ts # Container with AI mocks
│   │   ├── mockExternal.ts      # External service mocks
│   │   ├── testDb.ts            # DB utilities
│   │   └── testUser.ts          # Test user creation
│   └── integration/
│       └── routes/
│           ├── item.test.ts
│           ├── order.test.ts
│           └── item.test.ts
```

### External Service Mocks

`services/api/test/helpers/mockExternal.ts`:

```typescript
import { vi } from 'vitest'
import { Ok } from '@vspo-lab/errors'
import type { ThirdPartyAPIClient } from '../../infra/external/apiClient'
import type { AuthService } from '../../infra/auth/tokenService'

/**
 * ThirdPartyAPIClient mock
 */
export const createMockThirdPartyAPIClient = (): ThirdPartyAPIClient => ({
  fetch: vi.fn().mockResolvedValue(
    Ok({
      data: { id: 'item-123', status: 'success' },
      metadata: { processedAt: new Date().toISOString() },
    })
  ),
  post: vi.fn().mockResolvedValue(
    Ok({
      id: 'created-123',
      status: 'created',
    })
  ),
})

/**
 * AuthService mock
 */
export const createMockAuthService = (): typeof AuthService => ({
  createToken: vi.fn().mockResolvedValue(Ok('mock-token-xxx')),
  verifyToken: vi.fn().mockResolvedValue(Ok({ itemId: 'user-123', valid: true })),
})

/**
 * AlertService mock
 */
export const createMockAlertService = () => ({
  send: vi.fn().mockResolvedValue(Ok({ sent: true, messageId: 'msg-123' })),
})

/**
 * MessageService mock
 */
export const createMockMessageService = () => ({
  send: vi.fn().mockImplementation(async (to: string, subject: string) => Ok({ sent: true })),
})
```

### Test Container Factory

`services/api/test/helpers/createTestContainer.ts`:

```typescript
import { vi } from 'vitest'
import type { Container } from '../../infra/di/container'
import { TaskUseCase } from '../../usecase/task'
import { ReportUseCase } from '../../usecase/report'
import { UserUseCase } from '../../usecase/user'
// ... other UseCases

// Import real Repositories
import { TaskRepository } from '../../infra/repository/task'
import { ReportRepository } from '../../infra/repository/report'
import { UserRepository } from '../../infra/repository/user'
import { TxManager } from '../../infra/repository/txManager'
// ... other Repositories

import {
  createMockThirdPartyAPIClient,
  createMockAuthService,
  createMockAlertService,
  createMockMessageService,
} from './mockExternal'

/**
 * Create a test Container
 * - Repository: Real (real DB connection)
 * - External services: Mocked
 */
export const createTestContainer = (): Container => {
  // External service mocks
  const externalAPIClient = createMockThirdPartyAPIClient()
  const tokenService = createMockAuthService()
  const notificationService = createMockAlertService()
  const emailService = createMockMessageService()

  // External service mocks (API integration)
  const mockExternalService = {
    fetch: vi.fn().mockResolvedValue(Ok({ data: { id: 'item-123' }, status: 'success' })),
    post: vi.fn().mockResolvedValue(Ok({ id: 'created-123', status: 'created' })),
  }

  const externalService = {
    execute: vi.fn().mockResolvedValue(Ok({ url: 'https://external-service.example.com/test' })),
    handleCallback: vi.fn(),
  }

  // Real Repositories (real DB connection)
  const txManager = TxManager
  const userRepository = UserRepository
  const taskRepository = TaskRepository
  const reportRepository = ReportRepository
  // ... other Repositories

  // Assemble UseCases (external services mocked, Repositories real)
  const userUseCase = UserUseCase.from({ userRepository, txManager })

  const taskUseCase = TaskUseCase.from({
    taskRepository,
    reportRepository,
    userRepository,
    txManager,
    // ... other dependencies
  })

  const reportUseCase = ReportUseCase.from({
    reportRepository,
    taskRepository,
    txManager,
  })

  // ... other UseCases

  return {
    userUseCase,
    taskUseCase,
    reportUseCase,
    tokenService,             // <- Mock
    notificationService,      // <- Mock
    externalService,          // <- Mock
    // ... others
  } as Container
}
```

### Test App Factory

`services/api/test/helpers/createTestApp.ts`:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi'
import { contextStorage } from 'hono/context-storage'
import type { MiddlewareHandler } from 'hono'
import type { HonoEnv } from '../../infra/http/hono/env'
import type { Container } from '../../infra/di/container'
import { handleError, handleZodError } from '../../infra/http/hono/error'
import { registerRoutes } from '../../infra/http/hono/routes'

export type TestAppOptions = {
  container: Container
  itemId: string
  user?: {
    id: string
    email: string
    name: string
  }
}

/**
 * Create a test Hono app
 * - Inject real Container (only AI mocked)
 * - Bypass auth and inject test user
 */
export const createTestApp = (options: TestAppOptions) => {
  const app = new OpenAPIHono<HonoEnv>({
    defaultHook: handleZodError,
  })

  app.use(contextStorage())
  app.onError(handleError)

  // Test middleware
  const testMiddleware: MiddlewareHandler<HonoEnv> = async (c, next) => {
    c.set('container', options.container)
    c.set('requestId', `test-${Date.now()}`)
    c.set('itemId', options.itemId)
    c.set('user', options.user ?? {
      id: options.itemId,
      email: 'test@example.com',
      name: 'Test User',
    })
    c.set('session', {
      id: 'test-session',
      itemId: options.itemId,
      expiresAt: new Date(Date.now() + 86400000),
    })
    await next()
  }

  app.use('*', testMiddleware)

  // Register all routes
  return registerRoutes(app)
}
```

### DB Utilities

`services/api/test/helpers/testDb.ts`:

```typescript
import { getDb } from '../../infra/repository/mysql/db'
import { items, orders } from '../../infra/repository/mysql/schema'
import { eq } from 'drizzle-orm'

/**
 * Create a test user
 */
export const createTestItem = async (data: {
  id: string
  email: string
  name: string
}) => {
  const dbResult = await getDb()
  if (dbResult.err) throw dbResult.err

  const db = dbResult.val
  await db.insert(items).values({
    id: data.id,
    email: data.email,
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return data
}

/**
 * Clean up test data
 */
export const cleanupTestData = async (itemId: string) => {
  const dbResult = await getDb()
  if (dbResult.err) throw dbResult.err

  const db = dbResult.val

  // Delete related data (note foreign key constraint order)
  await db.delete(// ... other tables.where(eq/itemId, itemId))
  await db.delete(orders).where(eq(orders.itemId, itemId))
  await db.delete(items).where(eq(items.id, itemId))
}

/**
 * Execute test within a transaction (auto-rollback)
 */
export const withTestTransaction = async <T>(
  fn: (tx: typeof db) => Promise<T>
): Promise<T> => {
  const dbResult = await getDb()
  if (dbResult.err) throw dbResult.err

  const db = dbResult.val

  return db.transaction(async (tx) => {
    const result = await fn(tx)
    // Always rollback after test
    throw new RollbackError(result)
  }).catch((e) => {
    if (e instanceof RollbackError) {
      return e.result
    }
    throw e
  })
}

class RollbackError<T> extends Error {
  constructor(public result: T) {
    super('Rollback')
  }
}
```

---

## Test Implementation Examples

### Item API Test (Real DB)

`services/api/test/integration/routes/item.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { testClient } from 'hono/testing'
import { createTestApp } from '../../helpers/createTestApp'
import { createTestContainer } from '../../helpers/createTestContainer'
import { createTestItem, cleanupTestData } from '../../helpers/testDb'

describe('Item API', () => {
  const TEST_ITEM_ID = `test-item-${Date.now()}`
  const container = createTestContainer()

  const app = createTestApp({
    container,
    itemId: TEST_ITEM_ID,
  })

  const client = testClient(app)

  // Create test user
  beforeAll(async () => {
    await createTestItem({
      id: TEST_ITEM_ID,
      status: 'active',
      name: 'Test Item',
    })
  })

  // Clean up after tests
  afterAll(async () => {
    await cleanupTestData(TEST_ITEM_ID)
  })

  describe('GET /me', () => {
    it('Can retrieve item information', async () => {
      const res = await client.me.$get()

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(TEST_ITEM_ID)
      expect(data.email).toBe('integration-test@example.com')
    })
  })

  describe('PUT /me', () => {
    it('Can update item information', async () => {
      const res = await client.me.$put({
        json: {
          name: 'Updated Item Name',
          category: 'Category A',
        },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.name).toBe('Updated Name')

      // Verify it was persisted to DB
      const getRes = await client.me.$get()
      const getData = await getRes.json()
      expect(getData.name).toBe('Updated Name')
    })
  })
})
```

### Order API Test (External Service Mocks)

```typescript
// services/api/test/integration/routes/order.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from 'hono/testing'
import { createTestApp } from '../../helpers/createTestApp'
import { createTestContainer } from '../../helpers/createTestContainer'
import { createTestItem, cleanupTestData } from '../../helpers/testDb'

describe('Order API', () => {
  const TEST_ITEM_ID = `test-order-${Date.now()}`
  const container = createTestContainer()

  const app = createTestApp({
    container,
    itemId: TEST_ITEM_ID,
  })

  const client = testClient(app)

  beforeAll(async () => {
    await createTestItem({
      id: TEST_ITEM_ID,
      email: 'task-test@example.com',
      name: 'Order Test Item',
    })
  })

  afterAll(async () => {
    await cleanupTestData(TEST_ITEM_ID)
  })

  describe('POST /tasks', () => {
    it('Can create a new order', async () => {
      const res = await client['tasks'].$post({
        json: {
          title: 'Test Order',
          description: 'Test Order Description',
        },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBeDefined()
      expect(data.status).toBe('pending')
    })
  })

  describe('POST /tasks/:id/complete', () => {
    it('Generates results on order processing (external services mocked)', async () => {
      // Create order
      const createRes = await client['tasks'].$post({
        json: {
          title: 'Test Order',
          description: 'Test Order Description',
        },
      })
      const order = await createRes.json()

      // Process order
      const completeRes = await client['tasks'][':id'].complete.$post({
        param: { id: order.id },
        json: {
          items: [
            { productId: 'step1', quantity: 1 },
            { productId: 'step2', quantity: 1 },
          ],
        },
      })

      expect(completeRes.status).toBe(200)
      const result = await completeRes.json()

      // Results were generated (response from mock)
      expect(result.processed).toBeDefined()
      expect(result.processed.status).toBe('completed')
    })
  })
})
```

### Test with Transaction Rollback

```typescript
import { describe, it, expect } from 'vitest'
import { withTestTransaction } from '../../helpers/testDb'

describe('Item API with Transaction Rollback', () => {
  it('Tests item processing (auto-rollback)', async () => {
    await withTestTransaction(async (tx) => {
      // DB operations within this transaction
      // are automatically rolled back after the test

      // Create test data
      await tx.insert(items).values({ ... })

      // API test
      // ...

      // Assertions
      expect(...).toBe(...)
    })
    // Rolled back here
  })
})
```

---

## GitHub Actions Configuration (Real DB)

`.github/workflows/api-test.yml`:

```yaml
name: API Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: my_app_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/my_app_test

      - name: Run API tests
        run: pnpm --filter server test:run
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/my_app_test
          NODE_ENV: test
          # AI service API keys not needed (mocked)

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./services/api/coverage/coverage-final.json
```

## GitHub Actions Configuration

### Basic CI Workflow

`.github/workflows/api-test.yml`:

```yaml
name: API Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run API tests
        run: pnpm --filter server test:run
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
          NODE_ENV: test

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./services/api/coverage/coverage-final.json
          fail_ci_if_error: false
```

### Workflow with Coverage Report

```yaml
name: API Tests with Coverage

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run tests with coverage
        run: pnpm --filter server test:coverage
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
          NODE_ENV: test

      - name: Comment coverage on PR
        uses: davelosert/vitest-coverage-report-action@v2
        if: github.event_name == 'pull_request'
        with:
          working-directory: ./services/api
```

## Test Classification and Recommended Structure

### Test Types

| Type | Target | Environment | Frequency |
|------|--------|-------------|-----------|
| **Unit** | Domain, UseCase | Mocked | Per PR |
| **Integration** | API Routes + DB | Real DB (test) | Per PR |
| **E2E** | Full flow | Production-equivalent | Pre-deploy |

### Directory Structure Proposal

```
services/api/
├── test/
│   ├── setup.ts           # Test setup
│   ├── helpers/           # Test helpers
│   │   ├── db.ts         # DB test utilities
│   │   └── auth.ts       # Auth mocks
│   └── fixtures/          # Test data
│       └── users.ts
├── domain/
│   └── domain/
│       └── item.test.ts   # Domain tests
├── usecase/
│   └── item.test.ts       # Use case tests
└── infra/
    └── http/
        └── routes/
            └── item.test.ts  # API tests
```

## External Service Mock Strategy

### External API Service

```typescript
// test/helpers/external-mock.ts
import { vi } from 'vitest'

export const mockExternalServices = () => {
  return {
    externalAPIClient: {
      fetch: vi.fn().mockResolvedValue(
        Ok({ data: { id: 'item-123' }, status: 'success' })
      ),
    },
    notificationService: {
      send: vi.fn().mockResolvedValue(
        Ok({ sent: true, messageId: 'msg-123' })
      ),
    },
  }
}
```

### External API Service (Individual Mocks)

```typescript
// test/helpers/external-service-mock.ts
import { vi } from 'vitest'

export const mockExternalService = () => {
  return {
    fetch: vi.fn().mockResolvedValue(
      Ok({ data: { id: 'item-123' }, status: 'success' })
    ),
    post: vi.fn().mockResolvedValue(
      Ok({ id: 'created-123', status: 'created' })
    ),
  }
}
```

## Test Patterns with Result Type

Since this project uses the `Result` type, tests need to handle it accordingly.

```typescript
import { Ok, Err, isOk, isErr } from '@vspo-lab/errors'

describe('UserUseCase', () => {
  it('Returns Ok on successful user creation', async () => {
    const result = await userUseCase.createUser({ email: 'test@example.com' })

    expect(isOk(result)).toBe(true)
    if (isOk(result)) {
      expect(result.val.email).toBe('test@example.com')
    }
  })

  it('Returns Err on duplicate email', async () => {
    const result = await userUseCase.createUser({ email: 'duplicate@example.com' })

    expect(isErr(result)).toBe(true)
    if (isErr(result)) {
      expect(result.err.code).toBe('DUPLICATE_EMAIL')
    }
  })
})
```

## GitHub Actions: OpenAPI Contract Tests

### Automated Tests with Schemathesis

`.github/workflows/openapi-test.yml`:

```yaml
name: OpenAPI Contract Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  schemathesis:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Schemathesis
        run: pip install schemathesis

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Start API server
        run: |
          pnpm --filter server dev &
          sleep 5  # Wait for server startup
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run Schemathesis tests
        run: |
          schemathesis run http://localhost:8787/doc \
            --checks all \
            --hypothesis-max-examples 50 \
            --report
        continue-on-error: true

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: schemathesis-report
          path: .schemathesis/
```

### Declarative Tests with Step CI

`.github/workflows/stepci-test.yml`:

```yaml
name: Step CI API Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  stepci:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd "mysqladmin ping -proot"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm --filter server db:migrate
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Start API server
        run: |
          pnpm --filter server dev &
          sleep 5
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db

      - name: Run Step CI tests
        run: npx stepci run stepci.yml
```

---

## Recommended Test Strategy

### Combined Approach

| Layer | Tool | Purpose |
|-------|------|---------|
| **Unit** | Vitest | Unit tests for domain logic and use cases |
| **Integration** | Vitest + testClient | Integration tests for API routes (DI mocks) |
| **Contract** | Schemathesis | OpenAPI spec consistency and edge case detection |
| **E2E** | Step CI / Bruno | Scenario-based integration tests |

### Phased Adoption Recommendation

1. **Phase 1**: Build basic API tests with Vitest + testClient
2. **Phase 2**: Add Schemathesis to CI for automatic OpenAPI consistency verification
3. **Phase 3**: Add scenario tests with Step CI as needed

---

## Reference Links

### Official Documentation

- [Vitest Official](https://vitest.dev/)
- [Hono Testing Guide](https://hono.dev/docs/guides/testing)
- [Hono Testing Helper](https://hono.dev/docs/helpers/testing)
- [Schemathesis Official](https://schemathesis.io/)
- [Step CI Official](https://stepci.com/)
- [Bruno Official](https://www.usebruno.com/)
- [Hoppscotch Official](https://hoppscotch.io/)
- [Dredd](https://dredd.org/)
- [Prism](https://stoplight.io/open-source/prism)

### Comparison and Explanation Articles

- [Jest vs Vitest: Which Test Runner Should You Use in 2025?](https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9)
- [Vitest vs Jest Comparison](https://vitest.dev/guide/comparisons)
- [OpenAPI Testing and Validation](https://openapispec.com/docs/testing-and-validation/)
- [Automated Contract Testing with OpenAPI and Dredd](https://dev.to/r3d_cr0wn/enforcing-api-correctness-automated-contract-testing-with-openapi-and-dredd-2212)
- [Step CI: Automate API Testing](https://garysvenson09.medium.com/step-ci-automate-api-testing-7edebe796be7)
- [GitHub Actions MySQL Testing](https://blogs.oracle.com/mysql/running-mysql-tests-with-github-actions)
