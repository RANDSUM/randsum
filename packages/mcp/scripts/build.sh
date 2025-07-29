#!/bin/bash
set -e

# Build the TypeScript project
npx tsc

# Make the output executable
chmod 755 dist/index.js

echo "Build completed successfully"
