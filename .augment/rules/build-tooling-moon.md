---
type: "always_apply"
description: "Guidelines for Moon task configuration and build system management"
---
# Build System and Moon Tooling Standards

## Overview

RANDSUM uses Moon as the primary task orchestration tool with Bun as the runtime and package manager. All build processes, testing, and quality checks are coordinated through Moon's task system.

## Moon Configuration Structure

### Workspace Configuration (`.moon/workspace.yml`)

- Projects are organized in `apps/*` and `packages/*` directories
- Git is the VCS manager with `main` as the default branch
- All projects are automatically discovered via glob patterns

### Task Configuration (`.moon/tasks.yml`)

Global tasks are defined for common operations across all packages:

- **build**: Uses `bunup` for dual ESM/CJS output with source maps
- **test**: Uses `bun test` with dependency on build task
- **lint**: Uses ESLint with shared configuration
- **format**: Uses Prettier with shared configuration

## Package-Specific Moon Configuration

### Required Fields

Every package must have a `moon.yml` file with:

```yaml
$schema: 'https://moonrepo.dev/schemas/project.json'
id: package-name
language: 'typescript'
```

### Dependency Management

Packages must declare dependencies on other packages:

```yaml
dependsOn:
  - 'roller'  # For game packages
```

### Task Dependencies

Tasks must declare their dependencies to ensure proper build order:

```yaml
tasks:
  tsCheck:
    deps:
      - 'roller:build'
  build:
    deps:
      - 'roller:build'
  test:
    deps:
      - 'roller:build'
  lint:
    deps:
      - 'roller:build'
```

## Build Process Standards

### Bunup Configuration

All packages use consistent build arguments:
- `--entry src/index.ts`: Single entry point
- `-o dist`: Output to dist directory
- `--format esm,cjs`: Dual format output
- `-m -d -s`: Minification, declarations, source maps
- `-t node`: Target Node.js environment
- `-c`: Clean output directory
- `--sm inline`: Inline source maps

### Output Structure

All packages must output to `dist/` directory with:
- `index.js` (ESM)
- `index.cjs` (CommonJS)
- `index.d.ts` (TypeScript declarations)
- `index.d.cts` (CommonJS TypeScript declarations)

## Task Execution Patterns

### Common Commands

- `bun moon :build` - Build all packages
- `bun moon :test` - Run all tests
- `bun moon :lint` - Lint all packages
- `bun moon :tsCheck` - Type check all packages
- `bun moon :ci` - Run complete CI pipeline

### Package-Specific Commands

- `bun moon roller:test` - Test specific package
- `bun moon blades:build` - Build specific package

## Caching Strategy

### Cache Configuration

- Build tasks have `cache: false` to ensure fresh builds
- Test tasks have `cache: false` for reliability
- Lint and format tasks can be cached based on input files

### Input/Output Tracking

Tasks specify inputs and outputs for proper dependency tracking:

```yaml
inputs:
  - 'src/**/*'
  - '__tests__/**/*'
outputs:
  - 'dist/**/*'
```

## CI/CD Integration

### Required Tasks for CI

All packages must support these tasks:
- `build`: Compile TypeScript and generate outputs
- `test`: Run unit tests
- `lint`: Check code quality
- `tsCheck`: Verify TypeScript types

### Publishing Tasks

Publishing packages require:
- Successful build
- All tests passing
- Clean lint results
- Valid TypeScript compilation

## Package Tags

Use tags to categorize packages:
- `game`: For game-specific packages (blades, fifth, etc.)
- `app`: For application packages (mcp, robo)
- `core`: For foundational packages (roller)

## Error Handling

### Build Failures

- Tasks fail fast on first error
- Dependencies prevent downstream tasks from running
- Clear error messages are provided for debugging

### Dependency Resolution

- Moon automatically resolves task dependencies
- Circular dependencies are detected and prevented
- Missing dependencies cause clear error messages
