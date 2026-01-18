#!/bin/bash
set -euo pipefail

APP_LABEL="com.taskledger.localserver"
PLIST_PATH="${HOME}/Library/LaunchAgents/${APP_LABEL}.plist"

if [ -f "${PLIST_PATH}" ]; then
  launchctl unload "${PLIST_PATH}" >/dev/null 2>&1 || true
  rm -f "${PLIST_PATH}"
  echo "[TaskLedger] Auto-start removed."
else
  echo "[TaskLedger] Auto-start plist not found (nothing to remove)."
fi

