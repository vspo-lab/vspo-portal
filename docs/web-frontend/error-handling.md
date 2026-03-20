# Result-based Error Handling

This project uses a `Result` type to unify error handling without `try-catch` in
application code. Asynchronous boundaries are wrapped with `wrap`, which returns
`Ok` or `Err`.

## Implementation

- [result.ts](../../packages/errors/result.ts) — Result type, Ok, Err, wrap
- [base.ts](../../packages/errors/base.ts) — BaseError type
- [error.ts](../../packages/errors/error.ts) — AppError class

## Usage

### Basic: wrap and propagate

When the Result from `wrap` can be returned directly, do so without re-wrapping:

```ts
// wrap returns Result<string, AppError> — return it as-is
return await wrap(
  response.text(),
  (error) =>
    new AppError({
      message: "Failed to read asset text",
      code: "INTERNAL_SERVER_ERROR",
      cause: error,
    }),
);
```

### Early return on error

When you need to inspect the result before continuing, check `err` and
return early:

```ts
const textResult = await wrap(
  response.text(),
  (error) =>
    new AppError({
      message: "Failed to read asset text",
      code: "INTERNAL_SERVER_ERROR",
      cause: error,
    }),
);

if (textResult.err) {
  return Err(textResult.err);  // propagate the error
}

// After the guard, textResult.val is narrowed to the success type
const text = textResult.val;
```

## How It Works
`Result<T, E>`: A union type where success holds `val` and failure holds `err`.

`wrap`: Takes a promise, awaits it, and returns `Ok(val)` or `Err(err)` with
the error created by `errorFactory`.

Benefit: This keeps error handling concise and type-safe for async operations.

## Benefits
- Type Safety: TypeScript narrows based on `result.err`.
- Simplicity: Replaces verbose try/catch blocks for promises.
- Flexibility: Customize error types with `AppError` or domain errors.

## Async Handling Rules

**Always use `await`, never use `.then()`**

```ts
// ✅ Good: Use await
const result = await wrap(fetchData(), errorFactory);

// ❌ Bad: Don't use .then()
wrap(fetchData(), errorFactory).then((result) => { ... });
```

Reason:
- `await` makes control flow explicit and easier to follow
- Error handling with Result type works naturally with `await`
- `.then()` chains lead to nested callbacks and harder debugging

**Notes:**
- Use `wrap` at async boundaries; avoid `try-catch` in app logic.
- `wrap` casts thrown values to `Error` (`e as Error`). The `errorFactory`
  callback receives `Error`, but non-Error throws (e.g., a thrown string) will
  arrive with missing `message`/`stack` properties. In practice this is safe
  because standard libraries throw `Error` instances.

---

## Current Error Codes

`AppError` uses the `ErrorCode` type defined in [code.ts](../../packages/errors/code.ts).
Available codes: `BAD_REQUEST`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR`, `USAGE_EXCEEDED`,
`DISABLED`, `NOT_FOUND`, `NOT_UNIQUE`, `RATE_LIMITED`, `UNAUTHORIZED`,
`PRECONDITION_FAILED`, `INSUFFICIENT_PERMISSIONS`, `METHOD_NOT_ALLOWED`.

---

## Planned: Domain Error Codes

> **Status: Not yet implemented.** The files referenced below (`domain-code.ts`,
> `domain-context.ts`, `error-messages.ts`) do not exist yet. This section describes
> a planned extension for domain-specific error codes (`E1xxx`-`E4xxx`) with
> type-safe context and user-facing messages. See the git history of this file for
> the full design draft.
