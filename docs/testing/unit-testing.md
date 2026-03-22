# Unit Testing Implementation Guidelines

## Purpose

- Guarantee the behavior of pure functions, domain models, and small use cases at high speed
- Keep specification granularity small and run the shortest TDD feedback loop

## Scope

- Pure logic in `packages/*`
- Domain schemas and types in `service/vspo-schedule/v2/web/src/features/shared/domain/**`
- Utilities in `service/vspo-schedule/v2/web/src/features/shared/utils/**`
- Domain models in `service/bot-dashboard/src/features/*/domain/**`
- Usecases in `service/bot-dashboard/src/features/*/usecase/**`
- Shared utilities in `service/bot-dashboard/src/features/shared/lib/**`

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
- Web: `pnpm --filter vspo-schedule-v2-web vitest run`
- Packages: `pnpm --filter @vspo-lab/* test`

### Bot Dashboard Component Testing

The bot-dashboard uses Astro's experimental Container API for server-side component testing (the `experimental_` prefix indicates this API may change in future Astro versions):

```typescript
import { experimental_AstroContainer as AstroContainer } from "astro/container";

const container = await AstroContainer.create();
const html = await container.renderToString(MyComponent, {
  props: { ... },
  locals: { locale: "ja" },
});
```

Key patterns:
- **`renderToString`** renders components to HTML strings for assertion
- **`locals`** injects `Astro.locals` (locale, user, etc.) for testing
- **`parseHtml`** (via `testing-library/dom`) parses HTML for DOM queries
- **Table-driven tests** (`it.each`) for i18n and variant testing

## References (Primary Sources)

- Vitest `test.each`: <https://vitest.dev/api/#test-each>
- Vitest Mocking (over-mocking warnings): <https://vitest.dev/guide/mocking.html>
- t_wada guidelines: `docs/web-frontend/twada-tdd.md`
