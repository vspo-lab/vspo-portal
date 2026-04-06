# Astro Actions Pattern Improvements

## Current State

### Actions Definition (`src/actions/index.ts`)

```typescript
export const server = {
  addChannel: defineAction({
    accept: "form",
    input: z.object({
      guildId: z.string(),
      channelId: z.string(),
    }),
    handler: async (input, context) => {
      requireAuth(context);
      const result = await AddChannelUsecase.execute({ ... });
      unwrapOrThrow(result);
      return { success: true as const };
    },
  }),
  // updateChannel, resetChannel, deleteChannel follow the same pattern
};
```

### Utilities

```typescript
// Manual call in each handler
const requireAuth = (context) => {
  if (!context.locals.user) {
    throw new ActionError({ code: "UNAUTHORIZED" });
  }
};

// Result -> ActionError conversion
const unwrapOrThrow = <T>(result) => {
  if (result.err) {
    throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: result.err.message });
  }
  return result.val as T;
};
```

### Issues

1. **Manual auth calls**: `requireAuth()` must be called in each handler — risk of omission
2. **Limited error codes**: Only `UNAUTHORIZED` and `INTERNAL_SERVER_ERROR`. No `NOT_FOUND`, `BAD_REQUEST` distinction
3. **Weak input validation**: `guildId` / `channelId` are plain `z.string()` — no Discord Snowflake format verification
4. **Missing form error display**: `isInputError()` / `isActionError()` utilities not used
5. **Unused `getActionResult()`**: Post-form-submission error display relies solely on flash messages

## Improvement 1: Auth Gating via getActionContext()

### Overview

Use `getActionContext()` (Astro 5.0+) in middleware to centralize authentication for all Actions.

### Implementation

```typescript
// src/middleware.ts
import { getActionContext } from "astro:actions";

const actionAuth = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);

  // Skip if not an Action request
  if (!action) {
    return next();
  }

  // Require auth for all Actions
  if (!context.locals.user) {
    const result = { data: undefined, error: new ActionError({ code: "UNAUTHORIZED" }) };
    setActionResult(action.name, serializeActionResult(result));
    return next();
  }

  // For form submissions, execute handler in middleware and set result
  if (action.calledFrom === "form") {
    const result = await action.handler();
    setActionResult(action.name, serializeActionResult(result));
  }

  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth, actionAuth);
```

### Actions Side Changes

```typescript
// Before: manual requireAuth() in each handler
handler: async (input, context) => {
  requireAuth(context);  // Forgetting this creates a security hole
  // ...
}

// After: guaranteed by middleware — requireAuth() removed
handler: async (input, _context) => {
  // Auth is guaranteed by middleware
  // ...
}
```

### action.calledFrom Usage

| Value | Meaning | Use Case |
|-------|---------|----------|
| `"form"` | Submitted from HTML `<form action={...}>` | CSRF protected, handler executable in middleware |
| `"rpc"` | Client call via `actions.xxx()` | JSON-RPC format |

## Improvement 2: Detailed Error Codes

### ActionErrorCode Reference

All error codes provided by Astro:

| Code | HTTP | Use Case |
|------|------|----------|
| `BAD_REQUEST` | 400 | Input validation error |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `TIMEOUT` | 408 | Timeout |
| `CONFLICT` | 409 | Duplicate operation |
| `PRECONDITION_FAILED` | 412 | Precondition not met |
| `PAYLOAD_TOO_LARGE` | 413 | Payload exceeded |
| `TOO_MANY_REQUESTS` | 429 | Rate limited |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service down |
| `GATEWAY_TIMEOUT` | 504 | Upstream timeout |

### Improvement Example

```typescript
const unwrapOrThrow = <T>(result: Result<T>): T => {
  if (result.err) {
    // Select appropriate code based on error type
    const code = mapErrorCode(result.err);
    throw new ActionError({ code, message: result.err.message });
  }
  return result.val;
};

const mapErrorCode = (error: AppError): ActionErrorCode => {
  switch (error.type) {
    case "NOT_FOUND": return "NOT_FOUND";
    case "VALIDATION": return "BAD_REQUEST";
    case "PERMISSION": return "FORBIDDEN";
    case "RATE_LIMIT": return "TOO_MANY_REQUESTS";
    default: return "INTERNAL_SERVER_ERROR";
  }
};
```

## Improvement 3: Input Validation Hardening

### Discord Snowflake Validation

```typescript
// features/shared/domain/discord.ts
const discordSnowflake = z.string().regex(/^\d{17,20}$/, "Invalid Discord Snowflake ID");

// actions/index.ts
addChannel: defineAction({
  accept: "form",
  input: z.object({
    guildId: discordSnowflake,
    channelId: discordSnowflake,
  }),
  handler: async (input, _context) => { ... },
}),
```

### Benefits

- Zod validation errors are automatically accessible via `isInputError()`
- The `input` schema can be shared for client-side pre-submission validation

## Improvement 4: Form Error Display

### Using isInputError()

```astro
---
// pages/dashboard/[guildId].astro
import { actions, isInputError } from "astro:actions";

const result = Astro.getActionResult(actions.addChannel);
const inputErrors = isInputError(result?.error) ? result.error.fields : {};
---

{result?.error && !isInputError(result.error) && (
  <div class="alert alert-error">
    {result.error.code === "UNAUTHORIZED"
      ? t.errors.unauthorized
      : t.errors.general}
  </div>
)}

<form method="POST" action={actions.addChannel}>
  <input name="channelId" />
  {inputErrors.channelId && (
    <p class="text-red-500 text-sm">{inputErrors.channelId.join(", ")}</p>
  )}
  <button type="submit">{t.addChannel}</button>
</form>
```

### Using isActionError() in React Islands

```tsx
// features/channel/components/ChannelAddForm.tsx
import { actions, isActionError } from "astro:actions";

const handleSubmit = async (formData: FormData) => {
  const { data, error } = await actions.addChannel(formData);

  if (isActionError(error)) {
    switch (error.code) {
      case "UNAUTHORIZED":
        window.location.href = "/";
        break;
      case "BAD_REQUEST":
        setFieldErrors(error.fields ?? {});
        break;
      case "CONFLICT":
        setError("This channel has already been added");
        break;
      default:
        setError("An error occurred");
    }
    return;
  }

  // Handle success
};
```

## Improvement 5: orThrow() Pattern

### Simplified Prototyping

```typescript
// During development — deferring error handling
const data = await actions.addChannel.orThrow({ guildId, channelId });
// data returns the result directly (throws on error)
```

### Production: data/error Pattern Recommended

```typescript
// Production — proper error handling
const { data, error } = await actions.addChannel({ guildId, channelId });
if (error) {
  // Handle error
  return;
}
// Use data
```

## Improvement 6: Form Input Preservation with View Transitions

### Problem: Input Loss on Error

Form input values are lost on MPA reload when submission fails.

### Solution: transition:persist

```astro
<form method="POST" action={actions.updateChannel}>
  <input
    name="channelId"
    value={channelId}
    transition:persist
  />
  <select name="language" transition:persist>
    <option value="ja">Japanese</option>
    <option value="en">English</option>
  </select>
  <button type="submit">Save</button>
</form>
```

**Prerequisite**: View Transitions (`<ClientRouter />`) must be enabled.

## Improvement 7: POST / Redirect / GET (PRG) Pattern with Session Persistence

### Problem

When a form action completes (success or error), the browser stays on a POST response. Refreshing the page triggers a "confirm form resubmission?" dialog. Additionally, action results (`Astro.getActionResult()`) reset to `undefined` if the user navigates away and returns.

### Solution: PRG with `getActionContext()` Middleware

Use `getActionContext()` in middleware to intercept form submissions, execute the handler, persist the result to a session, and redirect:

```typescript
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { getActionContext } from "astro:actions";

const actionPRG = defineMiddleware(async (context, next) => {
  const { action, setActionResult, serializeActionResult } =
    getActionContext(context);

  // Retrieve persisted result from session after redirect
  const sessionResult = await context.session?.get("actionResult");
  if (sessionResult) {
    setActionResult(sessionResult.actionName, sessionResult.actionResult);
    await context.session?.set("actionResult", undefined);
    return next();
  }

  // Intercept form submissions
  if (action?.calledFrom === "form") {
    const result = await action.handler();

    // Persist action result to session
    await context.session?.set("actionResult", {
      actionName: action.name,
      actionResult: serializeActionResult(result),
    });

    // On error: redirect back to the form page
    if (result.error) {
      const referer = context.request.headers.get("Referer");
      if (referer) return context.redirect(referer);
    }

    // On success: redirect to the current page (clears POST state)
    return context.redirect(context.originPathname);
  }

  return next();
});

export const onRequest = sequence(securityHeaders, locale, auth, actionPRG);
```

### Benefits

| Aspect | Before (Default) | After (PRG) |
|--------|-------------------|-------------|
| Page refresh | "Confirm resubmission?" dialog | Clean GET request |
| Action result persistence | Lost on navigation | Survives redirect |
| Browser back button | Re-submits form | Shows cached GET page |

### Cloudflare Session Driver

The `@astrojs/cloudflare` adapter auto-configures a session driver. No extra setup needed:

```typescript
// astro.config.ts — session driver is auto-configured by Cloudflare adapter
// Optionally configure session options:
export default defineConfig({
  session: {
    // Uses Cloudflare KV by default
    cookie: {
      name: "bot-dashboard-session",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    },
  },
});
```

## Improvement 8: `getActionPath()` for Custom Fetch Calls

### Problem

Some scenarios require custom headers (e.g., `Authorization`) or specific fetch options (e.g., `keepalive` for analytics) when calling actions.

### Solution

Use `getActionPath()` to get the URL path for an action and call it with `fetch()`:

```typescript
import { actions, getActionPath } from "astro:actions";

// Custom fetch with auth header
await fetch(getActionPath(actions.updateChannel), {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ guildId, channelId, config }),
});

// Fire-and-forget with sendBeacon (e.g., analytics)
navigator.sendBeacon(
  getActionPath(actions.trackEvent),
  new Blob([JSON.stringify({ event: "page_view" })], {
    type: "application/json",
  }),
);
```

## Improvement 9: Client-Side Redirects with `navigate()`

### Problem

After a successful client-side action call (from a React Island), the app needs to redirect to another page. Using `window.location.href` causes a full page reload, breaking View Transitions.

### Solution

Use `navigate()` from `astro:transitions/client` for smooth client-side navigation:

```tsx
// features/auth/components/LogoutButton.tsx
import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";

export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        const { error } = await actions.logout();
        if (!error) navigate("/");
      }}
    >
      Logout
    </button>
  );
}
```

**Prerequisite**: `<ClientRouter />` must be enabled in the layout.

## Migration Checklist

- [ ] Add `getActionContext()` auth middleware
- [ ] Remove manual `requireAuth()` calls from each Action handler
- [ ] Add detailed error code mapping to `unwrapOrThrow()`
- [ ] Add Discord Snowflake validation to Zod schemas
- [ ] Improve form error display with `Astro.getActionResult()` + `isInputError()`
- [ ] Implement error handling with `isActionError()` in React Islands
- [ ] Enable form input preservation with `transition:persist`
- [ ] Add business-logic-specific error codes to Action handler responses
- [ ] Implement POST/Redirect/GET pattern with session persistence
- [ ] Configure Cloudflare session driver for action result persistence
- [ ] Use `getActionPath()` for custom fetch calls where needed
- [ ] Use `navigate()` from `astro:transitions/client` for client-side redirects after actions
