#!/bin/bash
set -euo pipefail

project_dir="${CLAUDE_PROJECT_DIR:-$(pwd)}"
marker_file="$project_dir/.claude/.post_edit_check_pending"

touch "$marker_file"
echo "[claude-hooks] queued post-edit-check"
