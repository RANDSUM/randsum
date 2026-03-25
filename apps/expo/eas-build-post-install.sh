#!/bin/bash
set -euo pipefail

# Build workspace dependencies that the Expo app imports.
# EAS runs `bun install` but doesn't build workspace packages,
# so dist/ directories are missing when Metro tries to resolve them.
cd ../..
bun run --filter @randsum/roller build
bun run --filter @randsum/dice-ui build 2>/dev/null || true
