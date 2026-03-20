---
name: ui-testing
description: Implement UI tests using Testing Library priority queries and table-driven approach, verifying from the user's perspective with minimal mocks.
---

# Trigger Conditions

- When adding behavior tests for React components/screens
- When verifying UI from the user's perspective rather than implementation details

# Execution Checklist

1. Review `docs/testing/ui-testing.md`
2. Use `getByRole` as the preferred query for element selection
3. Use `it.each` to enumerate state/props variations
4. Pin only network boundaries with minimal mocking

# Reference Documents

- `docs/testing/ui-testing.md`
- `docs/web-frontend/twada-tdd.md`
