# Unit Testing Implementation Guidelines

## Purpose

- Guarantee the behavior of pure functions, domain models, and small use cases at high speed
- Keep specification granularity small and run the shortest TDD feedback loop

## Scope

- Pure logic in `packages/*`
- Domain logic in `services/api/domain/**`
- Utilities in `services/web/shared/lib/**`

## Implementation Rules

1. One test, one behavior
2. Use `it.each` / `test.each` table-driven tests as the standard
3. Progress through `Red -> Green -> Refactor` one case at a time
4. Verify input/output contracts, not implementation details (private functions, internal state)

## Mocking Policy

- Default: no mocking
- Allowed: fix non-deterministic factors such as time, random numbers, and external communication with minimal stubs
- Prohibited: over-mocking internal modules, which couples tests to implementation details

## Table-Driven Test Template

```ts
import { describe, expect, it } from "vitest";

describe("normalizeText", () => {
  const cases = [
    { name: "trim only", input: "  foo  ", expected: "foo" },
    { name: "collapse spaces", input: "foo   bar", expected: "foo bar" },
  ];

  it.each(cases)("$name", ({ input, expected }) => {
    expect(normalizeText(input)).toBe(expected);
  });
});
```

## Execution Commands

- All: `pnpm test:unit`
- API only: `pnpm --filter api test:run`
- Web only: `pnpm --filter web vitest run`

## References (Primary Sources)

- Vitest `test.each`: https://vitest.dev/api/#test-each
- Vitest Mocking (over-mocking warnings): https://vitest.dev/guide/mocking.html
- t_wada guidelines: `docs/web-frontend/twada-tdd.md`
