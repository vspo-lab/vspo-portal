# @vspo-lab/api

API client package for interacting with Vspo Portal backend services.

## Installation

```bash
pnpm add @vspo-lab/api
```

## Usage

```typescript
import { VSPOApi } from '@vspo-lab/api';

const api = new VSPOApi({
  baseUrl: 'https://api.vspo-schedule.com',
  apiKey: process.env.VSPO_API_KEY,
});

// Every call returns a `Result<T, AppError>` from `@vspo-lab/error`
const result = await api.streams.list({ limit: "20", page: "0" });
if (result.err) {
  console.error(result.err.message);
} else {
  console.log(result.val);
}
```

The client exposes `streams`, `creators`, `clips`, `events`, and `freechats` resources,
and automatically retries failed requests (`retry.attempts`, default `3`). When
`baseUrl` points at a local environment, calls are served from built-in mock data
instead of hitting the network.

## Dependencies

- @vspo-lab/error: workspace package

## Development

```bash
# Build the package
pnpm build

# Generate the client from the OpenAPI spec (writes src/gen/openapi.ts)
pnpm generate-openapi
```

## Version

Current version: 0.1.0
