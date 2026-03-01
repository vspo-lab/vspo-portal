# Lint / Quality Check

## Overview

This document defines the minimum set of quality checks performed in the repository.
Run the same procedure before PRs for both code and documentation changes.

## Required Checks (Common to All Changes)

After making changes, always run the following command:

```bash
./scripts/post-edit-check.sh
```

`post-edit-check.sh` executes the following in order:

```bash
pnpm build
pnpm biome
pnpm textlint
pnpm knip
pnpm type-check
pnpm test
pnpm security-scan
```

## Additional Checks for Documentation Changes

When updating `docs/`, also verify the following:

1. Content follows the writing rules in [docs/design/writing.md](../design/writing.md)
2. Heading structure (`#` -> `##` -> `###`) is not broken
3. No terminology inconsistencies (use the same term for the same concept)
4. Reference links exist and relative paths are correct
5. `pnpm textlint` passes

See [docs/security/textlint.md](./textlint.md) for textlint operational guidelines and setup examples.

## Architecture Lint Rules (AI Review Targets)

The following rules cannot be fully detected by automated linting but are verified during code review.
The `/code-review` skill checks these rules.

| Rule | Target | Detection Method |
| --- | --- | --- |
| UseCase-to-UseCase calls prohibited | `usecase/` | AI review |
| Direct environment variable access in UseCase prohibited | `usecase/` | AI review + grep `process.env` |
| Direct message queue operations in UseCase prohibited | `usecase/` | AI review |
| JSDoc (preconditions/postconditions) required for Domain functions | `domain/` | AI review |
| Idempotency (`@idempotent`) documentation required for UseCase functions | `usecase/` | AI review |
| try-catch prohibited (Result type required) | All | AI review |
| Direct interface definitions prohibited (Zod Schema First) | All | AI review |

See the following for details:

- [Function Documentation Conventions](../backend/function-documentation.md)
