# `astro:env` Type-Safe Environment Variables Migration

## Current State

### Environment Variable Access Patterns

The project accesses environment variables through multiple mechanisms:

| Pattern | Location | Variables | Issues |
|---------|----------|-----------|--------|
| `import { env } from "cloudflare:workers"` | `middleware.ts`, repositories, `dev-mock.ts` | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DEV_MOCK_AUTH`, `APP_WORKER` | No type safety, no validation |
| `import.meta.env.DEV` | `dev-mock.ts`, various | Built-in Astro flag | Fine (Astro-provided) |
| `import.meta.env.SITE` | `Base.astro` | Site URL | Fine (Astro-provided) |
| `Astro.locals` | Pages, middleware | `locale`, `user`, `guilds` | Runtime values, not env vars |
| `wrangler.jsonc` `vars` | Dev config | `DEV_MOCK_AUTH` | Not type-checked |

### Current `cloudflare:workers` Usage

```typescript
// middleware.ts
import { env } from "cloudflare:workers";
const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = env;

// features/shared/dev-mock.ts
import { env } from "cloudflare:workers";
export const isRpcUnavailable = (): boolean => {
  return !env.APP_WORKER && env.DEV_MOCK_AUTH === "true";
};

// features/channel/repository/vspo-channel-api.ts
import { env } from "cloudflare:workers";
const rpc = env.APP_WORKER;
```

### Additional Env Vars (from `env.d.ts`)

| Variable | Type | Purpose |
|----------|------|---------|
| `DISCORD_CLIENT_ID` | string | OAuth client ID |
| `DISCORD_BOT_CLIENT_ID` | string | Bot-specific client ID |
| `DISCORD_CLIENT_SECRET` | string | OAuth client secret |
| `DISCORD_REDIRECT_URI` | string | OAuth callback URL |
| `APP_WORKER` | Service Binding | RPC to vspo-server |
| `DEV_MOCK_AUTH` | string (optional) | Dev mock flag |

### Problems

1. **No compile-time validation**: Missing or misspelled env var names are only caught at runtime
2. **No type inference**: All values from `cloudflare:workers` env are untyped or loosely typed
3. **Unsafe double-casting for optional vars**: `DEV_MOCK_AUTH` requires `(env as Record<string, unknown>).DEV_MOCK_AUTH` or even `(env as unknown as Record<string, unknown>).DEV_MOCK_AUTH` (3 files: `middleware.ts:63`, `dev-mock.ts:19`, `discord-api.ts:9`)
4. **No schema enforcement**: `DEV_MOCK_AUTH` is a string `"true"` but should semantically be a boolean
5. **Mixed access patterns**: Some env vars come from `cloudflare:workers`, others from `import.meta.env`, making it hard to audit all env dependencies

## Proposed: `astro:env` Schema

### Configuration

```typescript
// astro.config.ts
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      // Discord OAuth credentials (server-side secrets)
      DISCORD_CLIENT_ID: envField.string({
        context: "server",
        access: "secret",
      }),
      DISCORD_BOT_CLIENT_ID: envField.string({
        context: "server",
        access: "secret",
      }),
      DISCORD_CLIENT_SECRET: envField.string({
        context: "server",
        access: "secret",
      }),
      DISCORD_REDIRECT_URI: envField.string({
        context: "server",
        access: "public",
      }),

      // Dev mock flag (server-side, public within server code)
      DEV_MOCK_AUTH: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
    },
  },
});
```

### Usage After Migration

```typescript
// middleware.ts
import { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "astro:env/server";

// features/shared/dev-mock.ts
import { DEV_MOCK_AUTH } from "astro:env/server";

export const isDevMockEnabled = (): boolean => DEV_MOCK_AUTH;
// No more string comparison: DEV_MOCK_AUTH is already a boolean
```

### What Stays on `cloudflare:workers`

The `APP_WORKER` service binding is NOT a simple environment variable — it's a Cloudflare Workers Service Binding (RPC stub). This cannot be migrated to `astro:env` because:

1. It's an object with methods, not a string/number/boolean
2. It's provided by the Cloudflare Workers runtime, not by env vars
3. `astro:env` only supports scalar types (string, number, boolean, enum)

```typescript
// These STAY on cloudflare:workers
import { env } from "cloudflare:workers";
const rpc = env.APP_WORKER; // Service Binding — NOT migratable
```

### Compatibility with Cloudflare Adapter

The `@astrojs/cloudflare` adapter supports `astro:env` via the `getSecret()` function, which retrieves environment variables from the Cloudflare Workers runtime. This means `astro:env` secrets work correctly on Cloudflare Workers.

From Astro docs:
> Developing an adapter? See how to make an adapter compatible with `astro:env`.

The Cloudflare adapter implements `envGetSecret` to bridge Cloudflare's runtime env with `astro:env`.

## Migration Plan

### Phase 1: Add Schema (Non-Breaking)

1. Add `env.schema` to `astro.config.ts`
2. Run `astro sync` to generate types
3. Verify no conflicts with existing `cloudflare:workers` access

### Phase 2: Migrate Simple Vars

1. Replace `env.DISCORD_CLIENT_ID` with `import { DISCORD_CLIENT_ID } from "astro:env/server"`
2. Replace `env.DISCORD_CLIENT_SECRET` similarly
3. Replace `env.DEV_MOCK_AUTH === "true"` with boolean `DEV_MOCK_AUTH`
4. Update `isRpcUnavailable()` / `isDevMockEnabled()` accordingly

### Phase 3: Keep Service Bindings Separate

1. Document that `APP_WORKER` remains on `cloudflare:workers`
2. Create a typed wrapper for the RPC service binding:

```typescript
// lib/cloudflare-bindings.ts
import { env } from "cloudflare:workers";

/** Type-safe access to Cloudflare service bindings */
export const getAppWorker = () => env.APP_WORKER;
```

## Benefits

| Aspect | Before (`cloudflare:workers`) | After (`astro:env`) |
|--------|------------------------------|---------------------|
| Type safety | None (runtime only) | Full compile-time types |
| Validation | Runtime errors | Build-time validation |
| Boolean handling | `=== "true"` string comparison | Native boolean |
| Secret protection | Manual discipline | Schema enforces `access: "secret"` |
| Documentation | Scattered across files | Centralized in `astro.config.ts` |
| IDE support | No autocomplete | Full IntelliSense |

## Risks and Considerations

1. **Adapter compatibility**: Verify `@astrojs/cloudflare` adapter supports `astro:env` `getSecret()` correctly. Test in dev and production.
2. **Wrangler dev**: `wrangler dev` injects env vars at runtime. Ensure `astro:env` validation doesn't fail during `astro dev` when using wrangler.
3. **Build vs runtime**: `astro:env` validates at build time for public vars and at runtime for secrets. Ensure CI has the required env vars during build.
4. **Testing**: Vitest tests that mock `cloudflare:workers` will need to be updated to mock `astro:env/server` instead.

## Migration Checklist

- [ ] Add `env.schema` to `astro.config.ts` with `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DEV_MOCK_AUTH`
- [ ] Run `astro sync` and verify types generate correctly
- [ ] Migrate `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` to `astro:env/server` in `middleware.ts`
- [ ] Migrate `DEV_MOCK_AUTH` to `astro:env/server` in `dev-mock.ts`
- [ ] Create typed wrapper for `APP_WORKER` service binding
- [ ] Update vitest mocks for `astro:env/server`
- [ ] Verify `wrangler dev` and `astro dev` work with new schema
- [ ] Test production build on Cloudflare Workers
