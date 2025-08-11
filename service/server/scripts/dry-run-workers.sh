#!/bin/bash

echo '🚀 Starting dry run for all workers...'
echo ''

FAILED_WORKERS=''
TOTAL_WORKERS=0
PASSED_WORKERS=0

echo '=== Main Workers Dry Run ==='

# Main Workers
workers=(
  "vspo-portal-gateway:config/wrangler/dev/vspo-portal-gateway/wrangler.jsonc"
  "vspo-portal-cron:config/wrangler/dev/vspo-portal-cron/wrangler.jsonc"
  "vspo-portal-app:config/wrangler/dev/vspo-portal-app/wrangler.jsonc"
)

for worker in "${workers[@]}"; do
  IFS=':' read -r name config <<< "$worker"
  echo -n "  $name: "
  ((TOTAL_WORKERS++))
  if pnpm exec wrangler deploy --config "$config" --dry-run --outdir dist 2>&1 | tee /tmp/wrangler-output.log | grep -q "Total Upload:"; then
    echo '✅ PASS'
    ((PASSED_WORKERS++))
  else
    echo '❌ FAIL'
    FAILED_WORKERS="$FAILED_WORKERS $name"
  fi
done

echo ''
echo '=== App Workers Dry Run ==='

# App Workers
app_workers=(
  "access-vspo-schedule-site"
  "analyze-clips"
  "delete-streams"
  "discord-delete-all"
  "discord-send-message-all-channel"
  "discord-send-message-channels"
  "discord-send-messages"
  "exist-clips"
  "fetch-clips-by-creator"
  "search-channels"
  "search-clips-by-vspo-member-name"
  "search-clips"
  "search-member-streams-by-channel"
  "search-streams"
  "translate-creators"
  "translate-streams"
)

for worker in "${app_workers[@]}"; do
  echo -n "  $worker: "
  ((TOTAL_WORKERS++))
  config="config/wrangler/dev/vspo-portal-app/dev-${worker}.wrangler.jsonc"
  if pnpm exec wrangler deploy --config "$config" --dry-run --outdir dist 2>&1 | tee /tmp/wrangler-output.log | grep -q "Total Upload:"; then
    echo '✅ PASS'
    ((PASSED_WORKERS++))
  else
    echo '❌ FAIL'
    FAILED_WORKERS="$FAILED_WORKERS $worker"
  fi
done

echo ''
echo '==================================='
echo "✅ Passed: $PASSED_WORKERS/$TOTAL_WORKERS"

if [ -n "$FAILED_WORKERS" ]; then
  echo "❌ Failed workers:$FAILED_WORKERS"
  exit 1
else
  echo '🎉 All workers passed dry run!'
fi