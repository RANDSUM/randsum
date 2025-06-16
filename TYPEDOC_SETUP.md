# TypeDoc Configuration for RANDSUM Monorepo

## Problem Solved

This configuration resolves the recursive directory creation issue that was causing ENAMETOOLONG errors when generating TypeDoc documentation. The issue occurred because TypeDoc was trying to copy assets and encountered the output directory within the source tree, creating infinite nested paths.

## Solution Overview

1. **Upgraded TypeDoc** from 0.26.11 to 0.27.x for TypeScript 5.8.3 compatibility
2. **Fixed recursive directory issue** by using a temporary output directory outside the source tree
3. **Configured comprehensive monorepo support** for all 8 packages
4. **Added proper exclusion patterns** to prevent problematic file copying
5. **Integrated with existing build process** using npm scripts

## Files Created/Modified

### New Files
- `typedoc.json` - Main TypeDoc configuration
- `.typedocignore` - Additional exclusion patterns
- `scripts/serve-docs.ts` - Bun-based static file server for documentation
- `TYPEDOC_SETUP.md` - This documentation

### Modified Files
- `package.json` - Added documentation generation scripts
- Updated TypeDoc dependency to ^0.27.0

## Configuration Details

### TypeDoc Configuration (`typedoc.json`)
- **Entry Points**: All 8 packages (3 in packages/, 5 in gamePackages/)
- **Entry Point Strategy**: "packages" for monorepo support
- **Output**: Temporary directory `/tmp/typedoc-randsum` (moved to `docs/api/generated`)
- **Exclusions**: Comprehensive patterns to prevent recursive issues
- **TypeScript Compatibility**: Works with TypeScript 5.8.3
- **Theme**: Default with light/dark highlight themes
- **Navigation**: GitHub and NPM links configured

### Key Exclusion Patterns
```json
"exclude": [
  "**/node_modules/**",
  "**/dist/**", 
  "**/coverage/**",
  "**/*.test.ts",
  "**/*.spec.ts",
  "**/__tests__/**",
  "**/docs/**",
  "docs/**",
  ".typedoc-temp/**",
  ".moon/**",
  "*.lock",
  "**/.git/**"
]
```

## Available Scripts

### Documentation Generation
```bash
# Generate documentation only
bun run docs:generate

# Build packages and generate documentation  
bun run docs:build

# Full site build (same as docs:build)
bun run site:build

# Serve documentation locally (using Bun's native server)
bun run docs:serve
```

### How It Works

1. **Clean**: Removes existing generated docs and temp directory
2. **Generate**: Runs TypeDoc with temporary output to `/tmp/typedoc-randsum`
3. **Move**: Copies generated docs to `docs/api/generated`
4. **Cleanup**: Removes temporary directory

This approach prevents the recursive copying issue by ensuring TypeDoc never encounters its own output directory during generation.

## Bun-Based Documentation Server

The documentation server (`scripts/serve-docs.ts`) is built with Bun's native server capabilities and provides:

- **Fast static file serving** with proper MIME type detection
- **Clean URL support** (serves `/about` as `/about.html`)
- **Directory index serving** (automatically serves `index.html` for directories)
- **Security features** (prevents directory traversal attacks)
- **Caching headers** for better performance
- **No external dependencies** - uses only Bun's built-in APIs

### Server Features
- Serves on port 8000 by default (configurable via `PORT` environment variable)
- Supports all common web file types (HTML, CSS, JS, images, fonts)
- Provides helpful console output with direct links to documentation
- Graceful error handling for missing files

## Generated Documentation Structure

```
docs/api/generated/
├── index.html                    # Main documentation page
├── assets/                       # CSS, JS, and other assets
├── modules/                      # Individual package documentation
│   ├── _randsum_core.html
│   ├── _randsum_dice.html
│   ├── _randsum_notation.html
│   ├── _randsum_5e.html
│   ├── _randsum_blades.html
│   ├── _randsum_daggerheart.html
│   ├── _randsum_root-rpg.html
│   └── _randsum_salvageunion.html
└── CNAME                         # GitHub Pages configuration
```

## Packages Included

### Core Packages
- **@randsum/core** - Shared utilities and types
- **@randsum/dice** - Core dice rolling implementation  
- **@randsum/notation** - Dice notation parser

### Game System Packages
- **@randsum/5e** - D&D 5th Edition support
- **@randsum/blades** - Blades in the Dark support
- **@randsum/daggerheart** - Daggerheart RPG support
- **@randsum/root-rpg** - Root RPG support
- **@randsum/salvageunion** - Salvage Union support

## Troubleshooting

### If you encounter recursive directory issues:
1. Ensure the output directory is not within the source tree during generation
2. Check that all exclusion patterns are properly configured
3. Verify `.typedocignore` file is present and contains proper patterns

### If TypeScript compatibility warnings appear:
- Current setup uses TypeDoc 0.27.x which supports TypeScript 5.8.3
- If using a different TypeScript version, update TypeDoc accordingly

### If packages are missing from documentation:
- Verify all package directories are listed in `entryPoints` array
- Ensure each package has a valid `package.json` file
- Check that `entryPointStrategy` is set to "packages"

## GitHub Pages Integration

The generated documentation is compatible with GitHub Pages deployment:
- Output directory: `docs/api/generated/`
- Includes CNAME file for custom domain support
- Navigation links point to GitHub repository and NPM organization
- Responsive design with search functionality

## Performance Notes

- Documentation generation takes ~30-60 seconds for all packages
- Uses caching where possible through Moon build system
- Temporary directory approach prevents filesystem issues
- Clean output directory on each generation ensures consistency
