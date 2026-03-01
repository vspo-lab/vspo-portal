---
name: integration-testing
description: Build integration tests with a real DB and real app wiring, verifying without internal mocks and using minimal mocks only at external boundaries.
---

# Trigger Conditions

- When verifying the integration between UseCase and Repository
- When adding or updating integration tests that include the DB

# Execution Checklist

1. Review `docs/testing/integration-testing.md`
2. Create table-driven scenarios assuming a real DB
3. Replace only external dependencies at boundaries
4. Verify reproducibility with `test:integration`

# Reference Documents

- `docs/testing/integration-testing.md`
- `docs/web-frontend/twada-tdd.md`
