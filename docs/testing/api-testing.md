# API Testing Implementation Guidelines

## Purpose

- Ensure HTTP endpoint contracts (status/header/body) are not broken
- Detect divergence between OpenAPI and implementation early

## Scope

- Routes in `services/api/presentation/**`
- Authentication, validation, and response formatting

## Implementation Rules

1. Hit the Hono app directly using `testClient` or `app.request()`
2. Always include failure contracts for 4xx/5xx, not just 200-series
3. Cover input variations with table-driven tests
4. Use the OpenAPI `/doc` as the input source for contract tests

## Mocking Policy

- Default: no mocking (pass through route -> UseCase -> Repository with real implementations)
- Exception: replace only external API calls at the boundary

## Contract Testing

- API cases: Vitest + Hono testClient
- OpenAPI contracts: validate `/doc` with tools like Schemathesis

## Execution Commands

- API unit/integration: `pnpm --filter api test:run`
- API integration (separate config): `pnpm --filter api test:integration`

## References (Primary Sources)

- Hono Testing Helper: https://hono.dev/docs/helpers/testing
- Hono `app.request()`: https://hono.dev/docs/api/hono#request
- Playwright API Testing: https://playwright.dev/docs/api-testing
- Schemathesis CLI: https://schemathesis.readthedocs.io/en/stable/reference/cli/
