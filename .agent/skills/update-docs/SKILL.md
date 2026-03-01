---
name: Documentation Update
description: Update docs/ in response to code changes. Keep docs/ always up to date.
---

# Trigger Conditions

- After implementing a new feature or making an architecture change
- After changing an existing specification or convention
- When the user requests a docs update

# Rules

- `docs/` is the Single Source of Truth for all technical documentation
- When code changes, always update the related docs/ files
- When introducing a new concept or pattern, create a corresponding docs/ file
- SKILL.md in skills should only be pointers to docs/. Do not write details in skills

# docs Structure

- `docs/domain/` - Domain specifications (overview, entities, use cases, glossary)
- `docs/plan/` - Feature specifications (Spec-Driven Development, per-feature specs & checklists)
- `docs/testing/` - Testing implementation guidelines (Unit/Integration/API/UI/VRT/E2E)
- `docs/web-frontend/` - Frontend (architecture, hooks, CSS, a11y, testing, error handling, TypeScript)
- `docs/backend/` - Backend (server architecture, domain modeling, API design, UseCase implementation rules, function documentation conventions, PR guidelines, datetime handling)
- `docs/design/` - Design system (tokens, colors, typography, UI patterns, principles, a11y)
- `docs/infra/` - Infrastructure (Terraform, tfaction, CI/CD)
- `docs/security/` - Security (lint, scanning)
