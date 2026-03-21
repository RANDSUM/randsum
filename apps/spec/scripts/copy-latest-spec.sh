#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$APP_DIR/../.." && pwd)"

SOURCE="$REPO_ROOT/RANDSUM_DICE_NOTATION_SPEC.md"
DEST_DIR="$APP_DIR/src/content/specs"
DEST="$DEST_DIR/v1.0.md"
LLM_FULL="$APP_DIR/public/llms-full.txt"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: Source spec not found at $SOURCE" >&2
  echo "Make sure RANDSUM_DICE_NOTATION_SPEC.md exists at the repository root." >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
mkdir -p "$APP_DIR/public"

cp "$SOURCE" "$DEST"
echo "Copied spec to $DEST"

cp "$SOURCE" "$LLM_FULL"
echo "Copied spec to $LLM_FULL"
