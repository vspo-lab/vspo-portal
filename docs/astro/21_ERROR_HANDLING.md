# Error Handling Improvements

## Current State

### Error Flow Overview

```text
RPC call (vspo-server)
  → Result<T, AppError>
    → Repository returns Result
      → UseCase returns Result
        → Action handler: unwrapOrThrow(result)
          → ActionError { code: "INTERNAL_SERVER_ERROR" }
            → Astro.getActionResult() in page
              → FlashMessage.astro / ErrorAlert.astro
```

### Error Handling Components

| Layer | File | Mechanism | Issues |
|-------|------|-----------|--------|
| Parse | `features/shared/lib/parse.ts` | `parseResult()` → `Result<T, AppError>` | Clean, no issues |
| Repository | `features/channel/repository/vspo-channel-api.ts` | Returns `Result<T, AppError>` | Dev-mock returns `Err` for write ops |
| UseCase | `features/channel/usecase/add-channel.ts` | Passes through `Result` | Thin wrapper, no error enrichment |
| Action | `actions/index.ts` | `unwrapOrThrow()` → `ActionError` | All errors map to `INTERNAL_SERVER_ERROR` |
| API Route | `pages/api/guilds/[guildId]/channels.ts` | Manual `result.err.message` in JSON | Leaks internal error messages |
| Page | `pages/dashboard/[guildId].astro` | `Astro.getActionResult()` → `FlashMessage` | No `isInputError()` handling |
| UI | `FlashMessage.astro` | CSS animation auto-dismiss | Generic messages only |
| UI | `ErrorAlert.astro` | Static error alert with retry link | No error type differentiation |
| Error Page | `pages/404.astro` | Custom 404 page | Works correctly |
| Error Page | (missing) | No `500.astro` | Unhandled server errors show default page |

## Issue 1: `unwrapOrThrow` Maps All Errors to `INTERNAL_SERVER_ERROR`

### Current Implementation

```typescript
// actions/index.ts
const unwrapOrThrow = <T>(result: {
  err?: { message: string } | null;
  val?: T;
}): T => {
  if (result.err) {
    throw new ActionError({
      code: "INTERNAL_SERVER_ERROR",
      message: result.err.message,
    });
  }
  return result.val as T;
};
```

### Problems

1. **Lost error semantics**: `AppError` has a `code` field (`"NOT_FOUND"`, `"BAD_REQUEST"`, `"UNAUTHORIZED"`, etc.) that is discarded. Every backend error becomes a generic 500.
2. **Leaked internal messages**: `result.err.message` is passed directly to `ActionError.message`, which is sent to the client. This can expose RPC error details, stack traces, or internal identifiers.
3. **No client-side differentiation**: The page cannot distinguish between "channel not found" vs "RPC timeout" vs "validation failure" because all errors have the same code.

### Proposed: `AppError` to `ActionErrorCode` Mapping

```typescript
import { ActionError } from "astro:actions";
import type { ActionErrorCode } from "astro:actions";
import type { AppError } from "@vspo-lab/error";

/** Map AppError codes to Astro ActionError codes */
const toActionErrorCode = (appErrorCode: string): ActionErrorCode => {
  const mapping: Record<string, ActionErrorCode> = {
    BAD_REQUEST: "BAD_REQUEST",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    CONFLICT: "CONFLICT",
    TIMEOUT: "TIMEOUT",
    TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  };
  return mapping[appErrorCode] ?? "INTERNAL_SERVER_ERROR";
};

/** Safe error messages for each code (never expose internal details) */
const safeMessages: Record<string, string> = {
  BAD_REQUEST: "Invalid request parameters",
  NOT_FOUND: "The requested resource was not found",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You do not have permission to perform this action",
  CONFLICT: "The operation conflicts with current state",
  TIMEOUT: "The operation timed out. Please try again",
  TOO_MANY_REQUESTS: "Too many requests. Please wait and try again",
  INTERNAL_SERVER_ERROR: "An unexpected error occurred",
};

const unwrapOrThrow = <T>(result: { err?: AppError | null; val?: T }): T => {
  if (result.err) {
    const code = toActionErrorCode(result.err.code);
    throw new ActionError({
      code,
      message: safeMessages[code] ?? safeMessages.INTERNAL_SERVER_ERROR,
    });
  }
  return result.val as T;
};
```

### Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Error codes | Always `INTERNAL_SERVER_ERROR` | Preserves semantic codes |
| Client messages | Internal error strings | Safe, user-friendly messages |
| Client differentiation | Impossible | `error.code` based branching |
| HTTP status codes | Always 500 | Proper 400/401/403/404/409/429/500 |

## Issue 2: Missing `500.astro` Error Page

### Current State

There is a `404.astro` page but no `500.astro`. When an unhandled error occurs during SSR (e.g., a middleware crash, session storage failure, or uncaught exception in a page's frontmatter), Cloudflare Workers returns a bare error response.

### Proposed: `src/pages/500.astro`

```astro
---
import Base from "~/layouts/Base.astro";
import Button from "~/features/shared/components/Button.astro";

// The error prop is automatically provided by Astro (since v4.11)
interface Props {
  error: unknown;
}

const { error } = Astro.props;

// Never display raw error details in production
const isDev = import.meta.env.DEV;
const errorMessage =
  isDev && error instanceof Error ? error.message : undefined;
---

<Base title="500 - Server Error" noindex>
  <main
    id="main-content"
    class="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center"
  >
    <h1
      class="font-heading text-7xl font-extrabold tracking-tight text-on-surface sm:text-9xl"
    >
      500
    </h1>
    <p class="mt-4 text-lg text-on-surface-variant">
      Something went wrong. Please try again later.
    </p>
    {isDev && errorMessage && (
      <pre class="mt-4 max-w-lg overflow-auto rounded bg-surface-container p-4 text-left text-xs text-on-surface-variant">
        {errorMessage}
      </pre>
    )}
    <Button as="a" href="/" variant="primary" size="lg" class="mt-8 gap-2">
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
      Return Home
    </Button>
  </main>
</Base>
```

### Key Points

- Astro automatically passes the `error` prop to `500.astro` (since v4.11)
- Only show error details in dev mode to aid debugging
- Match the 404 page's visual design for consistency
- Middleware runs before error pages, so `Astro.locals` may not be populated — avoid depending on locale or user data

## Issue 3: Flash Message vs `getActionResult()` Pattern Consolidation

### Current Implementation

The guild detail page (`[guildId].astro`) uses two separate patterns:

### Pattern A: Post-Redirect-Get (PRG) with query parameter

```typescript
// If action succeeded, redirect to refresh data
if (addResult?.data?.success || ...) {
  return Astro.redirect(`/dashboard/${guildId}?flash=${flashType}`);
}

// On reload, read flash type from query param
const flashType = Astro.url.searchParams.get("flash");
```

### Pattern B: Direct `getActionResult()` for errors

```typescript
const actionError = addResult?.error ?? updateResult?.error ?? ...;
```

### Problem

1. **Success messages use query params** (`?flash=add`), which persist in the URL after refresh, potentially showing stale messages on bookmark/back-navigation
2. **Error messages use `getActionResult()`**, which is the correct Astro pattern
3. **Two different flows** for success vs error adds complexity

### Proposed: Unified `getActionResult()` Pattern

```typescript
// Check all action results
const addResult = Astro.getActionResult(actions.addChannel);
const updateResult = Astro.getActionResult(actions.updateChannel);
const deleteResult = Astro.getActionResult(actions.deleteChannel);
const resetResult = Astro.getActionResult(actions.resetChannel);

// Determine which action completed (if any)
const completedAction = [
  { result: addResult, type: "add" },
  { result: updateResult, type: "update" },
  { result: deleteResult, type: "delete" },
  { result: resetResult, type: "reset" },
].find((a) => a.result?.data || a.result?.error);

const flashType = completedAction?.result?.data ? completedAction.type : null;
const actionError = completedAction?.result?.error ?? null;
```

### Trade-off

The PRG redirect pattern exists because after a successful mutation, the page data needs to be re-fetched to reflect the change. Without the redirect, the page would show stale data. Options:

1. **Keep PRG for success, use session-based flash**: Store flash type in session instead of query param, read and clear on next load
2. **Use `Astro.rewrite()`**: After successful action, rewrite the current page to re-execute the frontmatter data fetching
3. **Accept PRG but clean the URL**: Use `history.replaceState()` client-side to strip the `?flash=` param after displaying

Option 3 is the simplest improvement with the least refactoring:

```astro
<!-- Add to [guildId].astro after FlashMessage -->
{flashType && (
  <script is:inline>
    history.replaceState(null, "", location.pathname);
  </script>
)}
```

## Issue 4: No `isInputError()` Handling for Form Validation

### Current State

Action inputs use basic Zod schemas without detailed validation:

```typescript
input: z.object({
  guildId: z.string(),
  channelId: z.string(),
}),
```

When Zod validation fails (e.g., missing required field), Astro returns an `isInputError` result with per-field errors. However, the page only displays the generic `error.message`:

```typescript
const actionError = addResult?.error ?? ...;
// FlashMessage shows: result?.error?.message ?? "An error occurred"
```

### Proposed: Input Error Display

```astro
---
import { isInputError } from "astro:actions";

const actionError = addResult?.error ?? ...;
const inputErrors = isInputError(actionError) ? actionError.fields : null;
---

{inputErrors && (
  <div role="alert" class="rounded-xl bg-destructive/10 p-4 text-sm">
    <p class="font-medium">Please fix the following errors:</p>
    <ul class="mt-2 list-inside list-disc">
      {Object.entries(inputErrors).map(([field, errors]) => (
        <li>{field}: {errors.join(", ")}</li>
      ))}
    </ul>
  </div>
)}
```

### When This Matters

This becomes important when input validation is strengthened (see `17_ACTIONS_PATTERNS.md` for Discord Snowflake validation). With stricter Zod schemas:

```typescript
input: z.object({
  guildId: z.string().regex(/^\d{17,20}$/, "Invalid guild ID"),
  channelId: z.string().regex(/^\d{17,20}$/, "Invalid channel ID"),
}),
```

Input validation errors will carry field-specific messages that should be displayed to the user.

## Issue 5: Error Handling in React Islands

### Current State

There are no error boundaries for React Islands. If a React component throws during render, the entire island crashes with an unhandled error.

### Proposed: Shared Error Boundary

```tsx
// features/shared/components/ErrorBoundary.tsx
import { Component, type ReactNode } from "react";

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="rounded-xl bg-destructive/10 p-4 text-sm text-on-surface"
          >
            Something went wrong. Please reload the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

### Usage in Astro Pages

```astro
---
import ErrorBoundary from "~/features/shared/components/ErrorBoundary";
import ChannelAddModalReact from "~/features/channel/components/ChannelAddModal";
---

<ErrorBoundary client:load>
  <ChannelAddModalReact client:load guildId={guildId} channels={channels} />
</ErrorBoundary>
```

### Note

Error boundaries only catch errors during React rendering. They do not catch errors in:

- Event handlers (use try-catch or Result pattern)
- Async code (use `.catch()` or Result pattern)
- Server-side rendering (handled by Astro's error pages)

## Issue 6: Safe Error Messages in API Routes

### Current State

The channels API route leaks internal error messages:

```typescript
if (result.err) {
  return new Response(JSON.stringify({ error: result.err.message }), {
    status: 500,
  });
}
```

### Proposed

Replace with safe, generic error messages (see `20_API_ROUTES.md` Improvement 2 for the full implementation):

```typescript
if (result.err) {
  return jsonResponse({ error: "Failed to fetch channels" }, 500);
}
```

This applies to all API routes that return error information. Internal error details should only be logged server-side, never sent to the client.

## Issue 7: Inconsistent Error Component Usage

### Current Components

| Component | Used In | Purpose |
|-----------|---------|---------|
| `FlashMessage.astro` | `[guildId].astro` | Temporary toast for action results |
| `ErrorAlert.astro` | `[guildId].astro`, `dashboard/index.astro` | Persistent error with retry link |

### Issues

1. **FlashMessage auto-dismisses** after 5 seconds via CSS animation — if the user misses it, the feedback is lost
2. **ErrorAlert has no icon differentiation** — always shows a warning triangle regardless of severity
3. **No loading state component** — when actions are pending, there is no visual feedback

### Proposed Improvements

1. **Add dismiss button to FlashMessage**: Allow manual dismissal in addition to auto-dismiss
2. **Error severity levels**: Differentiate between warnings and critical errors visually
3. **Loading indicator**: Add a `<Spinner>` or progress indicator component for action submission feedback

## Migration Checklist

- [ ] Implement `toActionErrorCode` mapping in `actions/index.ts`
- [ ] Replace `result.err.message` with safe error messages in `unwrapOrThrow`
- [ ] Create `src/pages/500.astro` error page
- [ ] Add `history.replaceState` to clean flash query params from URL
- [ ] Add `isInputError()` handling to `[guildId].astro`
- [ ] Create `ErrorBoundary.tsx` React component
- [ ] Replace raw error messages in API routes with generic messages
- [ ] Add dismiss button to `FlashMessage.astro`
- [ ] Strengthen Zod input schemas with Discord Snowflake regex
