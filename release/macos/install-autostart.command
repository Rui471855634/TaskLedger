#!/bin/bash
set -euo pipefail

APP_LABEL="com.taskledger.localserver"

# Resolve repo/release zip root
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
START_SCRIPT="${ROOT_DIR}/release/macos/start-taskledger.command"
PLIST_DIR="${HOME}/Library/LaunchAgents"
PLIST_PATH="${PLIST_DIR}/${APP_LABEL}.plist"

mkdir -p "${PLIST_DIR}"

cat > "${PLIST_PATH}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>${APP_LABEL}</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>${START_SCRIPT}</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <false/>

    <key>WorkingDirectory</key>
    <string>${ROOT_DIR}</string>

    <key>StandardOutPath</key>
    <string>${HOME}/Library/Logs/TaskLedger.out.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/Library/Logs/TaskLedger.err.log</string>
  </dict>
</plist>
EOF

# Unload if exists, then load
launchctl unload "${PLIST_PATH}" >/dev/null 2>&1 || true
launchctl load "${PLIST_PATH}"

echo "[TaskLedger] Auto-start enabled (current user)."
echo "[TaskLedger] Logs:"
echo "  ${HOME}/Library/Logs/TaskLedger.out.log"
echo "  ${HOME}/Library/Logs/TaskLedger.err.log"

