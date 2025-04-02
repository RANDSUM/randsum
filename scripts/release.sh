#!/bin/bash

# Script to release new versions of packages in the RANDSUM monorepo
# Usage: ./scripts/release.sh [major|minor|patch]

if [ $# -lt 1 ]; then
  echo "Usage: ./scripts/release.sh [major|minor|patch]"
  exit 1
fi

VERSION_TYPE=$1

# Validate version type
if [[ "$VERSION_TYPE" != "major" && "$VERSION_TYPE" != "minor" && "$VERSION_TYPE" != "patch" ]]; then
  echo "Invalid version type. Use 'major', 'minor', or 'patch'."
  exit 1
fi

# Clean and build
echo "Cleaning and building packages..."
bun run clean
bun run build

# Run tests
echo "Running tests..."
bun run test

# Run linting and type checking
echo "Running linting and type checking..."
bun run lint
bun run ts:check

# Bump versions
echo "Bumping $VERSION_TYPE version in all packages..."
for dir in packages/*/; do
  cd "$dir"
  bun bump $VERSION_TYPE
  cd ../../
done

# Publish
echo "Publishing packages..."
bun moon :publish

echo "Release complete!"
