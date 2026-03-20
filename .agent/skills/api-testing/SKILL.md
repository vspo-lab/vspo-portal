---
name: api-testing
description: "Build API client tests with Vitest and MockHandler. Validate OpenAPI contract compliance with table-driven tests and minimal mocks."
---

# Trigger

- When adding or modifying tests for API client methods
- When validating API response contracts or error handling paths

# Execution Checklist

1. Read `docs/testing/api-testing.md`
2. Enumerate normal and error cases in a table-driven format
3. Use `MockHandler` to stub external API responses — no real HTTP calls in unit tests
4. Verify `Result<T, AppError>` return values (both `.ok` and `.err` paths)
5. Test retry behavior for retryable errors (5xx, network failures)

# Reference Documents

- `docs/testing/api-testing.md`
- `docs/web-frontend/twada-tdd.md`
- `docs/backend/server-architecture.md` - MockHandler and VSPOApi client patterns
