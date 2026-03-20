# UI Testing Implementation Guidelines

## Purpose

- Verify components from the perspective of "how a user interacts with them"
- Create tests that are resilient to DOM structure changes

## Scope

- `services/web/shared/components/**`
- Container/Presentational boundaries in `services/web/features/**`

## Implementation Rules

1. Prefer Role/Label/Text when selecting elements
2. Reproduce events using `user-event` equivalent operations
3. Verify props/state variations with table-driven tests
4. Verify visible results, not implementation details (class names, internal state)

## Mocking Policy

- Default: no mocking (use real child components whenever possible)
- Exception: use fixed responses only at the network boundary (e.g., MSW)
- Purpose: validate UI logic, not the availability of external SaaS

## Query Priority

1. `getByRole`
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByTestId` (last resort)

## Execution Commands

- `pnpm --filter web vitest run`

## References (Primary Sources)

- Testing Library Guiding Principles: <https://testing-library.com/docs/guiding-principles>
- Testing Library Query Priority: <https://testing-library.com/docs/queries/about/#priority>
- Next.js Testing (Vitest + Testing Library): <https://nextjs.org/docs/app/guides/testing/vitest>
