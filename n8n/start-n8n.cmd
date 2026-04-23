@echo off
REM Start n8n on http://localhost:5678 with Pacific/Auckland timezone.
REM First run installs n8n via npx (~500 MB, cached thereafter).
REM Ctrl-C to stop.

set N8N_PORT=5678
set N8N_HOST=localhost
set GENERIC_TIMEZONE=Pacific/Auckland
set TZ=Pacific/Auckland
set N8N_DIAGNOSTICS_ENABLED=false
set N8N_VERSION_NOTIFICATIONS_ENABLED=false
set N8N_RUNNERS_ENABLED=true

echo Starting n8n on http://localhost:5678
echo First run downloads n8n (~500 MB). Sit tight.
echo Import workflows from n8n\workflows\ once the UI is up.
echo.

npx n8n@latest start
