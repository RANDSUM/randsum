---
type: "always_apply"
description: "Enforce consistent TypeScript configuration across the RANDSUM monorepo"
---
# TypeScript Configuration Standards

## Overview

RANDSUM uses strict TypeScript configuration with composite projects and project references to ensure type safety and build performance across the monorepo.

## Core Configuration Requirements

### Base Configuration (tsconfig.json)

- **Target**: `ESNext` for modern JavaScript features
- **Module**: `Preserve` to maintain module syntax for bundlers
- **Module Resolution**: `bundler` for optimal bundling support
- **Strict Mode**: Always enabled with all strict flags
- **Isolated Declarations**: Required for better type checking and performance

### Required Compiler Options

```typescript
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noPropertyAccessFromIndexSignature": true,
    "isolatedDeclarations": true,
    "verbatimModuleSyntax": true
  }
}
```

## Package-Specific Configuration

### Game Packages

- Must extend the root `tsconfig.json`
- Must include project references to `roller` package
- Must exclude test files from build output
- Must set `outDir` to `dist`

### Applications

- May use different module resolution based on runtime requirements
- MCP server uses `Node16` module resolution for Node.js compatibility
- Robo app uses custom configuration for Discord bot requirements

## Project References

All packages that depend on the `roller` package must include it in their project references:

```json
{
  "references": [
    {
      "path": "../../packages/roller"
    }
  ]
}
```

## Type Checking Standards

- All functions must have explicit return types
- Interface and type alias names must use PascalCase
- No `any` types allowed - use proper typing or `unknown`
- Unused variables must be prefixed with underscore (`_`)

## Build Integration

- TypeScript checking is integrated with Moon task system
- All packages must pass `tsCheck` task before building
- Composite builds enable incremental compilation
- Type declarations are generated automatically via `isolatedDeclarations`
