---
name: commit
description: Create a conventional commit. No Co-Authored-By trailer.
user_invocable: true
---

# Trigger

When the user asks to commit changes or invokes `/commit`.

# Rules

1. Stage only relevant files by explicit path (never `git add -A` or `git add .`)
2. Use conventional commit format: `<type>(<scope>): <description>`
3. **Do NOT include any Co-Authored-By trailer in the commit message**
4. Do NOT push unless explicitly asked
5. Run `./scripts/post-edit-check.sh` before committing if code edits were made

# Commit Message Format

```
<type>(<optional scope>): <short description>

<optional body>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

# Process

1. Run `git status` and `git diff --stat` to review changes
2. If no files are staged, stage the relevant files by explicit path
3. Draft a concise commit message summarizing the changes
4. Create the commit via `git commit -m "..."` using a HEREDOC — **no Co-Authored-By line**
5. Show the commit result with `git log --oneline -1`
