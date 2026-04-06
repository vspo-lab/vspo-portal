# API Route Improvements

## Current State

### Route Inventory

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/change-locale` | POST | Switch UI locale | Manual check (none) |
| `/api/guilds/[guildId]/channels` | GET | List guild text channels | Manual `locals.user` check |
| `/auth/discord` | GET | Start OAuth flow | None (public) |
| `/auth/callback` | GET | OAuth callback handler | State validation |
| `/auth/logout` | POST | Destroy session | None (session-based) |
| `/pages/robots.txt` | GET | Robots.txt generation | None (public) |

### Issues

1. **`/api/change-locale` should be an Astro Action**: It accepts form data, mutates session state, and redirects. This is exactly what Actions are designed for. Using an API route bypasses built-in CSRF protection.
2. **Manual auth in `/api/guilds/[guildId]/channels`**: Auth check is duplicated outside middleware. The middleware only redirects for `/dashboard` paths, leaving `/api` routes unprotected by default.
3. **No guild membership verification**: The channels endpoint returns data for any `guildId` without verifying the user belongs to that guild.
4. **Error message leaking**: `result.err.message` is returned directly in the JSON response, potentially exposing internal details.
5. **Missing `Content-Type` validation**: POST endpoints don't verify request Content-Type.
6. **No rate limiting**: API endpoints have no request rate limiting.

## Improvement 1: Migrate change-locale to Astro Action

### Current Implementation

```typescript
// pages/api/change-locale.ts
export const POST: APIRoute = async (context) => {
  const formData = await context.request.formData();
  const locale = formData.get("locale");
  const returnTo = formData.get("_returnTo");

  if (locale === "ja" || locale === "en") {
    context.session?.set("locale", locale);
  }

  const destination =
    typeof returnTo === "string" && returnTo.startsWith("/")
      ? returnTo
      : (context.request.headers.get("Referer") ?? "/");

  return context.redirect(destination);
};
```

### Proposed: Astro Action

```typescript
// actions/index.ts
import { z } from "astro:schema";

changeLocale: defineAction({
  accept: "form",
  input: z.object({
    locale: z.enum(["ja", "en"]),
    _returnTo: z.string().startsWith("/").optional(),
  }),
  handler: async (input, context) => {
    context.session?.set("locale", input.locale);
    return { locale: input.locale };
  },
}),
```

### Client-Side Update

```astro
<!-- Before -->
<form method="POST" action="/api/change-locale">
  <input type="hidden" name="locale" value={altLocale} />
  <input type="hidden" name="_returnTo" value={returnTo} />
  <button type="submit">...</button>
</form>

<!-- After -->
<form method="POST" action={actions.changeLocale}>
  <input type="hidden" name="locale" value={altLocale} />
  <input type="hidden" name="_returnTo" value={returnTo} />
  <button type="submit">...</button>
</form>
```

### Benefits

| Aspect | Before (API Route) | After (Action) |
|--------|-------------------|----------------|
| CSRF protection | None | Automatic (`_astroAction` hidden field) |
| Input validation | Manual `=== "ja" \|\| === "en"` | Zod `z.enum(["ja", "en"])` |
| Type safety | Manual FormData parsing | Full type inference |
| Auth gating | Requires explicit check | Handled by `actionAuth` middleware |
| Error handling | Manual redirect | `getActionResult()` on caller page |

### Note on Auth

The `changeLocale` action does not require authentication — unauthenticated users on the landing page can also switch locale. The `actionAuth` middleware (from `15_MIDDLEWARE_PATTERNS.md`) should be configured to skip auth for this specific action, or this action can be excluded from the global auth gate.

## Improvement 2: Secure the Channels API Endpoint

### Current Implementation

```typescript
// pages/api/guilds/[guildId]/channels.ts
export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { guildId } = params;
  if (!guildId) {
    return new Response(JSON.stringify({ error: "Missing guildId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await VspoChannelApiRepository.listGuildChannels(
    env.APP_WORKER,
    guildId,
  );

  if (result.err) {
    return new Response(JSON.stringify({ error: result.err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result.val), {
    headers: { "Content-Type": "application/json" },
  });
};
```

### Issues

1. **No guild membership check**: Any authenticated user can query channels for any guild.
2. **Error message leaking**: `result.err.message` may contain internal details (e.g., RPC error messages).
3. **Boilerplate JSON response construction**: Repeated `new Response(JSON.stringify(...), { headers: ... })`.

### Proposed Improvement

```typescript
// pages/api/guilds/[guildId]/channels.ts
import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { VspoChannelApiRepository } from "~/features/channel/repository/vspo-channel-api";

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const GET: APIRoute = async ({ params, locals, session }) => {
  if (!locals.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const { guildId } = params;
  if (!guildId) {
    return jsonResponse({ error: "Missing guildId" }, 400);
  }

  // Verify user has access to this guild via cached guild summaries
  const guildSummaries = await session?.get("guildSummaries");
  const hasAccess = guildSummaries?.some(
    (g) => g.id === guildId && g.isAdmin,
  );

  if (!hasAccess) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  const result = await VspoChannelApiRepository.listGuildChannels(
    env.APP_WORKER,
    guildId,
  );

  if (result.err) {
    // Do not leak internal error messages
    return jsonResponse({ error: "Failed to fetch channels" }, 500);
  }

  return jsonResponse(result.val);
};
```

### Key Changes

1. **Guild membership verification**: Check `guildSummaries` from session to verify user has admin access to the requested guild.
2. **Safe error messages**: Replace `result.err.message` with a generic error message.
3. **Helper function**: Extract `jsonResponse` to reduce boilerplate.

## Improvement 3: Middleware Auth Coverage for API Routes

### Current Gap

The `auth` middleware only redirects unauthenticated users for `/dashboard` paths:

```typescript
if (!user) {
  context.locals.accessToken = null;
  if (context.url.pathname.startsWith("/dashboard")) {
    return context.redirect("/");
  }
  return next();
}
```

API routes under `/api/` are not covered by this redirect logic. Each API route must implement its own auth check.

### Proposed: Extend Middleware

```typescript
const auth = defineMiddleware(async (context, next) => {
  // ... session read ...

  if (!user) {
    context.locals.accessToken = null;

    // Protected path patterns
    const protectedPaths = ["/dashboard", "/api/guilds"];

    if (protectedPaths.some((p) => context.url.pathname.startsWith(p))) {
      // Dashboard: redirect to landing
      if (context.url.pathname.startsWith("/dashboard")) {
        return context.redirect("/");
      }
      // API: return 401 JSON
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  }

  // ... token refresh ...
});
```

### Route Protection Matrix

| Path Pattern | Public | Auth Required | Notes |
|-------------|--------|---------------|-------|
| `/` | Yes | - | Landing page |
| `/auth/*` | Yes | - | OAuth flow |
| `/robots.txt` | Yes | - | SEO |
| `/404` | Yes | - | Error page |
| `/dashboard/*` | - | Yes (redirect) | Dashboard pages |
| `/api/guilds/*` | - | Yes (401 JSON) | Guild API |
| `/api/change-locale` | Yes | - | Locale switch (non-destructive) |

## Improvement 4: Consider Replacing Channels API with Astro Action

### Analysis

The `/api/guilds/[guildId]/channels` endpoint is called from the `ChannelAddModal` to fetch available channels via `fetch()`. This is a candidate for migration to an Astro Action:

```typescript
// actions/index.ts
listGuildChannels: defineAction({
  accept: "json",
  input: z.object({
    guildId: z.string().regex(/^\d{17,20}$/),
  }),
  handler: async (input, context) => {
    const result = await VspoChannelApiRepository.listGuildChannels(
      env.APP_WORKER,
      input.guildId,
    );
    unwrapOrThrow(result);
    return result.val;
  },
}),
```

### Client-Side Usage (React Island)

```tsx
import { actions } from "astro:actions";

const fetchChannels = async (guildId: string) => {
  const { data, error } = await actions.listGuildChannels({ guildId });
  if (error) {
    // Handle error
    return [];
  }
  return data;
};
```

### Trade-offs

| Aspect | API Route | Astro Action |
|--------|-----------|--------------|
| Auth | Manual in handler | Centralized via middleware |
| Input validation | Manual | Zod automatic |
| Type safety | None (fetch + cast) | Full end-to-end |
| CSRF | None (GET request) | Automatic |
| Caching | Can set Cache-Control | Not cacheable by default |
| URL stability | Stable REST URL | `/_actions/listGuildChannels` (internal) |

**Recommendation**: Migrate to Action. The endpoint is only used internally by the ChannelAddModal, not by external consumers. Type safety and centralized auth outweigh the caching benefit for this use case.

## Improvement 5: Response Helper Utility

### Current Problem

Every API route constructs Response objects manually with repeated headers.

### Proposed Utility

```typescript
// features/shared/lib/api-response.ts

/** Create a JSON Response with proper headers */
export const jsonOk = <T>(data: T, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/** Create a JSON error Response with a safe message */
export const jsonError = (message: string, status: number): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
```

This becomes unnecessary if all API routes are migrated to Astro Actions, which handle serialization automatically.

## Improvement 6: OAuth Route Hardening

### Current OAuth Routes

The OAuth routes (`/auth/discord`, `/auth/callback`, `/auth/logout`) are well-structured but have minor improvements:

#### `/auth/discord` — Use `context.redirect()` instead of manual Response

```typescript
// Current
return new Response(null, {
  status: 302,
  headers: { Location: url },
});

// Improved
return context.redirect(url, 302);
```

#### `/auth/callback` — Session regeneration

```typescript
// After successful auth, regenerate session to prevent session fixation
context.session?.regenerate();
context.session?.set("user", { ... });
```

#### `/auth/logout` — Clear session before redirect

```typescript
// Current
export const POST: APIRoute = async (context) => {
  context.session?.destroy();
  return context.redirect("/");
};
```

This is correct. No changes needed. `session.destroy()` already handles cleanup.

## Migration Checklist

- [ ] Migrate `/api/change-locale` to `changeLocale` Astro Action
- [ ] Update `LanguageSelector.astro` form to use `actions.changeLocale`
- [ ] Add guild membership verification to channels endpoint
- [ ] Replace error message leaking with safe messages in API responses
- [ ] Extend middleware auth to cover `/api/guilds/*` paths
- [ ] Evaluate migrating channels endpoint to Astro Action
- [ ] Add `jsonOk`/`jsonError` helper (if API routes are retained)
- [ ] Use `context.redirect()` in `/auth/discord` instead of manual Response
- [ ] Add `session.regenerate()` after successful OAuth callback
- [ ] Add Discord Snowflake validation to `guildId` parameter
- [ ] Remove `/api/change-locale.ts` file after Action migration
