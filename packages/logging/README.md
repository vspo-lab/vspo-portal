# @vspo-lab/logging

Logging utilities for Vspo Portal services, with per-request context (request ID,
service name, extra fields) propagated via `AsyncLocalStorage`.

## Installation

```bash
pnpm add @vspo-lab/logging
```

## Usage

```typescript
import { AppLogger } from '@vspo-lab/logging';

// Run request-scoped logging (attaches a requestId to every log in `fn`)
await AppLogger.runWithContext({ service: 'api' }, async () => {
  AppLogger.info('Application started');
  AppLogger.error('An error occurred', { error: new Error('Details') });
});
```

`AppLogger` also exposes `debug`/`warn` at both the static and instance level, and
`getInstance({ LOG_MINLEVEL, ... })` to configure the minimum log level (`LogLevel`:
`DEBUG` < `INFO` < `WARN` < `ERROR`, defaults to `INFO`).

## Development

```bash
# Build the package
pnpm build
```

## Version

Current version: 0.1.0
