---
name: Project Initialization
description: "Initialize a new project from the template. Define domain specifications through a structured interview and write them to docs/domain/."
user_invocable: true
---

# Overview

Skill to initialize the template repository as a new project.
If `/domain-spec-kickoff` is available, prefer that. Otherwise, use this skill for equivalent initialization.

# Steps

## Step 1: Interview

Confirm all of the following in a single round:

1. Project name (display name / identifier)
2. Project overview (what are we building?)
3. Target users
4. Key entities (3-5)
5. MVP use cases (3-5)
6. Glossary (ubiquitous language)
7. In Scope / Out of Scope
8. Open questions and decision deadlines

## Step 2: Generate Domain Documents

Based on the answers, update the following:

- `docs/domain/overview.md`
- `docs/domain/entities.md`
- `docs/domain/usecases.md`
- `docs/domain/glossary.md`
- `docs/domain/decisions.md`

## Step 3: Output Replacement Guide

Guide the user to replace `@vspo-lab` with the new project identifier in:

- `package.json` (root + packages/* + service/*)
- `infrastructure/terraform/`
- `renovate.json` / `renovate/default.json`
- `.github/workflows/`

# Reference Documents

- `docs/domain/README.md`
- `docs/web-frontend/typescript.md`
