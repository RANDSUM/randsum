#!/bin/bash
set -euo pipefail

echo "[eas-build-post-install] Building workspace dependencies..."

# Navigate to monorepo root (EAS sets working dir to the project dir)
MONOREPO_ROOT="$(cd ../.. && pwd)"
echo "[eas-build-post-install] Monorepo root: $MONOREPO_ROOT"

# Build roller (required — expo imports from dist/)
cd "$MONOREPO_ROOT/packages/roller"
echo "[eas-build-post-install] Building @randsum/roller..."
npx bunup src/index.ts --dts 2>/dev/null || npm run build || echo "WARN: roller build failed, falling back to source"

echo "[eas-build-post-install] Done."
