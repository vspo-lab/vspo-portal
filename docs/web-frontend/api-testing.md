# API Testing (Project-Specific Patterns)

> General API testing guidelines: [docs/testing/api-testing.md](../testing/api-testing.md)
> TDD workflow: [docs/web-frontend/twada-tdd.md](./twada-tdd.md)

## Quick Start

```bash
pnpm --filter api test:run          # Unit + integration
pnpm --filter api test:integration  # Integration only
```

## Architecture

```
testClient(app) --> Routes --> UseCase --> Repository
     ^                ^          ^           ^
  Type-safe       Auth mock   Real DI     Real DB

  Mock only: external API, auth tokens, email, notifications
```

### What to Mock

| Service | Mock Purpose |
|---------|-------------|
| `ThirdPartyAPIClient` | External API calls |
| `AuthService` | Token issuance/verification |
| `AlertService` | Notifications |
| `FileStorageService` | File storage |
| `MessageService` | Email sending |

## Test Container Factory

```typescript
// test/helpers/createTestContainer.ts
import {
  createMockThirdPartyAPIClient,
  createMockAuthService,
  createMockAlertService,
  createMockMessageService,
} from "./mockExternal";

export const createTestContainer = (): Container => {
  // Real repositories (real DB)
  const txManager = TxManager;
  const userRepository = UserRepository;
  const taskRepository = TaskRepository;

  // Mock external services only
  const externalAPIClient = createMockThirdPartyAPIClient();
  const tokenService = createMockAuthService();
  const notificationService = createMockAlertService();

  // Wire use cases with real repos + mock externals
  const userUseCase = UserUseCase.from({ userRepository, txManager });
  const taskUseCase = TaskUseCase.from({ taskRepository, userRepository, txManager });

  return { userUseCase, taskUseCase, tokenService, notificationService } as Container;
};
```

## Test App Factory

```typescript
// test/helpers/createTestApp.ts
export const createTestApp = (options: TestAppOptions) => {
  const app = new OpenAPIHono<HonoEnv>({ defaultHook: handleZodError });
  app.use(contextStorage());
  app.onError(handleError);

  // Bypass auth, inject test user + container
  app.use("*", async (c, next) => {
    c.set("container", options.container);
    c.set("requestId", `test-${Date.now()}`);
    c.set("itemId", options.itemId);
    c.set("user", options.user ?? {
      id: options.itemId,
      email: "test@example.com",
      name: "Test User",
    });
    await next();
  });

  return registerRoutes(app);
};
```

## External Service Mocks

```typescript
// test/helpers/mockExternal.ts
export const createMockThirdPartyAPIClient = () => ({
  fetch: vi.fn().mockResolvedValue(Ok({ data: { id: "item-123" }, status: "success" })),
  post: vi.fn().mockResolvedValue(Ok({ id: "created-123", status: "created" })),
});

export const createMockAuthService = () => ({
  createToken: vi.fn().mockResolvedValue(Ok("mock-token-xxx")),
  verifyToken: vi.fn().mockResolvedValue(Ok({ itemId: "user-123", valid: true })),
});

export const createMockAlertService = () => ({
  send: vi.fn().mockResolvedValue(Ok({ sent: true, messageId: "msg-123" })),
});
```

## Integration Test Example

```typescript
// test/integration/routes/item.test.ts
describe("Item API", () => {
  const TEST_ITEM_ID = `test-item-${Date.now()}`;
  const container = createTestContainer();
  const app = createTestApp({ container, itemId: TEST_ITEM_ID });
  const client = testClient(app);

  beforeAll(async () => {
    await createTestItem({ id: TEST_ITEM_ID, status: "active", name: "Test Item" });
  });

  afterAll(async () => {
    await cleanupTestData(TEST_ITEM_ID);
  });

  describe("GET /me", () => {
    it("Can retrieve item information", async () => {
      const res = await client.me.$get();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(TEST_ITEM_ID);
    });
  });

  describe("PUT /me", () => {
    it("Can update item information", async () => {
      const res = await client.me.$put({ json: { name: "Updated Name" } });
      expect(res.status).toBe(200);

      // Verify persistence
      const getRes = await client.me.$get();
      const getData = await getRes.json();
      expect(getData.name).toBe("Updated Name");
    });
  });
});
```

## DB Test Utilities

```typescript
// test/helpers/testDb.ts
export const createTestItem = async (data: { id: string; email: string; name: string }) => {
  const db = (await getDb()).val;
  await db.insert(items).values({ ...data, createdAt: new Date(), updatedAt: new Date() });
};

export const cleanupTestData = async (itemId: string) => {
  const db = (await getDb()).val;
  await db.delete(orders).where(eq(orders.itemId, itemId));
  await db.delete(items).where(eq(items.id, itemId));
};

/** Execute test within a transaction (auto-rollback) */
export const withTestTransaction = async <T>(fn: (tx: typeof db) => Promise<T>): Promise<T> => {
  const db = (await getDb()).val;
  return db.transaction(async (tx) => {
    const result = await fn(tx);
    throw new RollbackError(result);
  }).catch((e) => {
    if (e instanceof RollbackError) return e.result;
    throw e;
  });
};
```

## File Structure

```
services/api/test/
├── setup.ts
├── helpers/
│   ├── createTestApp.ts
│   ├── createTestContainer.ts
│   ├── mockExternal.ts
│   └── testDb.ts
└── integration/
    └── routes/
        ├── item.test.ts
        └── order.test.ts
```

## OpenAPI Contract Testing

Use [Schemathesis](https://schemathesis.readthedocs.io/) to auto-generate tests from the `/doc` endpoint:

```bash
pip install schemathesis
schemathesis run http://localhost:8787/doc --checks all
```
