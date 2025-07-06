---
type: "always_apply"
description: "Consistent patterns for exports, imports, and module organization"
---

# Export Patterns and Module Structure Standards

## Overview

RANDSUM uses consistent export and import patterns to ensure tree-shaking compatibility, clear API boundaries, and maintainable code structure across all packages.

## Export Patterns

### Barrel Exports (index.ts)

Use barrel exports for clean package APIs:

```typescript
// ✅ Correct - Separate runtime and type exports
export * from './feature'
export * from './utils'
export type * from './types'
```

```typescript
// ❌ Incorrect - Mixed exports
export * from './types'  // Don't mix runtime and types
```

### Type-Only Exports

Always use `export type *` for type definitions:

```typescript
// ✅ Correct - Explicit type-only export
export type * from './types'
export type * from './interfaces'

// ❌ Incorrect - Runtime export of types
export * from './types'
```

### Named Exports Preference

Prefer named exports over default exports:

```typescript
// ✅ Correct - Named exports
export function roll(args: RollArgument): RollResult { }
export function meetOrBeat(dc: number): boolean { }

// ❌ Incorrect - Default exports
export default function roll(args: RollArgument): RollResult { }
```

## Import Patterns

### Import Sorting

Follow ESLint sort-imports configuration:

```typescript
// ✅ Correct - Sorted imports
import { describe, expect, test } from 'bun:test'
import type { RollArgument } from '../src/types'
import { roll } from '../src/roll'

// ❌ Incorrect - Unsorted imports
import { roll } from '../src/roll'
import type { RollArgument } from '../src/types'
import { describe, expect, test } from 'bun:test'
```

### Type-Only Imports

Use `import type` for type-only imports:

```typescript
// ✅ Correct - Type-only import
import type { RollResult, RollArgument } from './types'
import { roll } from './roll'

// ❌ Incorrect - Runtime import of types
import { RollResult, RollArgument, roll } from './index'
```

### Internal Package Imports

Use relative imports within packages:

```typescript
// ✅ Correct - Relative imports within package
import type { NumericRollResult } from '../types'
import { coreRoll } from '../lib'

// ❌ Incorrect - Absolute imports within package
import type { NumericRollResult } from '@randsum/roller'
```

## Module Organization

### Single Responsibility Files

Each file should have one primary export:

```typescript
// ✅ Correct - Single primary export
// roll.ts
export function roll(args: RollArgument): RollResult {
  // implementation
}

// ❌ Incorrect - Multiple unrelated exports
export function roll() { }
export function validate() { }
export function format() { }
```

### Feature-Based Organization

Organize modules by feature, not by type:

```
src/
├── roll/
│   ├── index.ts
│   ├── generateRoll.ts
│   └── utils/
├── validation/
│   ├── index.ts
│   └── validateNotation.ts
└── types/
    ├── index.ts
    ├── dice.ts
    └── results.ts
```

### Type Definition Organization

Organize types by domain:

```typescript
// types/index.ts - Barrel file
export type * from './dice'
export type * from './results'
export type * from './modifiers'
export type * from './options'
```

## Package API Design

### Public API Surface

Keep public APIs minimal and focused:

```typescript
// ✅ Correct - Focused public API
export { roll } from './roll'
export { validateNotation } from './validation'
export { D, D20, D6 } from './dice'
export type * from './types'

// ❌ Incorrect - Exposing internal utilities
export { coreRandom } from './lib/utils'  // Internal utility
```

### Versioned APIs

For breaking changes, consider versioned exports:

```typescript
// For major version changes
export { roll as rollV2 } from './v2/roll'
export { roll } from './roll'  // Current version
```

## Tree-Shaking Optimization

### Side-Effect Free Modules

Mark packages as side-effect free:

```json
{
  "sideEffects": false
}
```

### Avoid Top-Level Execution

Don't execute code at module level:

```typescript
// ✅ Correct - Lazy initialization
let cache: Map<string, any> | undefined

function getCache(): Map<string, any> {
  if (!cache) {
    cache = new Map()
  }
  return cache
}

// ❌ Incorrect - Top-level execution
const cache = new Map()  // Executed on import
```

## Re-export Patterns

### Selective Re-exports

Re-export only what's needed:

```typescript
// ✅ Correct - Selective re-export
export { roll, validateNotation } from '@randsum/roller'

// ❌ Incorrect - Blanket re-export
export * from '@randsum/roller'  // Exposes internal APIs
```

### Type Re-exports

Re-export types explicitly:

```typescript
// ✅ Correct - Explicit type re-export
export type { RollResult, RollArgument } from '@randsum/roller'

// ❌ Incorrect - Runtime re-export of types
export { RollResult, RollArgument } from '@randsum/roller'
```

## Game Package Export Patterns

### Consistent Game Package APIs

All game packages should follow this pattern:

```typescript
// src/index.ts
export * from './roll'
export * from './meetOrBeat'  // If applicable
export type * from './types'
```

### Game-Specific Types

Export game-specific result types:

```typescript
// types.ts
export type BladesResult = 'critical' | 'success' | 'partial' | 'failure'
export type RootResult = 'Strong Hit' | 'Weak Hit' | 'Miss'

// index.ts
export type * from './types'
```

## CLI and Binary Exports

### Binary Files

For CLI tools, use proper shebang and imports:

```typescript
#!/usr/bin/env node

import { roll, validateNotation } from '@randsum/roller'
```

### Package.json Bin Configuration

```json
{
  "bin": {
    "randsum": "./bin/randsum"
  }
}
```
