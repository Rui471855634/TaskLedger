#!/bin/bash
set -euo pipefail

# Run from repo/release zip root (two levels up from this file)
cd "$(cd "$(dirname "$0")/../.." && pwd)"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4173}"

ARCH="$(uname -m)"
BIN=""
if [ "$ARCH" = "arm64" ] && [ -x "./taskledger-server-darwin-arm64" ]; then
  BIN="./taskledger-server-darwin-arm64"
elif [ "$ARCH" = "x86_64" ] && [ -x "./taskledger-server-darwin-amd64" ]; then
  BIN="./taskledger-server-darwin-amd64"
fi

if [ -n "$BIN" ]; then
  echo "[TaskLedger] Starting native server at http://${HOST}:${PORT}"
  echo "[TaskLedger] Close this Terminal window to stop the server."
  echo
  "$BIN" -host "$HOST" -port "$PORT" -dir "dist"
  exit $?
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[TaskLedger] Node.js is not installed or not in PATH."
  echo "Install Node.js 16+ and try again, or use a release that includes a native macOS binary."
  exit 1
fi

echo "[TaskLedger] Starting server at http://${HOST}:${PORT}"
echo "[TaskLedger] Close this Terminal window to stop the server."
echo

export HOST PORT
node tools/serve-dist.mjs

