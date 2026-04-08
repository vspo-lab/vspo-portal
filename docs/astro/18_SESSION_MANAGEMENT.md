# Session Management Improvements

## Current State

### Session Configuration

Session configuration is **undefined** in `astro.config.ts`. The Cloudflare adapter automatically provides the default session driver (KV).

```typescript
// astro.config.ts — no session configuration
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  // session: { ... } ← not configured
});
```

### Session Data Structure (`env.d.ts`)

```typescript
declare namespace App {
  interface SessionData {
    user: { id: string; username: string; displayName: string; avatar: string | null };
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    oauth_state: string;
    locale: Locale;
    guildSummaries: Array<{ id: string; name: string; icon: string | null; isAdmin: boolean; botInstalled: boolean }>;
  }
  interface Locals {
    user: SessionData["user"] | null;
    accessToken: string | null;
    locale: Locale;
  }
}
```

### Session Usage (`middleware.ts`)

```typescript
// Parallel reads to reduce KV round trips
const [sessionLocale, user, expiresAt, accessToken] = await Promise.all([
  context.session?.get("locale"),
  context.session?.get("user"),
  context.session?.get("expiresAt"),
  context.session?.get("accessToken"),
]);
```

### Issues

1. **Session configuration is implicit**: The default driver behavior is not explicitly documented
2. **Cookie settings are not explicit**: `httpOnly`, `secure`, `sameSite` are left to defaults
3. **No TTL configured**: Session lifetime depends only on token expiration. No idle timeout
4. **Token refresh race condition**: Concurrent requests may trigger multiple refreshes simultaneously
5. **Guild summary cache staleness**: In-session cache has no TTL, stale data persists
6. **OAuth state remains after auth**: `oauth_state` stays in the session after authentication completes

## Improvement 1: Explicit Session Configuration

### Recommended Configuration

```typescript
// astro.config.ts
export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  session: {
    // Cloudflare adapter uses KV driver by default
    // Explicitly configuring documents the behavior
    cookie: {
      name: "vspo-dash-session",
      sameSite: "lax",
      httpOnly: true,
      secure: true,
      // path: "/" is the default
    },
    ttl: 86400, // 24 hours — maximum session lifetime
  },
});
```

### Cookie Configuration Details

| Attribute | Default | Recommended | Reason |
|-----------|---------|-------------|--------|
| `name` | `"astro-session"` | `"vspo-dash-session"` | App-specific name to avoid conflicts |
| `sameSite` | `"lax"` | `"lax"` | Maintain compatibility with OAuth redirects |
| `httpOnly` | `true` | `true` | Prevent JS access |
| `secure` | `true` | `true` | HTTPS only |

### Session Driver Options

| Driver | Use Case | Notes |
|--------|----------|-------|
| Cloudflare KV (default) | Current production environment | Automatically configured by adapter |
| Redis (`sessionDrivers.redis()`) | High throughput | Requires a separate Redis instance |
| Memory | Development environment | Lost on worker restart |

## Improvement 2: Session TTL and Idle Timeout

### Current Problem

Session lifetime depends only on token expiration (Discord OAuth's `expires_in`):

```typescript
// middleware.ts — token expiration check
if (now >= (expiresAt ?? 0) - REFRESH_BUFFER_MS) {
  // refresh or destroy
}
```

→ As long as refresh succeeds, the session persists indefinitely.

### Improvement: TTL + Idle Timeout

```typescript
// astro.config.ts
session: {
  ttl: 86400, // 24 hours — maximum session lifetime
}
```

Additionally, implement idle timeout in middleware:

```typescript
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

const sessionTimeout = defineMiddleware(async (context, next) => {
  const lastActivity = await context.session?.get("lastActivity");
  const now = Date.now();

  if (lastActivity && now - lastActivity > SESSION_IDLE_TIMEOUT_MS) {
    context.session?.destroy();
    return context.redirect("/?error=session_expired");
  }

  // Record activity
  context.session?.set("lastActivity", now);
  return next();
});
```

### TTL Effects

| Item | Before | After |
|------|--------|-------|
| Maximum session lifetime | Indefinite (when refresh succeeds) | 24 hours |
| Idle timeout | None | 2 hours |
| Storage consumption | Grows without bound | Auto-deleted by TTL |

## Improvement 3: Token Refresh Race Condition Prevention

### Current Problem

Concurrent requests (page load + Server Island + Action) execute refresh simultaneously:

```yaml
Request A: expiresAt < now → refresh → new tokens → session.set(...)
Request B: expiresAt < now → refresh → old refresh token → FAIL (token already used)
```

### Improvement: Refresh Lock

```typescript
const REFRESH_LOCK_KEY = "tokenRefreshLock";
const REFRESH_LOCK_TTL_MS = 10_000; // 10 seconds

const refreshTokenIfNeeded = async (context: APIContext) => {
  const [expiresAt, accessToken] = await Promise.all([
    context.session?.get("expiresAt"),
    context.session?.get("accessToken"),
  ]);

  const now = getCurrentUTCDate().getTime();
  if (now < (expiresAt ?? 0) - REFRESH_BUFFER_MS) {
    context.locals.accessToken = accessToken ?? null;
    return;
  }

  // Check lock — if another request is refreshing, use the current token
  const lock = await context.session?.get(REFRESH_LOCK_KEY);
  if (lock && now - lock < REFRESH_LOCK_TTL_MS) {
    context.locals.accessToken = accessToken ?? null;
    return;
  }

  // Acquire lock
  context.session?.set(REFRESH_LOCK_KEY, now);

  const refreshToken = await context.session?.get("refreshToken");
  if (!refreshToken) {
    context.session?.destroy();
    return;
  }

  const refreshResult = await DiscordApiRepository.refreshToken({ ... });

  if (refreshResult.err) {
    context.session?.destroy();
    return;
  }

  const tokens = refreshResult.val;
  context.session?.set("accessToken", tokens.access_token);
  context.session?.set("refreshToken", tokens.refresh_token);
  context.session?.set("expiresAt", now + tokens.expires_in * 1000);
  context.session?.set(REFRESH_LOCK_KEY, null); // Release lock
  context.locals.accessToken = tokens.access_token;
};
```

### Caveats

- Since Cloudflare KV does not support transactions, the completeness of the distributed lock mechanism is not guaranteed
- The race window is narrow (only concurrent requests on the same session when the token is expired)
- In the worst case, refresh token invalidation triggers `session.destroy()`, which is safe

## Improvement 4: Guild Summary Cache TTL

### Current Problem

```typescript
// Guild summaries cached in SessionData
guildSummaries: Array<{ id: string; name: string; ... }>;
```

Without a cache expiration, changes to guild names or bot additions/removals are not reflected.

### Improvement: Add Cache Metadata

```typescript
interface SessionData {
  guildSummaries: Array<{ id: string; name: string; icon: string | null; isAdmin: boolean; botInstalled: boolean }>;
  guildSummariesCachedAt: number; // Cache timestamp
}

const GUILD_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getGuildSummaries = async (context: APIContext) => {
  const [cached, cachedAt] = await Promise.all([
    context.session?.get("guildSummaries"),
    context.session?.get("guildSummariesCachedAt"),
  ]);

  const now = Date.now();
  if (cached && cachedAt && now - cachedAt < GUILD_CACHE_TTL_MS) {
    return cached;
  }

  // Cache expired — re-fetch
  const guilds = await fetchGuildSummaries(context.locals.accessToken);
  context.session?.set("guildSummaries", guilds);
  context.session?.set("guildSummariesCachedAt", now);
  return guilds;
};
```

## Improvement 5: OAuth State Cleanup

### Current State

`oauth_state` remains in the session after authentication completes.

### Improvement

```typescript
// pages/auth/callback.astro
const oauthState = await Astro.session?.get("oauth_state");
// ... state validation ...

// Delete after validation
Astro.session?.set("oauth_state", undefined);
```

## Improvement 6: Strengthening Session Data Type Safety

### Current State

The return value of `context.session?.get("key")` is `SessionData[key]`, but due to the optional chaining on `session?`, it always has the possibility of being `undefined`.

### Improvement: Guaranteeing Session Existence

```typescript
const auth = defineMiddleware(async (context, next) => {
  // Guard if session is undefined
  if (!context.session) {
    // This shouldn't happen with the Cloudflare adapter, but included for type safety
    return context.redirect("/?error=session_unavailable");
  }

  // From here on, session is guaranteed to exist
  const user = await context.session.get("user");
  // ...
});
```

## Session Flow Diagram

```text
Browser → Cloudflare Worker
  ↓
middleware (securityHeaders)
  ↓
middleware (locale)
  ├── session.get("locale") → KV
  └── locals.locale = locale
  ↓
middleware (auth)
  ├── session.get("user", "expiresAt", "accessToken") → KV (parallel)
  ├── DEV: mock auth → skip
  ├── !user: redirect to "/"
  ├── token expired: refresh + session.set(...) → KV
  └── locals.user = user, locals.accessToken = token
  ↓
middleware (actionAuth) [NEW]
  ├── getActionContext()
  ├── !action: skip
  └── !user: setActionError(UNAUTHORIZED)
  ↓
Page / Action rendering
  ↓
Response + Security Headers
```

## Migration Checklist

- [ ] Add `session` configuration (cookie, ttl) to `astro.config.ts`
- [ ] Change session cookie name to `"vspo-dash-session"`
- [ ] Set session TTL to 24 hours
- [ ] Add idle timeout middleware (2 hours)
- [ ] Implement token refresh lock mechanism
- [ ] Add TTL metadata to guild summary cache
- [ ] Add OAuth state cleanup after authentication completes
- [ ] Add `lastActivity` timestamp recording
- [ ] Verify session configuration behavior in development environment
