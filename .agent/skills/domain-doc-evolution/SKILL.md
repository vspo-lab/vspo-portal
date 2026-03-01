---
name: Domain Spec Evolution
description: Update docs/domain alongside feature additions and spec changes, maintaining a history of specification decisions.
user_invocable: true
---

# Overview

A skill for continuously evolving domain specifications during implementation.
Maintains consistency of `docs/domain` in sync with code changes.

# Execution Steps

## Step 1: Identify Changes

- Identify the target feature and impact scope (entities / use cases / terminology)
- Check for contradictions with existing `docs/domain/*.md`

## Step 2: Update docs/domain

Update only the necessary files with minimal diffs.

- `overview.md`: Update only if the purpose or scope changes
- `entities.md`: Reflect changes to attributes, rules, and relationships
- `usecases.md`: Add/modify use cases, update priorities
- `glossary.md`: Add new terms, organize synonyms
- `decisions.md`: Append specification decisions

## Step 3: Record Decision Rationale

When a specification decision is made, always record the following in `decisions.md`:

1. Decision
2. Reason
3. Alternatives
4. Impact scope

# Reference Documents

- `docs/domain/README.md`
- `docs/web-frontend/typescript.md`
