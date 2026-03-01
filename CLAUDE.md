# vspo-portal (Next.js 15 + Cloudflare Workers)

## Guiding Principles

- Error handling: Use the `Result` type (`import { wrap, Ok, Err, AppError } from "@vspo-lab/error"`). No try-catch.
- Type definitions: Zod Schema First (`z.infer<typeof schema>`). No explicit `interface` declarations.
- Simplicity: Delete unused code, abstract only when duplicated 3+ times, no premature optimization.
- Function documentation: Annotate public functions with JSDoc describing preconditions, postconditions, and idempotency.
- After code changes, run `./scripts/post-edit-check.sh`.

## References

- Detailed technical documentation: `docs/`
- AI agent skills: `.agent/skills/`

## Spec-Driven Development

- Feature development follows: Spec definition -> Checklist generation -> Phased implementation.
- Specification documents are placed in `docs/plan/<feature>/`.
- **Spec update -> Implementation**: When specs change, update `docs/plan/` first, then modify code. Verbal agreements are not specs.
- Skills: `/plan-feature` (spec definition), `/init-impl` (checklist generation).

## Claude Code Operations

- Permission policies and hooks are managed in `.claude/settings.json`.
- Custom `/` commands are placed as skills in `.claude/skills/` (symlinked to `.agent/skills/`).
- `PreToolUse` hook blocks dangerous Bash operations (`git push`, `git add -A`, `git reset --hard`).
- On code edits, a hook sets `.claude/.post_edit_check_pending`, and `./scripts/post-edit-check.sh` runs at response end.
