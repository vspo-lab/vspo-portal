# PR Guidelines

## Overview

Conventions for maintaining consistent Pull Request quality.
By including required information in the PR description, we improve review efficiency and clarify change intent.

## Required Items in PR Description

The PR Description must include the following 3 items:

### 1. Current State

Briefly describe the state before the change.

### 2. Problem

Describe the problem that would occur if this change is not made.
Clarify "why this change is necessary."

### 3. Implementation

Describe what was changed and how.
List technical changes as bullet points.

## One PR, One Concern

Include only one concern per PR.

```
# Good: one concern
- PR: "Add item creation API"
  - domain/item.ts, usecase/item.ts, repository/item.ts, http/item.ts

# Bad: mixing multiple concerns
- PR: "Add item creation API + refactoring + test fixes"
```

Mixing multiple changes causes the following problems:

- Review burden increases
- Root cause identification becomes difficult when bugs occur
- Revert becomes difficult

## Impact Scope

If the change affects other modules or features, document the impact scope.

## PR Template

Use the template defined in `.github/pull_request_template.md` (GitHub auto-applies it when creating a PR).

## Related Documents

- [Server Architecture](./server-architecture.md) - Overall architecture
- [Code Review Skill](../../.agent/skills/code-review/SKILL.md) - Execute with `/code-review`
