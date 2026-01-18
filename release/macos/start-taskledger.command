#!/bin/bash
set -euo pipefail

# Run from repo/release zip root (two levels up from this file)
cd "$(cd "$(dirname "$0")/../.." && pwd)"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4173}"

if ! command -v node >/dev/null 2>&1; then
  echo "[TaskLedger] Node.js is not installed or not in PATH."
  echo "Install Node.js 16+ and try again."
  exit 1
fi

echo "[TaskLedger] Starting server at http://${HOST}:${PORT}"
echo "[TaskLedger] Close this Terminal window to stop the server."
echo

export HOST PORT
node tools/serve-dist.mjs

