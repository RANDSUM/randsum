---
type: "always_apply"
description: "Export and import patterns for RANDSUM packages"
---

# Export and Import Patterns

## Export Standards

- Use `export type *` for type-only exports from barrel files
- Prefer named exports over default exports
- Keep public APIs minimal - don't expose internal utilities
- Mark packages as `"sideEffects": false` for tree-shaking

## Import Standards

- Use `import type` for type-only imports
- Use relative imports within packages
- Sort imports: external packages first, then types, then local modules

## Module Organization

- One primary export per file
- Organize by feature, not by type
- Use barrel exports in index.ts files

## Game Package Pattern

```typescript
// src/index.ts
export * from './roll'
export * from './meetOrBeat'  // If applicable
export type * from './types'
```
