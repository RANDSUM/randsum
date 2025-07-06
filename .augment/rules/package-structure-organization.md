---
type: "agent_requested"
description: "Package structure organization"
---

# Package Structure

## Standard Layout

```
package-name/
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   └── lib/                  # Core functionality
├── __tests__/                # Test files
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript config
└── moon.yml                  # Moon tasks
```

## File Naming

- Use kebab-case for files: `roll-mechanics.ts`
- Test files: `.test.ts` suffix
- Mirror source structure in tests

## Export Patterns

```typescript
// src/index.ts - Main exports
export { roll } from './roll'
export type * from './types'

// Selective exports only
```

## Configuration

- Use consistent package.json structure
- TypeScript project references for dependencies
- Moon tasks: build, test, typecheck, clean


