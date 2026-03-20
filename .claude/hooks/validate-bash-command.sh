#!/bin/bash
set -euo pipefail

input="$(cat)"
tool_name="$(echo "$input" | jq -r '.tool_name // ""')"
command="$(echo "$input" | jq -r '.tool_input.command // ""')"

if [ "$tool_name" != "Bash" ]; then
  exit 0
fi

deny() {
  local reason="$1"
  jq -n --arg reason "$reason" '{
    decision: "block",
    reason: $reason
  }'
  exit 0
}

# Block push to main/master.
if echo "$command" | grep -Eq 'git[[:space:]]+push[[:space:]]+.*(main|master)([[:space:];|&]|$)'; then
  deny "Do not push to main/master. Create a PR instead."
fi

# Block force push to protected branches (main/master/develop).
if echo "$command" | grep -Eq 'git[[:space:]]+push[[:space:]]+--force' && \
   echo "$command" | grep -Eq '(main|master|develop)([[:space:];|&]|$)'; then
  deny "Do not force push to main/master/develop."
fi

# Block broad staging patterns that are easy to misuse.
if echo "$command" | grep -Eq '(^|[[:space:];|&])git[[:space:]]+add[[:space:]]+(-A|--all|\.)([[:space:];|&]|$)'; then
  deny "Avoid broad git add. Stage explicit paths only."
fi

# Block destructive history rewrite by default.
if echo "$command" | grep -Eq '(^|[[:space:];|&])git[[:space:]]+reset[[:space:]]+--hard([[:space:];|&]|$)'; then
  deny "Do not run git reset --hard from Claude."
fi

exit 0
