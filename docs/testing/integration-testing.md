# Integration Testing Implementation Guidelines

## Purpose

- Guarantee the behavior of multi-module collaboration including UseCase, Repository, and DB
- Detect boundary mismatches (persistence, transactions, transformations) that unit tests cannot reveal

## Scope

- `services/api/usecase/**`
- `services/api/infra/repository/**`
- Application flows that include the DB

## Implementation Rules

1. Use real implementations for app internals (UseCase/Repository/DB)
2. Mock only at boundaries for external service dependencies
3. Enumerate business scenarios with table-driven tests
4. Keep each test independent; do not depend on data from previous cases

## Data Management

- Run migrate/seed before tests
- Create required data per test and avoid unnecessary shared state
- Ensure reproducibility in CI via `compose.test.yaml`

## Mocking Policy

- Default: no mocking (especially use a real DB)
- Exception: only uncontrollable external boundaries such as payment, email, and external SaaS

## File Placement

- `services/api/test/integration/**/*.test.ts`
- Align with the `include` setting in `services/api/vitest.integration.config.ts`

## Execution Commands

- All: `pnpm test:integration`
- API only: `pnpm --filter api test:integration`

## References (Primary Sources)

- Playwright Test Isolation: https://playwright.dev/docs/browser-contexts
- Next.js Testing (test type overview): https://nextjs.org/docs/app/guides/testing
- t_wada guidelines: `docs/web-frontend/twada-tdd.md`
