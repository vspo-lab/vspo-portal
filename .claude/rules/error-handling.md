---
description: 
globs: 
alwaysApply: false
---
---
description: Use a try/catch wrapper to avoid unnecessary indentations
globs: *.ts
alwaysApply: true
---
# TypeScript Async Try/Catch Wrapper

This utility provides a clean way to handle errors in asynchronous TypeScript code using a `Result` type. It wraps promises to return either a success value or an error.

## Implementation

[result.ts](mdc:packages/errors/result.ts)
[base.ts](mdc:packages/errors/base.ts)
[error.ts](mdc:packages/errors/error.ts)

## Usage
Example:
[index.ts](mdc:service/server/infra/discord/index.ts)
[discord.ts](mdc:service/server/usecase/discord.ts)
[discord.ts](mdc:service/server/infra/repository/discord.ts)

## How It Works
`Result<T, E>`: A union type where Success holds the resolved data and Failure holds the error. The default error type is Error.

`wrap`: Takes a promise, awaits it, and returns a Promise<Result> with either { data: T, error: null } or { data: null, error: E }.

Benefit: This keeps error handling concise and type-safe for async operations.


## Benefits
- Type Safety: TypeScript narrows data or error based on if (result.error) checks.
- Simplicity: Replaces verbose try/catch blocks for promises.
- Flexibility: Customize the error type E (defaults to Error).

Notes
This version is async-only. For synchronous code, you’d need a separate wrapper.

The error as E cast assumes the caught error fits the type E; refine it if you need stricter typing.
