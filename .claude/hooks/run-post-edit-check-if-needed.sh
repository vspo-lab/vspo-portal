#!/bin/bash
set -euo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
marker_file="$project_dir/.claude/.post_edit_check_pending"

if [ ! -f "$marker_file" ]; then
  exit 0
fi

echo "[claude-hooks] running ./scripts/post-edit-check.sh"
if (
  cd "$project_dir"
  ./scripts/post-edit-check.sh
); then
  echo "[claude-hooks] post-edit-check passed"
else
  echo "[claude-hooks] post-edit-check failed. Please inspect and rerun manually."
fi
rm -f "$marker_file"
