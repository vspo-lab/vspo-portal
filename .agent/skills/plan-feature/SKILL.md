---
name: Feature Spec Definition
description: Generate structured specification documents in docs/plan/<feature>/ from ambiguous requirements.
user_invocable: true
---

# Overview

A skill for defining feature development specifications.
Interviews ambiguous requirements and generates specification documents in `docs/plan/<feature>/` aligned with Clean Architecture layers.

# Execution Steps

## Step 1: Requirements Interview

Confirm the following in a single set of questions:

1. Feature name (English kebab-case, e.g., `user-profile`)
2. Purpose and background of the feature (why build it)
3. Target users and usage scenarios
4. In Scope / Out of Scope
5. Affected entities (new or existing changes)
6. Key use cases (1-5)
7. API endpoints (expected)
8. Frontend screen layout (expected)
9. Open items

## Step 2: Specification Document Generation

Based on the answers, create the following files in `docs/plan/<feature>/`.
Refer to the specification file overview in `docs/plan/README.md` for the items to include in each file.

- `00_OVERVIEW.md` - Feature overview, purpose, scope
- `01_DOMAIN_MODEL.md` - Entity changes, business rules
- `02_DATA_ACCESS.md` - Repository and DB changes
- `03_USECASE.md` - UseCase layer changes
- `04_API_INTERFACE.md` - API endpoint specifications
- `05_FRONTEND.md` - Frontend UI specifications

For backend-only or frontend-only features, omit unnecessary files.
Mark undecided parts as `TBD`.

## Step 3: Spec Review Summary

After generation, present the following:

1. List of generated files
2. Summary of confirmed items
3. Open items and next discussion points to resolve
4. Guidance on reflecting changes to `docs/domain/` if needed

# Rules

- Specifications are consolidated in `docs/plan/<feature>/` (do not scatter them elsewhere)
- Entity definitions follow Zod Schema First (per `docs/web-frontend/typescript.md`)
- Guide important decisions to also be recorded in `docs/domain/decisions.md`

# Reference Documents

- `docs/plan/README.md`
- `docs/domain/README.md`
- `docs/backend/server-architecture.md`
- `docs/web-frontend/architecture.md`
