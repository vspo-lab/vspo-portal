# Testing Strategy Overview

This directory is the Single Source of Truth for implementation guidelines per test type.

## Common Principles

- Follow t_wada-based `Red-Green-Refactor` in short cycles
- Use table-driven tests (`it.each` / `test.each`) as the standard form
- Default is "no mocking." Pass through internal dependencies with real implementations
- Exception: mock only boundaries outside your control, such as external SaaS, payment, and email services
- Verify behavior visible to the consumer, not implementation details

## Test Types and Responsibilities

| Type | Purpose | Primary Tools | Guidelines |
| --- | --- | --- | --- |
| Unit | Verify local behavior of functions/domains | Vitest | Fast, pure, minimal side effects |
| Integration | Verify collaboration across multiple modules | Vitest | Pass through feature modules with real API client |
| API | Ensure API client contracts and data fetching | Vitest + MockHandler | Validate VSPOApi client and mock data |
| UI | Verify components from the user's perspective | Vitest + Testing Library | Role-based selection, real DOM focus |
| VRT | Detect visual regressions | Storybook + Playwright | Stabilize snapshots |
| E2E | Guarantee entire user flows | Playwright | Verify paths in production-equivalent environments |

## Coverage Policy

| Target Package | Minimum Coverage | CI Enforced |
| --- | --- | --- |
| `packages/**` | 60% | Yes |
| `service/vspo-schedule/v2/web/src/features/shared/**` | 50% | No (recommended) |

- PRs that fall below the threshold will fail in CI
- Thresholds are raised incrementally (initial settings are conservative)
- Do not write meaningless tests just for coverage. Achieve coverage naturally through tests that verify behavior

## Document Index

- [unit-testing.md](./unit-testing.md)
- [integration-testing.md](./integration-testing.md)
- [api-testing.md](./api-testing.md)
- [ui-testing.md](./ui-testing.md)
- [vrt-testing.md](./vrt-testing.md)
- [e2e-testing.md](./e2e-testing.md)
