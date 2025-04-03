#!/bin/bash

# Script to update all packages in the RANDSUM monorepo to use standardized configuration
# Usage: ./scripts/update-packages.sh

# Copy .prettierignore to all packages
for dir in packages/*/; do
  cp .moon/templates/prettierignore-template "$dir.prettierignore"
  echo "Updated .prettierignore in $dir"
done

# Copy bunfig.toml to all packages
for dir in packages/*/; do
  cp .moon/templates/bunfig-template.toml "$dir/bunfig.toml"
  echo "Updated bunfig.toml in $dir"
done

# Copy .npmignore to all packages
for dir in packages/*/; do
  cp .moon/templates/npmignore-template "$dir/.npmignore"
  echo "Updated .npmignore in $dir"
done

echo "All packages updated successfully!"
