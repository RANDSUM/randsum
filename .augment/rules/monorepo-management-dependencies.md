---
type: "always_apply"
description: "Standards for managing the RANDSUM monorepo structure, dependencies, and workspace coordination"
---

# Monorepo Management and Dependencies

## Overview

RANDSUM uses a monorepo structure managed by Moon with Bun as the package manager. This architecture enables efficient development, testing, and deployment while maintaining clear separation between packages.

## Workspace Structure

### Directory Organization

Maintain consistent directory structure:

```
@RANDSUM/
├── apps/                    # Applications
│   ├── docs/               # Documentation website
│   ├── mcp/                # MCP server
│   └── robo/               # Discord bot
├── packages/               # Reusable packages
│   ├── roller/             # Core dice rolling
│   ├── blades/             # Blades in the Dark
│   ├── daggerheart/        # Daggerheart
│   ├── fifth/              # D&D 5th Edition
│   ├── root-rpg/           # Ironsworn/Starforged
│   └── salvageunion/       # Salvage Union
├── .moon/                  # Moon configuration
├── .augment/               # Augment rules
└── docs/                   # Additional documentation
```

### Package Categories

Organize packages by purpose:

- **Core Packages**: Foundational functionality (`roller`)
- **Game Packages**: Game-specific implementations
- **Applications**: Standalone applications and services

## Dependency Management

### Workspace Dependencies

Use workspace references for internal dependencies:

```json
// ✅ Correct - Workspace dependency
{
  "dependencies": {
    "@randsum/roller": "workspace:~"
  }
}
```

### External Dependencies

Manage external dependencies consistently:

```json
// ✅ Correct - External dependency management
{
  "dependencies": {
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "bun-types": "latest"
  }
}
```

### Dependency Constraints

Enforce dependency constraints:

- All packages must use the same TypeScript version
- Core packages should minimize external dependencies
- Game packages may have game-specific dependencies
- Applications can have broader dependency requirements

## Moon Configuration

### Workspace Configuration

Configure Moon workspace in `.moon/workspace.yml`:

```yaml
# ✅ Correct - Moon workspace configuration
extends: 'https://raw.githubusercontent.com/moonrepo/moon-configs/master/shared/workspace.yml'

projects:
  - 'apps/*'
  - 'packages/*'

runner:
  archiveOutputs: true
  cacheLifetime: '7 days'
  inheritColorsForPipedTasks: true

notifier:
  webhookUrl: '$MOON_WEBHOOK_URL'

vcs:
  manager: 'git'
  defaultBranch: 'main'
```

### Task Dependencies

Define clear task dependencies:

```yaml
# ✅ Correct - Task dependencies in moon.yml
tasks:
  build:
    command: 'bunx bunup'
    inputs:
      - 'src/**/*'
      - 'package.json'
      - 'tsconfig.json'
    outputs:
      - 'dist'
    deps:
      - '~:type-check'
      - '^:build'  # Build dependencies first

  test:
    command: 'bun test'
    inputs:
      - 'src/**/*'
      - '__tests__/**/*'
      - 'package.json'
    deps:
      - '~:build'

  type-check:
    command: 'tsc --noEmit'
    inputs:
      - 'src/**/*'
      - 'tsconfig.json'
```

### Task Inheritance

Use task inheritance for common patterns:

```yaml
# ✅ Correct - Task inheritance
extends: '../.moon/tasks.yml'

tasks:
  build:
    options:
      mergeArgs: 'replace'
    args:
      - '--minify'
      - '--sourcemap'
```

## Package Interdependencies

### Dependency Graph

Maintain clear dependency relationships:

```
roller (core)
├── blades
├── daggerheart  
├── fifth
├── root-rpg
└── salvageunion

apps/
├── docs → roller, blades, daggerheart, fifth, root-rpg, salvageunion
├── mcp → roller
└── robo → roller, fifth
```

### Circular Dependency Prevention

Prevent circular dependencies:

- Core packages cannot depend on game packages
- Game packages can only depend on core packages
- Applications can depend on any package
- Packages within the same category should not depend on each other

```typescript
// ❌ Incorrect - Circular dependency
// In @randsum/roller
import { rollBlades } from '@randsum/blades' // NO!

// ✅ Correct - Proper dependency direction
// In @randsum/blades
import { coreRoll } from '@randsum/roller' // YES!
```

## Version Management

### Synchronized Versioning

Use synchronized versioning across related packages:

```json
// ✅ Correct - Synchronized versions
{
  "name": "@randsum/blades",
  "version": "1.2.3",
  "dependencies": {
    "@randsum/roller": "1.2.3"
  }
}
```

### Version Constraints

Define version constraints:

- Core packages use exact versions for internal dependencies
- Game packages use caret ranges for external dependencies
- Applications use tilde ranges for stability

```json
// ✅ Correct - Version constraints
{
  "dependencies": {
    "@randsum/roller": "1.2.3",      // Exact for internal
    "typescript": "^5.0.0",          // Caret for external
    "express": "~4.18.0"             // Tilde for apps
  }
}
```

## Build Coordination

### Build Order

Ensure correct build order:

1. Core packages (`roller`)
2. Game packages (parallel, depend on core)
3. Applications (parallel, depend on packages)

```yaml
# ✅ Correct - Build order in Moon
tasks:
  build:
    deps:
      - '^:build'  # Build all dependencies first
```

### Incremental Builds

Use incremental builds for efficiency:

```yaml
# ✅ Correct - Incremental build configuration
tasks:
  build:
    inputs:
      - 'src/**/*'
      - 'package.json'
      - 'tsconfig.json'
    outputs:
      - 'dist'
    options:
      cache: true
      persistent: false
```

### Build Artifacts

Manage build artifacts consistently:

- All packages output to `dist/` directory
- Include source maps for debugging
- Generate both ESM and CJS formats
- Include TypeScript declaration files

## Testing Coordination

### Test Dependencies

Coordinate test execution:

```yaml
# ✅ Correct - Test coordination
tasks:
  test:
    command: 'bun test'
    deps:
      - '~:build'      # Build this package first
      - '^:build'      # Build dependencies first
    inputs:
      - 'src/**/*'
      - '__tests__/**/*'
```

### Integration Testing

Run integration tests across packages:

```yaml
# ✅ Correct - Integration testing
tasks:
  test:integration:
    command: 'bun test __tests__/integration'
    deps:
      - '^:build'      # All dependencies must be built
      - '~:build'      # This package must be built
```

## Release Management

### Release Coordination

Coordinate releases across packages:

```bash
# ✅ Correct - Coordinated release process
# 1. Version all packages
bun run version:all

# 2. Build all packages
moon run :build

# 3. Test all packages
moon run :test

# 4. Publish all packages
bun run publish:all
```

### Changelog Management

Maintain changelogs for each package:

```markdown
# Changelog

## [1.2.3] - 2024-01-15

### Added
- New exploding dice modifier
- Support for custom die faces

### Changed
- Improved error messages
- Updated TypeScript to 5.0

### Fixed
- Fixed modifier logging issue
```

## Development Workflow

### Local Development

Set up efficient local development:

```bash
# ✅ Correct - Local development setup
# Install all dependencies
bun install

# Build all packages
moon run :build

# Run tests
moon run :test

# Start development mode
moon run :dev
```

### Hot Reloading

Configure hot reloading for development:

```yaml
# ✅ Correct - Development task
tasks:
  dev:
    command: 'bun --watch src/index.ts'
    local: true
    options:
      persistent: true
```

## CI/CD Integration

### Pipeline Configuration

Configure CI/CD for monorepo:

```yaml
# ✅ Correct - GitHub Actions for monorepo
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Build packages
        run: moon run :build
        
      - name: Run tests
        run: moon run :test
        
      - name: Check types
        run: moon run :type-check
```

### Affected Package Detection

Only test/build affected packages:

```yaml
# ✅ Correct - Affected package detection
- name: Run affected tests
  run: moon run :test --affected
```

## Documentation Coordination

### Cross-Package Documentation

Maintain documentation links:

```markdown
# Related Packages

- [@randsum/roller](../roller) - Core dice rolling functionality
- [@randsum/blades](../blades) - Blades in the Dark dice rolling
- [@randsum/fifth](../fifth) - D&D 5th Edition dice rolling
```

### API Documentation

Generate unified API documentation:

```bash
# ✅ Correct - Unified documentation generation
moon run docs:generate
```

## Troubleshooting

### Common Issues

Address common monorepo issues:

1. **Dependency Resolution**: Use `bun install --force` to resolve conflicts
2. **Build Order**: Check Moon task dependencies
3. **Version Mismatches**: Ensure synchronized versions
4. **Cache Issues**: Clear Moon cache with `moon clean`

### Debugging Tools

Use debugging tools:

```bash
# Check dependency graph
moon query projects --graph

# Analyze task dependencies
moon query tasks --graph

# Debug build issues
moon run :build --log debug
```
