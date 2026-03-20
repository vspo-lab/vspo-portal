# API Testing Implementation Guidelines

## Purpose

- Ensure API client contracts (`@vspo-lab/api`) are not broken
- Validate MockHandler responses match expected shapes
- Detect divergence between OpenAPI spec and client usage

## Scope

- API client usage in `service/vspo-schedule/v2/web/src/features/shared/api/**`
- Mock data in `packages/api/src/mock/**`
- Result type handling patterns

## Implementation Rules

1. Test API calls through `VSPOApi` client with `MockHandler` for deterministic data
2. Always include failure contracts (`Err` results), not just success paths
3. Cover input variations with table-driven tests
4. Validate response shapes against OpenAPI-generated types

## Mocking Policy

- Default: use `MockHandler` for API responses (no real network calls in tests)
- Validate that mock data matches OpenAPI-generated types from `packages/api/src/gen/`

## Execution Commands

- Web: `pnpm --filter vspo-schedule-v2-web test:run`
- API package: `pnpm --filter @vspo-lab/api test`

## References (Primary Sources)

- Vitest Mocking: https://vitest.dev/guide/mocking.html
- Orval (OpenAPI codegen): https://orval.dev/
