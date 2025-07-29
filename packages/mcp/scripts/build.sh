#!/bin/bash
set -e

# Build the TypeScript project
npx tsc

# Make the output executable
if [ -f dist/index.js ]; then
    chmod 755 dist/index.js
else
    echo "Error: dist/index.js does not exist. TypeScript compilation may have failed."
    exit 1
fi
echo "Build completed successfully"
