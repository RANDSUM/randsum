---
type: "always_apply"
description: "Guidelines for organizing packages and maintaining consistent structure across RANDSUM"
---

# Package Structure and Organization Standards

## Overview

RANDSUM follows a consistent package structure across all packages to ensure maintainability, discoverability, and ease of development. Each package serves a specific purpose and follows established conventions.

## Monorepo Structure

### Top-Level Organization

```
├── apps/           # Applications (MCP server, Discord bot, docs)
├── packages/       # Reusable packages (roller, game systems)
├── .moon/          # Moon configuration
├── .augment/       # Augment rules and configuration
└── docs/           # Documentation
```

### Package Categories

- **Core Packages**: Foundational functionality (roller)
- **Game Packages**: Game-specific implementations (blades, fifth, daggerheart, root-rpg, salvageunion)
- **Applications**: Standalone applications (mcp, robo, docs)

## Standard Package Structure

### Required Files and Directories

```
package-name/
├── src/
│   ├── index.ts        # Main entry point with exports
│   ├── types.ts        # Type definitions (if needed)
│   └── [feature].ts    # Feature implementations
├── __tests__/          # Test files
├── dist/               # Build output (generated)
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
├── moon.yml            # Moon task configuration
├── README.md           # Package documentation
└── LICENSE             # License file
```

### Source Code Organization

#### Entry Point (`src/index.ts`)

Must use barrel exports with type-only exports:

```typescript
export * from './feature'
export * from './otherFeature'
export type * from './types'
```

#### Type Definitions

- Use separate `types.ts` files for complex type definitions
- Export types using `export type *` pattern
- Organize types by feature or domain

#### Feature Files

- One primary function or class per file
- Use descriptive file names that match the main export
- Keep files focused and cohesive

## Package.json Standards

### Required Fields

```json
{
  "name": "@randsum/package-name",
  "version": "x.y.z",
  "description": "Clear, concise description",
  "private": false,
  "author": {
    "name": "Alex Jarvis",
    "url": "https://github.com/alxjrvs"
  },
  "license": "MIT",
  "homepage": "https://github.com/RANDSUM/randsum",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/RANDSUM/randsum.git",
    "directory": "packages/package-name"
  }
}
```

### Module Configuration

```json
{
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "source": "./src/index.ts",
  "react-native": "./src/index.ts"
}
```

### Export Maps

```json
{
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"
  }
}
```

## Dependencies and Workspace References

### Internal Dependencies

Use workspace references for internal packages:

```json
{
  "dependencies": {
    "@randsum/roller": "workspace:~"
  }
}
```

### External Dependencies

- Keep dependencies minimal and focused
- Use exact versions for critical dependencies
- Prefer peer dependencies for shared libraries

## Game Package Patterns

### Structure Requirements

Game packages must:
- Depend on `@randsum/roller` package
- Export a main `roll` function
- Export type definitions for results
- Include comprehensive README with examples

### Naming Conventions

- Package names use kebab-case: `@randsum/root-rpg`
- Export functions use camelCase: `rollRoot`, `meetOrBeat`
- Types use PascalCase: `RootResult`, `BladesResult`

### API Consistency

Game packages should follow this pattern:

```typescript
// Main roll function
export function roll(args: RollArgument): RollResult

// Optional utility functions
export function meetOrBeat(dc: number, args: RollArgument): MeetOrBeatResult

// Type exports
export type * from './types'
```

## Application Structure

### Apps Directory

Applications in `apps/` directory:
- Can have different structure requirements
- May use different build tools (e.g., Robo.js for Discord bot)
- Should still follow TypeScript and quality standards

### Configuration Files

Applications may have additional configuration files:
- `robo.ts` for Robo.js applications
- Custom build configurations
- Environment-specific settings

## Documentation Requirements

### README.md Structure

Each package must have a README with:
1. Package description and badges
2. Installation instructions
3. Usage examples with code
4. API reference
5. Related packages section

### Code Examples

- Use TypeScript in all examples
- Show both basic and advanced usage
- Include expected output where relevant
- Demonstrate error handling patterns

## Testing Organization

### Test File Structure

```
__tests__/
├── feature.test.ts     # Feature-specific tests
├── integration.test.ts # Integration tests
└── support/
    └── fixtures.ts     # Test fixtures and utilities
```

### Test Naming

- Test files end with `.test.ts` or `.spec.ts`
- Test descriptions should be clear and specific
- Use `describe` blocks to group related tests
