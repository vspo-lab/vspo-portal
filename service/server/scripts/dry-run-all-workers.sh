#!/bin/bash

echo '🚀 Starting dry run for all workers...'
echo ''

FAILED_WORKERS=''
TOTAL_WORKERS=0
PASSED_WORKERS=0
VERBOSE=${VERBOSE:-false}

# Arrays to store results
declare -a WORKER_NAMES
declare -a WORKER_STATUSES
declare -a WORKER_SIZES
declare -a WORKER_GZIPS

# Function to run dry-run for a single worker
run_dry_run() {
  local worker_name=$1
  local config_path=$2
  local entry_point=$3
  
  ((TOTAL_WORKERS++))
  
  # Run wrangler and capture output
  echo -n "  Checking $worker_name..."
  pnpm wrangler deploy --config "$config_path" --dry-run --script "$entry_point" > /tmp/wrangler-$worker_name.log 2>&1
  local exit_code=$?
  
  # Store worker name
  WORKER_NAMES+=("$worker_name")
  
  # Extract upload size info
  local total_size=""
  local gzip_size=""
  
  # Look for various size patterns in wrangler output
  if grep -q "Total Upload:" /tmp/wrangler-$worker_name.log; then
    local size_line=$(grep "Total Upload:" /tmp/wrangler-$worker_name.log | tail -1)
    # Extract sizes from format: "Total Upload: 1019.58 KiB / gzip: 193.32 KiB"
    total_size=$(echo "$size_line" | awk -F'[:/]' '{print $2}' | xargs)
    gzip_size=$(echo "$size_line" | awk -F'gzip: ' '{print $2}')
  fi
  
  # If still not found, try another pattern
  if [ -z "$total_size" ]; then
    # Look for pattern like "Uploaded ... (... gzipped)"
    if grep -q "Uploaded.*gzipped" /tmp/wrangler-$worker_name.log; then
      local size_line=$(grep "Uploaded.*gzipped" /tmp/wrangler-$worker_name.log | tail -1)
      total_size=$(echo "$size_line" | sed -n 's/.*Uploaded \([^(]*\).*/\1/p' | xargs)
      gzip_size=$(echo "$size_line" | sed -n 's/.*(\([^)]*\) gzipped).*/\1/p' | xargs)
    fi
  fi
  
  WORKER_SIZES+=("$total_size")
  WORKER_GZIPS+=("$gzip_size")
  
  if [ $exit_code -eq 0 ]; then
    echo " ✅"
    WORKER_STATUSES+=("✅")
    ((PASSED_WORKERS++))
  else
    echo " ❌"
    WORKER_STATUSES+=("❌")
    FAILED_WORKERS="$FAILED_WORKERS $worker_name"
  fi
}

# Function to display results in table format
display_table() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  printf "%-45s %-10s %-20s %-20s\n" "Worker Name" "Status" "Total Upload" "Gzip Size"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for i in "${!WORKER_NAMES[@]}"; do
    printf "%-45s %-10s %-20s %-20s\n" "${WORKER_NAMES[$i]}" "${WORKER_STATUSES[$i]}" "${WORKER_SIZES[$i]:-N/A}" "${WORKER_GZIPS[$i]:-N/A}"
  done
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

echo '📋 Checking workers...'
echo ''

# Gateway
run_dry_run "vspo-portal-gateway" \
  "config/wrangler/dev/vspo-portal-gateway/wrangler.jsonc" \
  "cmd/server/gateway.ts"

# Cron
run_dry_run "vspo-portal-cron" \
  "config/wrangler/dev/vspo-portal-cron/wrangler.jsonc" \
  "cmd/cron/index.ts"

# Service workers (CQRS pattern) - dynamically discover from directory
SERVICE_WORKERS_DIR="config/wrangler/dev/vspo-portal-service"
if [ -d "$SERVICE_WORKERS_DIR" ]; then
  for worker_dir in "$SERVICE_WORKERS_DIR"/*; do
    if [ -d "$worker_dir" ] && [ -f "$worker_dir/wrangler.jsonc" ]; then
      worker_name=$(basename "$worker_dir")
      run_dry_run "$worker_name" \
        "$worker_dir/wrangler.jsonc" \
        "cmd/server/internal/application/index.ts"
    fi
  done
else
  echo "⚠️  Service workers directory not found: $SERVICE_WORKERS_DIR"
fi

# Display results in table format
display_table

echo ''
echo "📊 Summary: $PASSED_WORKERS/$TOTAL_WORKERS passed"

if [ -n "$FAILED_WORKERS" ]; then
  echo "❌ Failed workers:$FAILED_WORKERS"
  echo ''
  
  if [ "$VERBOSE" = "true" ]; then
    echo 'Failed worker details:'
    for worker in $FAILED_WORKERS; do
      echo ""
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  Worker: $worker"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      if [ -f "/tmp/wrangler-$worker.log" ]; then
        grep -E "(ERROR|error|Error)" "/tmp/wrangler-$worker.log" | head -20
      fi
    done
  else
    echo 'Run with VERBOSE=true to see detailed error messages'
  fi
  
  # Clean up temp files
  rm -f /tmp/wrangler-*.log
  exit 1
else
  echo '🎉 All workers passed dry run!'
  # Clean up temp files
  rm -f /tmp/wrangler-*.log
fi