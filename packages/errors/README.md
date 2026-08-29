# @vspo-lab/error

Error handling utilities for Vspo Portal services, built around a `Result` type
instead of throwing/catching exceptions.

## Installation

```bash
pnpm add @vspo-lab/error
```

## Usage

```typescript
import { wrap, Ok, Err, AppError, type Result } from '@vspo-lab/error';

// Build results directly
const success: Result<string> = Ok('done');
const failure: Result<string> = Err(new AppError({ message: 'Something went wrong', code: 'INTERNAL_SERVER_ERROR' }));

// Wrap a promise that may throw
const result = await wrap(fetch('https://example.com'), (e) =>
  new AppError({ message: e.message, code: 'INTERNAL_SERVER_ERROR', cause: e }),
);

if (result.err) {
  // result.err is an AppError with `code`, `status`, `message`, `cause`, `context`
} else {
  // result.val is the resolved value
}
```

`AppError` extends the abstract `BaseError` class and derives an HTTP `status` from
its `code` (one of `ErrorCode`: `BAD_REQUEST`, `FORBIDDEN`, `INTERNAL_SERVER_ERROR`,
`USAGE_EXCEEDED`, `DISABLED`, `NOT_FOUND`, `NOT_UNIQUE`, `RATE_LIMITED`,
`UNAUTHORIZED`, `PRECONDITION_FAILED`, `INSUFFICIENT_PERMISSIONS`,
`METHOD_NOT_ALLOWED`).

## Dependencies

- zod: ^4.4.3

## Development

```bash
# Build the package
pnpm build
```

## Version

Current version: 0.1.0
