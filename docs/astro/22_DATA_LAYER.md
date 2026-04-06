# Data Layer Improvements

## Current Architecture

### Layer Overview

```text
Astro Page / Action
  → UseCase (orchestration)
    → Repository (data access)
      → Cloudflare Workers RPC (APP_WORKER service binding)
        → vspo-server (Go backend)
```

### Repository Inventory

| Repository | File | Methods | RPC Target |
|-----------|------|---------|------------|
| `VspoChannelApiRepository` | `features/channel/repository/vspo-channel-api.ts` | `getGuildConfig`, `updateChannel`, `listCreators`, `enableChannel`, `listGuildChannels`, `deleteChannel` | `DiscordService`, `CreatorService` |
| `VspoGuildApiRepository` | `features/guild/repository/vspo-guild-api.ts` | `getBotGuildIds`, `getBotStats`, `checkUserGuildAdmin` | `DiscordService` |
| `DiscordApiRepository` | `features/auth/repository/discord-api.ts` | `exchangeCode`, `refreshToken`, `getCurrentUser`, `getUserGuilds` | Discord REST API (direct HTTP) |

### UseCase Inventory

| UseCase | File | Calls |
|---------|------|-------|
| `AddChannelUsecase` | `features/channel/usecase/add-channel.ts` | `VspoChannelApiRepository.enableChannel` |
| `DeleteChannelUsecase` | `features/channel/usecase/delete-channel.ts` | `VspoChannelApiRepository.deleteChannel` |
| `ListGuildsUsecase` | `features/guild/usecase/list-guilds.ts` | `DiscordApiRepository.getUserGuilds`, `VspoGuildApiRepository.getBotGuildIds`, `VspoGuildApiRepository.checkUserGuildAdmin`, `VspoChannelApiRepository.getGuildConfig` |
| `LoginUsecase` | `features/auth/usecase/login.ts` | `DiscordApiRepository.exchangeCode`, `DiscordApiRepository.getCurrentUser` |

### Domain Model Inventory

| Domain | File | Exports |
|--------|------|---------|
| `GuildSummary` | `features/guild/domain/guild.ts` | `GuildSummarySchema`, `GuildBotConfigSchema`, `GuildSummary.*` (helper functions) |
| `DiscordUser` | `features/auth/domain/discord-user.ts` | `DiscordUserSchema`, `DiscordUser.*` |
| `ChannelConfig` | `features/channel/domain/channel-config.ts` | `ChannelConfigSchema` |
| `MemberType` | `features/channel/domain/member-type.ts` | `MemberTypeSchema`, `requiresCustomSelection` |
| `Creator` | `features/shared/domain/creator.ts` | `CreatorSchema`, `Creator.*` |

## Issue 1: RPC Service Binding Type Safety

### Current State

The `ApplicationService` type is imported from `~/types/api` and represents the `APP_WORKER` Cloudflare Workers service binding. Every repository method accepts `appWorker: ApplicationService` as the first parameter.

```typescript
// Every repository method
getGuildConfig: async (
  appWorker: ApplicationService,
  guildId: string,
): Promise<Result<GuildBotConfigType, AppError>> => {
  if (isRpcUnavailable(appWorker)) {
    return Ok(devMock.guildConfig(guildId));
  }
  const discord = appWorker.newDiscordUsecase();
  // ...
};
```

### Issues

1. **Repeated `appWorker` parameter**: Every repository method and every usecase must thread `appWorker` through. This creates noise and makes it easy to forget.
2. **`isRpcUnavailable` check in every method**: Each repository method starts with the same guard clause, violating DRY.
3. **No RPC error typing**: The return types from `discord.get()`, `discord.listGuildChannels()`, etc. are inferred from the service binding but lack explicit Zod validation on the RPC response boundary.

### Proposed: Repository Factory with Built-in Mock Fallback

```typescript
// features/shared/lib/rpc-repository.ts
import type { ApplicationService } from "~/types/api";
import { isRpcUnavailable } from "~/features/shared/dev-mock";

/**
 * Create a repository method that automatically handles dev-mock fallback.
 * @param mockFn - Function returning mock data for dev mode
 * @param rpcFn - Function executing the real RPC call
 */
export const withMockFallback = <TArgs extends unknown[], TResult>(
  mockFn: (...args: TArgs) => TResult,
  rpcFn: (appWorker: ApplicationService, ...args: TArgs) => TResult,
) => {
  return (appWorker: ApplicationService, ...args: TArgs): TResult => {
    if (isRpcUnavailable(appWorker)) {
      return mockFn(...args);
    }
    return rpcFn(appWorker, ...args);
  };
};
```

### Usage

```typescript
const getGuildConfig = withMockFallback(
  (guildId: string) => Ok(devMock.guildConfig(guildId)),
  async (appWorker, guildId: string) => {
    const discord = appWorker.newDiscordUsecase();
    const result = await discord.get(guildId);
    // ... transform
  },
);
```

### Trade-off

This abstraction reduces boilerplate but adds indirection. Given there are only ~9 repository methods total, the current explicit pattern is also acceptable. The factory becomes more valuable if new repository methods are added frequently.

## Issue 2: MemberType Frontend/Server Mapping

### Current State

Two mapping functions handle the mismatch between the server's member type enum and the frontend's:

```typescript
// Server → Frontend
const toFrontendMemberType = (
  serverMemberType: "vspo_jp" | "vspo_en" | "vspo_ch" | "vspo_all" | "general" | undefined,
  selectedMemberIds?: string[],
): MemberTypeValue => { ... };

// Frontend → Server
const toServerMemberType = (
  frontendMemberType: MemberTypeValue,
): "vspo_jp" | "vspo_en" | "vspo_all" | "general" => { ... };
```

### Issues

1. **`vspo_ch` silently maps to `"all"`**: The Chinese member type exists on the server but is treated as "all" on the frontend without any indication. If `vspo_ch` members are added in the future, this mapping will silently swallow them.
2. **`general` maps to `"all"`**: The "general" server type has no explicit frontend representation.
3. **`"custom"` is a frontend-only concept**: It's derived from `"vspo_all"` + non-empty `selectedMemberIds`, which is a business rule embedded in the mapping function rather than the domain model.
4. **No exhaustive type checking**: The `toServerMemberType` switch has a `default` case that hides missing branches.

### Proposed: Move Mapping Logic to Domain Layer

```typescript
// features/channel/domain/member-type.ts
import { z } from "astro:schema";

export const MemberTypeSchema = z.enum(["vspo_jp", "vspo_en", "all", "custom"]);
export type MemberTypeValue = z.infer<typeof MemberTypeSchema>;

/** Server member type enum from vspo-server API */
export const ServerMemberTypeSchema = z.enum([
  "vspo_jp", "vspo_en", "vspo_ch", "vspo_all", "general",
]);
export type ServerMemberTypeValue = z.infer<typeof ServerMemberTypeSchema>;

/**
 * Derive the frontend MemberType from server data.
 * @precondition serverType is a valid ServerMemberTypeValue or undefined
 * @postcondition Returns a valid MemberTypeValue
 */
export const fromServerMemberType = (
  serverType: ServerMemberTypeValue | undefined,
  selectedMemberIds?: string[],
): MemberTypeValue => {
  switch (serverType) {
    case "vspo_jp":
      return "vspo_jp";
    case "vspo_en":
      return "vspo_en";
    case "vspo_all":
      return selectedMemberIds && selectedMemberIds.length > 0
        ? "custom"
        : "all";
    case "vspo_ch":
    case "general":
    case undefined:
      return "all";
  }
};

/**
 * Convert frontend MemberType to the server API value.
 * @precondition frontendType is a valid MemberTypeValue
 * @postcondition Returns a valid server member type string
 */
export const toServerMemberType = (
  frontendType: MemberTypeValue,
): ServerMemberTypeValue => {
  switch (frontendType) {
    case "vspo_jp":
      return "vspo_jp";
    case "vspo_en":
      return "vspo_en";
    case "custom":
    case "all":
      return "vspo_all";
  }
};
```

### Benefits

- Mapping logic lives in the domain layer alongside the type definition
- Server type enum is explicitly defined with Zod
- No `default` case — TypeScript exhaustive checking catches missing branches
- `fromServerMemberType` / `toServerMemberType` naming clarifies direction

## Issue 3: Thin UseCase Layer

### Current State

`AddChannelUsecase` and `DeleteChannelUsecase` are pure pass-through wrappers:

```typescript
// add-channel.ts
const execute = async (params: AddChannelParams): Promise<Result<void, AppError>> => {
  return VspoChannelApiRepository.enableChannel(
    params.appWorker, params.guildId, params.channelId,
  );
};
```

### Analysis

These usecases exist for architectural consistency and as extension points. While they currently add no business logic, they provide value as:

1. **Boundary for authorization checks**: Guild membership verification (see `20_API_ROUTES.md`) should be added here, not in the repository
2. **Audit logging point**: Channel add/delete operations could be logged for admin visibility
3. **Input validation boundary**: Discord Snowflake validation for `guildId` and `channelId`

### Proposed: Enrich Thin UseCases

```typescript
// features/channel/usecase/add-channel.ts
const execute = async (
  params: AddChannelParams,
): Promise<Result<void, AppError>> => {
  // Validate Discord Snowflake format
  if (!/^\d{17,20}$/.test(params.guildId)) {
    return Err(new AppError({ code: "BAD_REQUEST", message: "Invalid guild ID format" }));
  }
  if (!/^\d{17,20}$/.test(params.channelId)) {
    return Err(new AppError({ code: "BAD_REQUEST", message: "Invalid channel ID format" }));
  }

  return VspoChannelApiRepository.enableChannel(
    params.appWorker, params.guildId, params.channelId,
  );
};
```

If a usecase remains a pure pass-through with no foreseeable business logic, it is also acceptable to call the repository directly from the Action handler to reduce indirection. The project should decide on a convention and apply it consistently.

## Issue 4: Dev Mock System Improvements

### Current State

The dev mock system (`features/shared/dev-mock.ts`) provides fallback data when `APP_WORKER` is unavailable:

```typescript
export const isRpcUnavailable = (appWorker: ApplicationService): boolean => {
  if (import.meta.env.DEV) {
    const flag = "DEV_MOCK_AUTH" in env ? env.DEV_MOCK_AUTH : undefined;
    return flag !== "false";
  }
  if (!appWorker) return true;
  return typeof appWorker.newDiscordUsecase !== "function";
};
```

### Issues

1. **Write operations return `Err` in mock mode**: `updateChannel`, `enableChannel`, `deleteChannel` all return `Err(new AppError({ code: "INTERNAL_SERVER_ERROR", message: "APP_WORKER is not available" }))`. This means form submissions always fail in dev mode, making UI testing of the full flow impossible.
2. **JSDoc is in Japanese**: Comments should be in English for consistency with the rest of the codebase.
3. **`DEV_MOCK_AUTH` naming**: This flag controls both auth mocking AND RPC mocking. A more descriptive name like `DEV_USE_REAL_BACKEND` would be clearer.
4. **Mock data is static**: No way to simulate different guild states (empty guild, many channels, error states) without editing the source.

### Proposed: Mock Write Operations as No-ops

```typescript
// For write operations in dev mock mode, return Ok instead of Err
enableChannel: async (appWorker, guildId, channelId) => {
  if (isRpcUnavailable(appWorker)) {
    return Ok(undefined); // No-op success in dev mode
  }
  // ... real implementation
},
```

This allows the full form submission flow to be tested in dev mode. The data won't persist (since there's no real backend), but the UI flow completes successfully.

### Proposed: Configurable Mock Scenarios

```typescript
// features/shared/dev-mock.ts
type MockScenario = "default" | "empty" | "many-channels" | "error";

const getMockScenario = (): MockScenario => {
  if (!import.meta.env.DEV) return "default";
  const scenario = "DEV_MOCK_SCENARIO" in env
    ? (env as Record<string, unknown>).DEV_MOCK_SCENARIO
    : undefined;
  return (scenario as MockScenario) ?? "default";
};
```

## Issue 5: `adjustAndEnqueue` Two-Step Pattern

### Current State

The `adjustAndEnqueue` helper performs two sequential RPC calls:

```typescript
const adjustAndEnqueue = async (appWorker, params) => {
  const discord = appWorker.newDiscordUsecase();
  const result = await discord.adjustBotChannel(params);
  if (result.err) return result;
  await discord.batchUpsertEnqueue([result.val]);
  return Ok(undefined);
};
```

### Issues

1. **No error handling for `batchUpsertEnqueue`**: If the enqueue step fails, the channel is updated in KV cache but not persisted to D1. This creates a silent data inconsistency.
2. **The result of `batchUpsertEnqueue` is discarded**: The `await` ensures execution but the return value is ignored.

### Proposed: Handle Enqueue Errors

```typescript
const adjustAndEnqueue = async (
  appWorker: ApplicationService,
  params: AdjustBotChannelRpcParams & { type: "add" | "remove" },
): Promise<Result<void, AppError>> => {
  const discord = appWorker.newDiscordUsecase();
  const adjustResult = await discord.adjustBotChannel(params);
  if (adjustResult.err) return adjustResult;

  const enqueueResult = await discord.batchUpsertEnqueue([adjustResult.val]);
  if (enqueueResult.err) {
    // Log the error but don't fail the operation — KV cache is already updated.
    // The D1 persistence will be retried by the queue consumer.
    console.error("Failed to enqueue D1 persistence:", enqueueResult.err);
  }

  return Ok(undefined);
};
```

Whether this should be an `Err` return or a logged warning depends on the queue's retry semantics. If the queue guarantees eventual consistency through other mechanisms, logging is sufficient.

## Issue 6: Missing Repository Tests

### Current State

Repository methods are the primary data access layer but have no unit tests. Testing is challenging because:

1. They depend on Cloudflare Workers RPC (`APP_WORKER` service binding)
2. The `isRpcUnavailable` guard makes it hard to test the real code path
3. The dev mock system itself is untested

### Proposed: Test Strategy

**Unit tests for mapping functions** (no RPC dependency):

```typescript
// features/channel/domain/member-type.test.ts
import { describe, expect, it } from "vitest";
import { fromServerMemberType, toServerMemberType } from "./member-type";

describe("fromServerMemberType", () => {
  it("maps vspo_all with selected members to custom", () => {
    expect(fromServerMemberType("vspo_all", ["id1", "id2"])).toBe("custom");
  });

  it("maps vspo_all without selected members to all", () => {
    expect(fromServerMemberType("vspo_all", [])).toBe("all");
  });

  it("maps undefined to all", () => {
    expect(fromServerMemberType(undefined)).toBe("all");
  });
});
```

**Integration tests for dev mock** (verify mock data shapes match schemas):

```typescript
// features/shared/dev-mock.test.ts
import { describe, expect, it } from "vitest";
import { GuildBotConfigSchema } from "~/features/guild/domain/guild";
import { devMock } from "./dev-mock";

describe("devMock", () => {
  it("guildConfig matches GuildBotConfigSchema", () => {
    const result = GuildBotConfigSchema.safeParse(
      devMock.guildConfig("111111111111111111"),
    );
    expect(result.success).toBe(true);
  });
});
```

**Repository tests with mocked RPC** (for critical paths):

```typescript
// features/channel/repository/vspo-channel-api.test.ts
import { describe, expect, it, vi } from "vitest";
import { VspoChannelApiRepository } from "./vspo-channel-api";

// Mock isRpcUnavailable to return false
vi.mock("~/features/shared/dev-mock", () => ({
  isRpcUnavailable: () => false,
  devMock: {},
}));

describe("VspoChannelApiRepository.getGuildConfig", () => {
  it("returns empty channels for NOT_FOUND guild", async () => {
    const mockWorker = {
      newDiscordUsecase: () => ({
        get: vi.fn().mockResolvedValue({
          err: { code: "NOT_FOUND", message: "Guild not found" },
        }),
      }),
    };
    const result = await VspoChannelApiRepository.getGuildConfig(
      mockWorker as any,
      "123456789012345678",
    );
    expect(result.val).toEqual({ guildId: "123456789012345678", channels: [] });
  });
});
```

## Issue 7: `ListGuildsUsecase` Complexity

### Current State

`ListGuildsUsecase.execute` is the most complex usecase with 5 repository calls and multiple data transformations:

1. Fetch user guilds from Discord API (parallel)
2. Fetch bot guild IDs from vspo-server (parallel with #1)
3. Map to domain models
4. Check admin permissions for installed guilds
5. Optionally fetch channel configs for each installed guild (parallel per guild)

### Issues

1. **Silent error swallowing**: `adminCheckResult.err` falls back to `{}` silently. If the admin check fails, all guilds lose their admin status, and the user sees no guilds in the dashboard — without any error message.
2. **Per-guild channel fetch failures are swallowed**: `if (channelResult.err) return guild` hides individual fetch errors.
3. **No caching of bot guild IDs**: The bot guild ID set rarely changes but is fetched on every dashboard load.

### Proposed Improvements

**1. Surface admin check errors**:

```typescript
if (adminCheckResult.err) {
  // If admin check fails, the user cannot see any guilds.
  // Return the error rather than silently degrading.
  return adminCheckResult;
}
```

**2. Log per-guild channel fetch failures**:

```typescript
installed.map(async (guild) => {
  const channelResult = await VspoChannelApiRepository.getGuildConfig(
    params.appWorker, guild.id,
  );
  if (channelResult.err) {
    console.error(`Failed to fetch channels for guild ${guild.id}:`, channelResult.err.code);
    return guild;
  }
  return GuildSummary.withChannelSummary(guild, channelResult.val.channels);
}),
```

**3. Consider caching bot guild IDs in session**:

The dashboard index page already caches `guildSummaries` in the session. The `botGuildIds` set could be similarly cached with a short TTL to reduce RPC calls during navigation between guild detail pages.

## Migration Checklist

- [ ] Move `toFrontendMemberType` / `toServerMemberType` to `features/channel/domain/member-type.ts`
- [ ] Define `ServerMemberTypeSchema` with Zod
- [ ] Remove `default` case from `toServerMemberType` for exhaustive checking
- [ ] Add Discord Snowflake validation to `AddChannelUsecase` and `DeleteChannelUsecase`
- [ ] Make dev mock write operations return `Ok` instead of `Err`
- [ ] Translate Japanese JSDoc in `dev-mock.ts` to English
- [ ] Handle `batchUpsertEnqueue` errors in `adjustAndEnqueue`
- [ ] Add unit tests for member type mapping functions
- [ ] Add schema validation tests for dev mock data
- [ ] Surface `adminCheckResult` errors in `ListGuildsUsecase`
- [ ] Log per-guild channel fetch failures
