#!/bin/bash
# Generate the body of the develop -> main release PR.
#
# Preconditions:
#   - Run from the repository root, in a checkout with full history
#     (actions/checkout with fetch-depth: 0) and both refs present.
# Postconditions:
#   - Writes the PR body to stdout. Never mutates the working tree or any ref.
# Idempotency:
#   - Pure function of the commit range: the same range always yields the same
#     output, so re-running it to refresh an existing PR body is safe.

set -euo pipefail

BASE="${1:-origin/main}"
HEAD="${2:-origin/develop}"
RANGE="${BASE}..${HEAD}"

# grep exits 1 when nothing matches, which is not an error here.
subjects_matching() {
  git log --no-merges --pretty=format:'%s' "$RANGE" | grep -E "$1" || true
}

subjects_not_matching() {
  git log --no-merges --pretty=format:'%s' "$RANGE" | grep -vE "$1" || true
}

as_list() {
  if [ -z "$1" ]; then
    echo "- (none)"
  else
    printf '%s\n' "$1" | sed 's/^/- /'
  fi
}

count_of() {
  if [ -z "$1" ]; then echo 0; else printf '%s\n' "$1" | wc -l | tr -d ' '; fi
}

DEPS_PATTERN='^(chore|fix|build)\(deps[^)]*\)'
SECURITY_PATTERN='\[security\]|CVE-|GHSA-'

TOTAL=$(git rev-list --count "$RANGE")
DEPS=$(subjects_matching "$DEPS_PATTERN")
APP=$(subjects_not_matching "$DEPS_PATTERN")
SECURITY=$(subjects_matching "$SECURITY_PATTERN")

DEPS_COUNT=$(count_of "$DEPS")
APP_COUNT=$(count_of "$APP")
SECURITY_COUNT=$(count_of "$SECURITY")

cat <<EOF
## Current State

\`main\` is behind \`develop\` by ${TOTAL} commit(s): ${DEPS_COUNT} dependency update(s) and ${APP_COUNT} application change(s).

This PR is generated and refreshed automatically by \`.github/workflows/release-pr.yaml\` on every push to \`develop\`.

## Problem

Without this PR, changes already verified on \`develop\` never reach production, and the two branches drift apart.

## Changes

### Dependency updates (${DEPS_COUNT})

$(as_list "$DEPS")

### Application changes (${APP_COUNT})

$(as_list "$APP")

## Impact

- Merging deploys to production: the web and bot-dashboard Workers are deployed on push to \`main\`.
- Security-related updates in this range: ${SECURITY_COUNT}
- Every commit here has already passed the full check suite on its own PR before reaching \`develop\`.

<!-- generated-by: scripts/release-pr-body.sh -->
EOF
