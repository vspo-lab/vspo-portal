# Unit Testing (Project-Specific Patterns)

> General unit testing guidelines: [docs/testing/unit-testing.md](../testing/unit-testing.md)
> TDD workflow: [docs/web-frontend/twada-tdd.md](./twada-tdd.md)

## Quick Start

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run (CI)
pnpm test:coverage     # With coverage
pnpm --filter api test:run   # API only
pnpm --filter web vitest run # Web only
```

## Mock Patterns

### TxManager Mock

```typescript
import type { TxManager } from "../infra/repository/txManager";

const mockTxManager: TxManager = {
  runTx: vi.fn(async (operation) => operation({} as never)),
};
```

### Repository Mock (with `from()` pattern)

```typescript
import type { UserRepository } from "../infra/repository/user";

let getByIdMock: ReturnType<typeof vi.fn<(id: string) => Promise<Result<User, AppError>>>>;
let updateMock: ReturnType<typeof vi.fn<(user: User) => Promise<Result<User, AppError>>>>;

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

### External API Service Mock

```typescript
const createMockExternalAPI = () => ({
  resources: { create: vi.fn(), retrieve: vi.fn(), list: vi.fn() },
  actions: { execute: vi.fn() },
  webhooks: { verifySignature: vi.fn() },
});
```

## Use Case Test Pattern

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
      repoResult: () => Err(new AppError({ message: "User not found", code: "NOT_FOUND" })),
      expectOk: false,
      expectedCode: "NOT_FOUND",
    },
  ];

  it.each(testCases)("$name", async ({ userId, repoResult, expectOk, expectedCode }) => {
    getByIdMock.mockResolvedValue(repoResult());
    const result = await useCase.getById({ userId });

    expect(getByIdMock).toHaveBeenCalledWith(userId);
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
  const result = await userUseCase.createUser({ email: "test@example.com" });
  expect(result.err).toBeUndefined();
  expect(result.val?.email).toBe("test@example.com");
});

it("Returns Err on duplicate email", async () => {
  const result = await userUseCase.createUser({ email: "duplicate@example.com" });
  expect(result.err).toBeDefined();
  expect(result.err?.code).toBe("DUPLICATE_EMAIL");
});
```

## Test Helper Factory

```typescript
const createMockItem = (overrides: Partial<Item> = {}): Item => ({
  id: "item-123",
  name: "Test Item",
  status: "active",
  createdAt: new Date("2025-01-01T00:00:00.000Z"),
  updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  ...overrides,
});
```

## Test Naming Conventions

```typescript
const testCases = [
  { name: "Returns Ok when user is found", ... },    // Success
  { name: "Returns Err when user is not found", ... }, // Error
  { name: "Can create a new item", ... },              // Capability
  { name: "When status is draft, then ...", ... },     // Conditional
];
```

## File Structure

```
services/api/
├── domain/**/*.test.ts          # Domain model tests (colocation)
├── usecase/**/*.test.ts         # Use case tests (colocation)
├── pkg/**/*.test.ts             # Utility tests (colocation)
├── infra/external-api/*.test.ts # Infra layer tests
├── test/integration/            # Integration tests (separate config)
├── vitest.config.ts
└── vitest.setup.ts
```
