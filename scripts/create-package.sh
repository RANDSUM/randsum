#!/bin/bash

# Script to create a new package in the RANDSUM monorepo
# Usage: ./scripts/create-package.sh package-name "Package Description"

if [ $# -lt 2 ]; then
  echo "Usage: ./scripts/create-package.sh package-name \"Package Description\""
  exit 1
fi

PACKAGE_NAME=$1
PACKAGE_DESC=$2
PACKAGE_DIR="packages/$PACKAGE_NAME"

# Create package directory
mkdir -p "$PACKAGE_DIR/src"
mkdir -p "$PACKAGE_DIR/__tests__"

# Copy templates
cp .moon/templates/package-template.json "$PACKAGE_DIR/package.json"
cp .moon/templates/bunfig-template.toml "$PACKAGE_DIR/bunfig.toml"
cp .moon/templates/npmignore-template "$PACKAGE_DIR/.npmignore"
cp .moon/templates/prettierignore-template "$PACKAGE_DIR/.prettierignore"

# Create moon.yml
cat > "$PACKAGE_DIR/moon.yml" << EOL
\$schema: 'https://moonrepo.dev/schemas/project.json'

id: $PACKAGE_NAME
language: 'typescript'
dependsOn:
  - 'dice'
tags:
  - 'game'

tasks:
  tsCheck:
    deps:
      - 'dice:build'
  build:
    deps:
      - 'dice:build'
EOL

# Create tsconfig.json
cat > "$PACKAGE_DIR/tsconfig.json" << EOL
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "composite": true,
    "tsBuildInfoFile": "dist/.tsbuildinfo"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "references": [{ "path": "../dice" }]
}
EOL

# Create bunup.config.ts
cat > "$PACKAGE_DIR/bunup.config.ts" << EOL
import { defineConfig, DefineConfigEntry } from 'bunup'
import baseConfig from '../../bunup.config.base'

export default defineConfig({
  ...baseConfig,
  external: ['@randsum/dice']
} as DefineConfigEntry)
EOL

# Create index.ts
cat > "$PACKAGE_DIR/src/index.ts" << EOL
/**
 * @randsum/$PACKAGE_NAME
 * $PACKAGE_DESC
 */

import { D6 } from '@randsum/dice'

export const roll = () => {
  return D6.roll()
}
EOL

# Create README.md
cat > "$PACKAGE_DIR/README.md" << EOL
# @randsum/$PACKAGE_NAME

$PACKAGE_DESC

## Installation

\`\`\`bash
npm install @randsum/$PACKAGE_NAME
# or
yarn add @randsum/$PACKAGE_NAME
# or
bun add @randsum/$PACKAGE_NAME
\`\`\`

## Usage

\`\`\`typescript
import { roll } from '@randsum/$PACKAGE_NAME'

// Basic usage
roll()
\`\`\`

## License

MIT
EOL

# Update package.json with correct values
sed -i '' "s/PACKAGE_NAME/$PACKAGE_NAME/g" "$PACKAGE_DIR/package.json"
sed -i '' "s/PACKAGE_DESCRIPTION/$PACKAGE_DESC/g" "$PACKAGE_DIR/package.json"

echo "Package @randsum/$PACKAGE_NAME created successfully!"
echo "Don't forget to run 'bun install' to update dependencies."
