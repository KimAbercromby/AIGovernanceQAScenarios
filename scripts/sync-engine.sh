#!/bin/sh
# Copy the current triage engine into engine/ and record where it came from.
# Usage: sh scripts/sync-engine.sh [path to a local clone of AIGovernanceTriage-MultiBoard]
set -e
SRC="${1:-../AIGovernanceTriage-MultiBoard}"
cp "$SRC/src/triage-logic.js" engine/triage-logic.js
( cd "$SRC" && echo "Copied from KimAbercromby/AIGovernanceTriage-MultiBoard src/triage-logic.js at commit $(git rev-parse --short HEAD) ($(git log -1 --format=%cs))" ) > engine/SOURCE.txt
cat engine/SOURCE.txt
echo "Now run: npm test && npm run mutation"
