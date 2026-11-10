#!/usr/bin/env bash
# Local, no-GitHub-minutes regression check for Tales of Myrren.
# Run from any directory: bash scripts/test-boss-offline.sh
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ is required." >&2
  exit 127
fi
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 22 )); then
  echo "Node.js 22+ required, found $(node --version)." >&2
  exit 1
fi

echo "[Myrren] Syntax checks"
for path in \
  public/myrren-game.js \
  src/boss-encounter.mjs \
  src/boss-room-coordinator.mjs \
  src/boss-account-ledger.mjs \
  src/boss-reward-delivery.mjs \
  src/server-player-positions.mjs \
  src/server-boss-behavior.mjs \
  tests/server-boss-encounter.test.cjs \
  tests/boss-room-coordinator.test.cjs \
  tests/boss-account-ledger.test.cjs \
  tests/server-player-positions.test.cjs \
  tests/server-boss-behavior.test.cjs
do
  node --check "$path"
done

echo "[Myrren] Boss / account / movement regression tests"
for path in \
  tests/boss-contribution-loot.test.cjs \
  tests/server-boss-encounter.test.cjs \
  tests/boss-room-coordinator.test.cjs \
  tests/boss-account-ledger.test.cjs \
  tests/server-player-positions.test.cjs \
  tests/server-boss-behavior.test.cjs
do
  echo "[Myrren] Running $path"
  node "$path"
done

echo "[Myrren] PASS: offline multiplayer foundation tests"
