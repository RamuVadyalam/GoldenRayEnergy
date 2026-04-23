#!/usr/bin/env bash
# Start n8n on http://localhost:5678 with Pacific/Auckland timezone.
# First run installs n8n via npx (~500 MB, cached thereafter).
# Ctrl-C to stop.

set -e

export N8N_PORT=5678
export N8N_HOST=localhost
export GENERIC_TIMEZONE="Pacific/Auckland"
export TZ="Pacific/Auckland"
export N8N_DIAGNOSTICS_ENABLED=false
export N8N_VERSION_NOTIFICATIONS_ENABLED=false
export N8N_RUNNERS_ENABLED=true

echo "→ Starting n8n on http://localhost:5678"
echo "→ First run downloads n8n (~500 MB). Sit tight."
echo "→ Import workflows from n8n/workflows/ once the UI is up."
echo ""

npx n8n@latest start
