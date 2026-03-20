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
pnpm biome:check   # Biome linter + formatter
pnpm knip           # Unused code detection
pnpm tsc            # TypeScript type checking
```

## Security Scanning

Run the full security scan locally:

```bash
./scripts/security-scan.sh           # Without Docker image scan
./scripts/security-scan.sh --docker  # Include Docker image scan
```

The script runs four scans:

| Scan | Tool | What it detects |
|------|------|-----------------|
| Filesystem vulnerabilities | Trivy | CRITICAL/HIGH severity CVEs in dependencies |
| Container vulnerabilities | Trivy (with `--docker`) | Image-level CVEs |
| Secret detection | gitleaks | Hardcoded secrets and credentials |
| Static analysis | Semgrep | Code-level security issues (auto config) |

Each tool runs via local installation (aqua) if available, falling back to Docker containers. Exit code is 1 if any scan fails.

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
