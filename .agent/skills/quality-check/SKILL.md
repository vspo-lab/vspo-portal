---
name: Quality Check
description: Run the project's quality checks and report only failures that need attention. Used when the user requests a check run, code change verification, or identifying the first failing gate.
---

# Trigger Conditions

- When the user requests a check run or code verification
- When checking the status of quality gates after code changes
- When quickly identifying the first failing check

# Execution Checklist

1. Run `./scripts/post-edit-check.sh`
2. If it fails, identify the first failed command and root cause
3. Propose a minimal, safe fix
4. Do not auto-commit
