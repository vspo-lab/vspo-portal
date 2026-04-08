# Cookies API and Server Endpoints

## Current State

The bot-dashboard uses server endpoints for API routes and cookies for session management via Astro's Sessions API. However, direct cookie usage patterns and endpoint best practices can be improved.

### Current Endpoints

| File | Method | Purpose |
|------|--------|---------|
| `api/change-locale.ts` | POST | Change locale preference |
| `api/guilds/[guildId]/channels.ts` | GET | Fetch guild channels |
| `auth/discord.ts` | GET | Initiate OAuth |
| `auth/callback.ts` | GET | OAuth callback |
| `auth/logout.ts` | GET | Logout |

### Issues

| # | Issue | Impact |
|---|-------|--------|
| 1 | `change-locale` endpoint should be an Astro Action | Inconsistent pattern with other server mutations |
| 2 | No consistent JSON response helper | Repeated `new Response(JSON.stringify(...))` |
| 3 | Cookie `SameSite` and `Secure` flags not consistently set | Security gap in cookie configuration |
| 4 | No `Response.json()` static method usage | Verbose response construction |
| 5 | Endpoint error responses lack structured format | Clients can't reliably parse errors |
| 6 | OAuth cookie cleanup not comprehensive | Stale cookies may remain after logout |

---

## 1. Cookies API Reference

### Core Methods

```typescript
// Get a cookie (returns AstroCookie | undefined)
const token = Astro.cookies.get("session_token");
if (token) {
  const value = token.value;          // string
  const parsed = token.json();        // Record<string, any>
  const num = token.number();         // number (NaN if invalid)
  const bool = token.boolean();       // boolean
}

// Check cookie existence
if (Astro.cookies.has("session_token")) { /* ... */ }

// Set a cookie
Astro.cookies.set("locale", "en", {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,    // 1 year
  httpOnly: true,
  secure: true,
  sameSite: "lax",
});

// Delete a cookie
Astro.cookies.delete("session_token", {
  path: "/",
});

// Get Set-Cookie headers for the response
const headers = Astro.cookies.headers();

// Merge cookies from another AstroCookies instance
Astro.cookies.merge(otherCookies);
```

### AstroCookieSetOptions

| Option | Type | Description |
|--------|------|-------------|
| `domain` | `string` | Cookie domain |
| `expires` | `Date` | Expiration date |
| `httpOnly` | `boolean` | Block client-side access |
| `maxAge` | `number` | Lifetime in seconds |
| `path` | `string` | URL path scope |
| `sameSite` | `boolean \| 'lax' \| 'none' \| 'strict'` | Cross-site behavior |
| `secure` | `boolean` | HTTPS only |
| `partitioned` | `boolean` | Partitioned cookie (astro@5.17.0+) |
| `encode` | `(value: string) => string` | Custom serialization |

> **Version note**: `partitioned` option added in **astro@5.17.0** for [CHIPS](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Privacy_sandbox/Partitioned_cookies) support. Requires `secure: true`.

---

## 2. Cookie Security Defaults

### Recommended Cookie Configuration

```typescript
// Shared cookie options for the project
const SECURE_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
} satisfies Partial<import("astro").AstroCookieSetOptions>;

// Usage
Astro.cookies.set("session", token, {
  ...SECURE_COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24,  // 24 hours
});
```

### OAuth State Cookie

```typescript
// Set OAuth state before redirect
Astro.cookies.set("oauth_state", state, {
  path: "/auth",
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 10,  // 10 minutes
});
```

### Locale Preference Cookie

```typescript
// Non-sensitive, can be client-readable
Astro.cookies.set("locale", locale, {
  path: "/",
  httpOnly: false,   // Client JS needs to read this
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,  // 1 year
});
```

---

## 3. Server Endpoint Patterns

### Basic JSON Endpoint

```typescript
// src/pages/api/guilds/[guildId]/channels.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const { guildId } = params;

  // Validate params
  if (!guildId || !/^\d{17,20}$/.test(guildId)) {
    return Response.json(
      { error: "Invalid guild ID" },
      { status: 400 }
    );
  }

  // Auth check
  const session = cookies.get("session");
  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Fetch data
  const channels = await fetchChannels(guildId);
  return Response.json({ data: channels });
};
```

> **Tip**: Use `Response.json()` instead of `new Response(JSON.stringify(...))` for cleaner code. `Response.json()` automatically sets `Content-Type: application/json`.

### Endpoint with Multiple HTTP Methods

```typescript
// src/pages/api/guilds/[guildId]/channels.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params }) => {
  // Fetch channels
  return Response.json({ data: channels });
};

export const POST: APIRoute = async ({ params, request }) => {
  const body = await request.json();
  // Create channel
  return Response.json({ data: newChannel }, { status: 201 });
};

export const DELETE: APIRoute = async ({ params }) => {
  // Delete channel
  return new Response(null, { status: 204 });
};
```

### Endpoint with Error Handling

```typescript
import type { APIRoute } from "astro";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

function jsonResponse<T>(data: T, status = 200): Response {
  return Response.json({ data } satisfies ApiResponse<T>, { status });
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message } satisfies ApiResponse<never>, { status });
}

export const GET: APIRoute = async ({ params }) => {
  const { guildId } = params;
  if (!guildId) return errorResponse("Guild ID required", 400);

  const result = await fetchGuild(guildId);
  if (!result) return errorResponse("Guild not found", 404);

  return jsonResponse(result);
};
```

---

## 4. Migration: `change-locale` to Astro Action

### Current: API Endpoint

```typescript
// src/pages/api/change-locale.ts
export const POST: APIRoute = async ({ cookies, request }) => {
  const formData = await request.formData();
  const locale = formData.get("locale");
  cookies.set("locale", locale, { path: "/" });
  return new Response(null, { status: 302, headers: { Location: "/" } });
};
```

### Target: Astro Action

```typescript
// src/actions/index.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";

export const server = {
  changeLocale: defineAction({
    accept: "form",
    input: z.object({
      locale: z.enum(["ja", "en"]),
    }),
    handler: async ({ locale }, context) => {
      context.cookies.set("locale", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        secure: true,
        sameSite: "lax",
      });
      return { locale };
    },
  }),
};
```

---

## 5. Server Endpoint vs Astro Action Decision Guide

| Criterion | Server Endpoint | Astro Action |
|-----------|----------------|--------------|
| External API calls | Prefer (RESTful interface) | Can use |
| Form submissions | Can use | Prefer (built-in validation) |
| Client-side mutations | Can use | Prefer (type-safe, error handling) |
| File downloads / binary | Prefer (full Response control) | Not suitable |
| Webhook receivers | Prefer (raw request access) | Not suitable |
| Auth flows (OAuth) | Prefer (redirect control) | Not suitable |
| CRUD operations | Can use | Prefer (Zod validation) |

### Current Endpoints Migration Plan

| Endpoint | Target | Reason |
|----------|--------|--------|
| `api/change-locale.ts` | Action `changeLocale` | Form mutation, benefits from validation |
| `api/guilds/[guildId]/channels.ts` | Action `listChannels` | Already similar to existing channel actions |
| `auth/discord.ts` | Keep as endpoint | OAuth redirect flow |
| `auth/callback.ts` | Keep as endpoint | OAuth callback handling |
| `auth/logout.ts` | Keep as endpoint | Session cleanup + redirect |

---

## 6. Endpoint Response Headers

### Cache-Control for API Responses

```typescript
export const GET: APIRoute = async ({ params }) => {
  const data = await fetchData(params.id);
  return Response.json({ data }, {
    headers: {
      "Cache-Control": "private, max-age=60",
      "Vary": "Cookie",
    },
  });
};
```

### CORS for API Endpoints (If Needed)

```typescript
export const GET: APIRoute = async ({ request }) => {
  const origin = request.headers.get("Origin");
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (origin === "https://allowed-origin.com") {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return new Response(JSON.stringify(data), { headers });
};
```

---

## 7. Server-Side Endpoint Calls

Call endpoints from within Astro pages without HTTP roundtrip:

```astro
---
// Import the endpoint function directly
import { GET } from "./api/guilds/[guildId]/channels.ts";

const response = await GET(Astro);
const data = await response.json();
---
```

Or use `Astro.callAction()` for actions:

```astro
---
import { actions } from "astro:actions";

const { data, error } = await Astro.callAction(
  actions.listChannels,
  { guildId }
);
---
```

---

## Checklist

- [ ] Migrate `change-locale` endpoint to Astro Action
- [ ] Evaluate `channels.ts` endpoint for Action migration
- [ ] Add consistent cookie security defaults (`httpOnly`, `secure`, `sameSite`)
- [ ] Use `Response.json()` in all endpoints
- [ ] Create shared response helper for consistent error format
- [ ] Audit OAuth cookies for proper cleanup on logout
- [ ] Add `partitioned` cookie option evaluation for third-party contexts
- [ ] Document endpoint vs Action decision criteria in project README

## Cross-References

- [09_SECURITY.md](./09_SECURITY.md) — Cookie security, CSRF, OAuth hardening
- [17_ACTIONS_PATTERNS.md](./17_ACTIONS_PATTERNS.md) — Astro Actions patterns
- [18_SESSION_MANAGEMENT.md](./18_SESSION_MANAGEMENT.md) — Sessions API (higher-level than cookies)
- [20_API_ROUTES.md](./20_API_ROUTES.md) — API route migration details
