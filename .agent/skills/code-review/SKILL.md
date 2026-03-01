---
name: Code Review
description: PR/code review based on architecture rules. Detects violations of UseCase implementation rules, Result type, and JSDoc conventions.
user_invocable: true
---

# Trigger Conditions

- When the user requests a code review
- When reviewing PR diffs

# Review Checklist

## Architecture Violations

1. Is a UseCase calling another UseCase?
2. Is a UseCase directly accessing environment variables?
3. Is a UseCase directly operating PubSub/message queues?
4. Does the UseCase follow a "top-to-bottom sequential execution" pattern?
5. Are there multiple conditional branches inside loops?

## Code Conventions

6. Is try-catch being used? (Result type is required)
7. Are interfaces defined directly? (Zod Schema First is required)
8. Do public functions in Domain/UseCase have JSDoc (preconditions/postconditions)?
9. Is idempotency (`@idempotent`) documented on UseCase functions?

## Testing

10. Do Domain function additions/changes come with tests?

# Output Format

Output each finding in the following format:

- `Violation Location`: File path + line number
- `Violated Rule`: Corresponding document in docs/ + section name
- `Violation Details`: Specific description in one sentence
- `Fix Suggestion`: Minimal-change fix approach

If the rule source cannot be cited, separate it as an "improvement suggestion" and do not assert it as a violation.

# Reference Documents

- `docs/backend/function-documentation.md` - Function documentation conventions
- `docs/backend/server-architecture.md` - Overall architecture
- `docs/backend/pr-guidelines.md` - PR guidelines
- `docs/security/lint.md` - Lint / Quality Check
