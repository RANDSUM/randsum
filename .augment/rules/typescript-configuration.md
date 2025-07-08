---
type: "always_apply"
description: "TypeScript configuration standards for RANDSUM"
---

# TypeScript Configuration

## Core Requirements

- **Strict mode**: Always enabled with all strict flags
- **Target**: `ESNext` with `bundler` module resolution
- **Isolated Declarations**: Required for type generation
- **Project References**: Game packages must reference `roller`

## Key Compiler Options

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedDeclarations": true,
    "verbatimModuleSyntax": true
  }
}
```

## Coding Standards

- All functions need explicit return types
- No `any` types - use proper typing or `unknown`
- PascalCase for interfaces and type aliases
- Prefix unused variables with underscore (`_`)
