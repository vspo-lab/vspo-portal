---
name: e2e-testing
description: Build E2E tests with Playwright, ensuring major user flows through production-equivalent paths. Avoid internal mocks and limit mocking to external boundaries only.
---

# Trigger Conditions

- When ensuring regression protection for major user flows
- When adding scenarios that span screens/API/authentication before a release

# Execution Checklist

1. Review `docs/testing/e2e-testing.md`
2. Split cases by business scenario
3. Reuse authentication state via `storageState`
4. Pin only external dependencies using `page.route()`

# Reference Documents

- `docs/testing/e2e-testing.md`
- `docs/web-frontend/twada-tdd.md`
