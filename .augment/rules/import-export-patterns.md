---
type: "always_apply"
---

## Import/Export Patterns

- Use named imports/exports over default exports for better tree-shaking
- Group imports by category: external libraries, internal packages, relative imports
- Use consistent import ordering: libraries first, then internal packages, then relative
- Avoid deep import paths - use barrel exports from package index files
- Re-export types from dependencies to prevent consumers from deep importing
- Use type-only imports when importing only types: `import type { ... }`
