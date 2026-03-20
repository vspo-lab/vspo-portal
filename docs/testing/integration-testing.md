# Integration Testing Implementation Guidelines

## Purpose

- Guarantee the behavior of multi-module collaboration including UseCase, Repository, and DB
- Detect boundary mismatches (persistence, transactions, transformations) that unit tests cannot reveal

## Scope

- Feature modules in `service/vspo-schedule/v2/web/src/features/**`
- Cross-feature data flows through `features/shared/api/**`
- Application flows involving the external API client (`@vspo-lab/api`)

## Implementation Rules

1. Use real feature module implementations (API service layer, data transformations)
2. Mock only the external API boundary (`@vspo-lab/api` → `MockHandler`)
3. Enumerate business scenarios with table-driven tests
4. Keep each test independent; do not depend on data from previous cases

## Mocking Policy

- Default: use `MockHandler` for external API responses
- Exception: mock Cloudflare service bindings when testing Worker-specific behavior
- Prohibited: mocking internal feature module logic

## File Placement

- Colocated with feature: `service/vspo-schedule/v2/web/src/features/**/*.test.ts`
- Package tests: `packages/*/src/**/*.test.ts`

## Execution Commands

- All: `pnpm test:integration`
- Web: `pnpm --filter vspo-schedule-v2-web test:integration`

## References (Primary Sources)

- Playwright Test Isolation: https://playwright.dev/docs/browser-contexts
- Next.js Testing (test type overview): https://nextjs.org/docs/app/guides/testing
- t_wada guidelines: `docs/web-frontend/twada-tdd.md`
