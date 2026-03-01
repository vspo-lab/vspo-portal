# force push を非保護ブランチで許可

## Context

現在 `.claude/hooks/validate-bash-command.sh` は `git push --force` を一律ブロックしている（L27-29）。
ユーザーの要望: `main`/`master`/`develop` 以外のブランチでは force push を許可する。

既存のガードレール:
- L22-24: `main`/`master` への push をブロック
- L31-36: `vk/*` ブランチ以外への push をブロック

→ force push のブロックを「保護ブランチ向けのみ」に緩和すれば安全。

## Plan

### `.claude/hooks/validate-bash-command.sh` (L27-29)

現在:
```bash
# Block force push.
if echo "$command" | grep -Eq 'git[[:space:]]+push[[:space:]]+--force'; then
  deny "Do not force push from Claude."
fi
```

変更後:
```bash
# Block force push to protected branches (main/master/develop).
if echo "$command" | grep -Eq 'git[[:space:]]+push[[:space:]]+--force' && \
   echo "$command" | grep -Eq '(main|master|develop)([[:space:];|&]|$)'; then
  deny "Do not force push to main/master/develop."
fi
```

これにより `git push --force origin vk/a08d-` は許可され、`git push --force origin main` はブロックされる。

## 検証

1. `echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin vk/test"}}' | bash .claude/hooks/validate-bash-command.sh` → 出力なし (許可)
2. `echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' | bash .claude/hooks/validate-bash-command.sh` → block (拒否)
3. `echo '{"tool_name":"Bash","tool_input":{"command":"git push --force origin develop"}}' | bash .claude/hooks/validate-bash-command.sh` → block (拒否)
