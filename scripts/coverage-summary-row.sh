#!/usr/bin/env bash
# Prints one PR-summary table row: "<tests> | <statements> | <branches> | <functions> | <lines>".
# Usage: coverage-summary-row.sh <vitest-output.txt> <coverage-summary.json>
set -euo pipefail

output_file="$1"
summary_json="$2"

tests=$(grep -E '^\s*Tests\s' "$output_file" | tail -1 | sed -E 's/^\s*Tests\s+//; s/\s+\([^)]*\)$//' | xargs)
if [ ! -f "$summary_json" ]; then
  echo "${tests:-n/a} | n/a | n/a | n/a | n/a"
  exit 0
fi

pct() {
  jq -r --arg key "$1" '.total[$key].pct | if . == null then "n/a" else (tostring + "%") end' "$summary_json"
}

echo "${tests:-n/a} | $(pct statements) | $(pct branches) | $(pct functions) | $(pct lines)"
