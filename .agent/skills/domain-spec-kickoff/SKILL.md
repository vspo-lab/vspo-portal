---
name: Domain Spec Kickoff
description: Initialize docs/domain with a single interview session, organizing the MVP and open items.
user_invocable: true
---

# Overview

A skill used when starting a template repository as a new project.
Initializes `docs/domain/` to be project-specific through a single interview session.

# Execution Steps

## Step 1: Consolidated Interview

Confirm the following in a single set of questions:

1. Project name (display name / identifier)
2. Problem to solve and value proposition
3. Target users
4. In Scope / Out of Scope
5. Key entities (3-5)
6. MVP use cases (3-5)
7. Glossary (ubiquitous language)
8. Open items and decision deadlines

## Step 2: Initialize docs/domain

Based on the answers, update the following:

- `docs/domain/overview.md`
- `docs/domain/entities.md`
- `docs/domain/usecases.md`
- `docs/domain/glossary.md`
- `docs/domain/decisions.md`

Do not leave open items as `TBD`; instead, record them as discussion points in `usecases.md` or `decisions.md`.

## Step 3: Pre-Implementation Check

After updating, clarify and present the following:

1. Scope to implement for MVP
2. Scope to defer
3. Next discussion points to resolve (with deadlines)

# Reference Documents

- `docs/domain/README.md`
- `docs/web-frontend/typescript.md`
