# vspo-portal (Next.js 15 + Cloudflare Workers)

## Guiding Principles

- Error handling: Use the `Result` type (`import { wrap, Ok, Err, AppError } from "@vspo-lab/error"`). No try-catch.
- Type definitions: Zod Schema First (`z.infer<typeof schema>`). No explicit `interface` declarations.
- Simplicity: Delete unused code, abstract only when duplicated 3+ times, no premature optimization.
- Function documentation: Annotate public functions with JSDoc describing preconditions, postconditions, and idempotency.
- After code changes, run `./scripts/post-edit-check.sh`.

## Copilot Review Output Rules

- Every issue must explicitly state "what rule is violated and where".
- Issues must always be formatted as follows:
  - `Violation location`: `path/to/file:line` (location in PR diff)
  - `Violated rule`: `Rule source file` + `heading/item name`
  - `Violation description`: One sentence describing what violates the rule
  - `Fix suggestion`: Minimal change fix approach
- `Violated rule` must cite only one of the following primary sources:
  - `.github/copilot-instructions.md`
  - `AGENTS.md`
  - Documents under `docs/`
- If a rule source cannot be cited, separate it as an "improvement suggestion" — do not assert it as a violation.

## Reference Documents

- `docs/domain/` - Domain specifications (overview, entities, use cases, glossary)
- `docs/web-frontend/` - Frontend (architecture, hooks, CSS, a11y, testing, error handling, TypeScript)
- `docs/backend/` - Backend (server architecture, API client, function documentation, PR guidelines, datetime handling)
- `docs/design/` - Design system (tokens, colors, typography, UI patterns)
- `docs/infra/` - Infrastructure (Terraform, CI/CD)
- `docs/security/` - Security
- `.agent/skills/` - AI agent skill definitions
