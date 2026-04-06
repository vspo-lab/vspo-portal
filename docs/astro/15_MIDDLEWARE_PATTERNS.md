# Middleware Pattern Improvements

## Current State

### middleware.ts Structure

`src/middleware.ts` composes two middlewares using `sequence()`:

```typescript
export const onRequest = sequence(securityHeaders, auth);
```

1. **securityHeaders**: Applies CSP / X-Frame-Options etc. to all responses
2. **auth**: Session read → Locale setting → Auth check → Token refresh

### Typed Locals

`App.Locals` and `App.SessionData` are type-defined in `src/env.d.ts`:

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

### Issues

1. **auth middleware has too many responsibilities**: Locale setting + authentication + token refresh are mixed in a single function
2. **Hardcoded security headers**: CSP is managed as string literals, making it hard to maintain
3. **Duplicate auth in Actions**: `requireAuth()` is manually called in each action in `actions/index.ts`
4. **Insufficient error page integration**: Middleware behavior on 500 error pages is not considered
5. **Unused rewrite pattern**: `context.rewrite()` is not used for locale switching or fallback display

## Improvement 1: Middleware Splitting

### Separation of Concerns

```typescript
// src/middleware.ts
import { defineMiddleware, sequence } from "astro:middleware";

const securityHeaders = defineMiddleware(async (_ctx, next) => {
  const response = await next();
  applySecurityHeaders(response);
  return response;
});

const locale = defineMiddleware(async (context, next) => {
  const sessionLocale = await context.session?.get("locale");
  context.locals.locale = sessionLocale ?? "ja";
  if (!sessionLocale) {
    context.session?.set("locale", "ja");
  }
  return next();
});

const auth = defineMiddleware(async (context, next) => {
  // Only authentication + token refresh
  // Locale processing is delegated to the locale middleware
  const user = await context.session?.get("user");
  context.locals.user = user ?? null;

  if (!user) {
    context.locals.accessToken = null;
    if (context.url.pathname.startsWith("/dashboard")) {
      return context.redirect("/");
    }
    return next();
  }

  await refreshTokenIfNeeded(context);
  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth);
```

### Benefits

| Item | Before | After |
|------|--------|-------|
| auth line count | ~70 lines (including locale) | ~30 lines (auth only) |
| Testability | Locale and auth are coupled | Each middleware testable independently |
| Reusability | Cannot use locale without auth | locale can be applied alone |

## Improvement 2: CSP Header Builder Pattern

### Current Problem

```typescript
// One long string — hard to find the part to change
"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ..."
```

### Improvement: Object-based Management

```typescript
const CSP_DIRECTIVES: Record<string, readonly string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  // After font migration: remove https://fonts.googleapis.com
  "font-src": ["'self'"],
  // After font migration: remove https://fonts.gstatic.com
  "img-src": ["'self'", "https://cdn.discordapp.com", "data:"],
  "connect-src": ["'self'", "https://discord.com"],
  "frame-ancestors": ["'none'"],
} as const;

const buildCsp = (directives: Record<string, readonly string[]>): string =>
  Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
```

### Benefits

- Adding/removing directives is clear at a per-directive level
- After the font migration in `13_FONTS_OPTIMIZATION.md`, simply remove external domains from `style-src` / `font-src`
- Diffs are easier to read during code review

## Improvement 3: Actions Auth Gating via Middleware

### Current Problem

```typescript
// actions/index.ts — manual requireAuth() call in every action
handler: async (input, context) => {
  requireAuth(context);  // Forgetting this creates a security hole
  // ...
}
```

### Improvement: Pre-validation with getActionContext()

Use `getActionContext()` in middleware to enforce authentication before action execution:

```typescript
import { getActionContext } from "astro:actions";

const actionAuth = defineMiddleware(async (context, next) => {
  const actionCtx = getActionContext(context);

  // Skip if not an Action request
  if (!actionCtx.action) {
    return next();
  }

  // Require auth for all Actions
  if (!context.locals.user) {
    actionCtx.setActionError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
    return next();
  }

  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth, actionAuth);
```

### Actions Side Changes

```typescript
// Before: requireAuth() in each handler
handler: async (input, context) => {
  requireAuth(context);
  // ...
}

// After: authenticated by middleware — requireAuth() not needed
handler: async (input, _context) => {
  // Auth is guaranteed by middleware
  // ...
}
```

### Benefits

- Eliminates the risk of missing authentication
- Action handlers focus purely on business logic
- For testing, just swap out the middleware to skip authentication

## Improvement 4: Leveraging context.rewrite()

### Use Case 1: Fallback for Unauthenticated Users

```typescript
// Current: redirect to landing page
if (!user && context.url.pathname.startsWith("/dashboard")) {
  return context.redirect("/");
}

// Improvement: rewrite to show landing page without changing URL
// Avoids giving users the feeling of being "redirected"
if (!user && context.url.pathname.startsWith("/dashboard")) {
  return context.rewrite("/");
}
```

### Use Case 2: Locale-based Rewrite

For future path-based locale routing (`/en/dashboard`, `/ja/dashboard`):

```typescript
const locale = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // /en/* → Set locale and return content at path with /en removed
  if (pathname.startsWith("/en/")) {
    context.locals.locale = "en";
    return context.rewrite(pathname.replace("/en", ""));
  }

  context.locals.locale = "ja";
  return next();
});
```

### Choosing Between redirect and rewrite

| Method | URL Change | HTTP Code | Use Case |
|--------|-----------|------------|----------|
| `context.redirect()` | Yes | 302/301 | Auth failure → redirect to login |
| `context.rewrite()` | No | 200 | Fallback, locale |
| `Astro.rewrite()` | No | 200 | Conditional branching within a page |

## Improvement 5: Error Page Integration

### Adding 500.astro

Starting from Astro 4.11+, a custom error page can be placed at `src/pages/500.astro`:

```astro
---
// src/pages/500.astro
const error = Astro.props.error;
---
<Layout>
  <h1>{Astro.locals.locale === "ja" ? "サーバーエラー" : "Server Error"}</h1>
  {import.meta.env.DEV && <pre>{error?.message}</pre>}
</Layout>
```

### Middleware Considerations

- Middleware runs **before rendering** the 500 error page as well
- Values set in `Astro.locals` by middleware are available in the error page
- However, if the middleware itself is the cause of the error, 500.astro will also fail — defensive exception handling in middleware is important

```typescript
const securityHeaders = defineMiddleware(async (_context, next) => {
  // Implement defensively to prevent the middleware itself from throwing errors
  const response = await next();
  applySecurityHeaders(response);
  return response;
});
```

## Improvement 6: Session Parallel Read Optimization

### Current (Good Implementation)

```typescript
// Already parallelized with Promise.all — maintain this
const [sessionLocale, user, expiresAt, accessToken] = await Promise.all([
  context.session?.get("locale"),
  context.session?.get("user"),
  context.session?.get("expiresAt"),
  context.session?.get("accessToken"),
]);
```

### Note: When Splitting Middleware

When splitting locale and auth, KV accesses become distributed. Since Astro Sessions caches session data, duplicate accesses within the same request are optimized, but this should be verified through performance measurement.

## Migration Checklist

- [ ] Separate locale processing from auth middleware into a `locale` middleware
- [ ] Change CSP headers to object-based structure
- [ ] Add auth gating with `getActionContext()`
- [ ] Remove manual `requireAuth()` calls from `actions/index.ts`
- [ ] Add `src/pages/500.astro` custom error page
- [ ] Consider changing redirect to rewrite (unauthenticated fallback)
- [ ] Measure session KV access performance after middleware splitting
- [ ] Create unit tests for each middleware
