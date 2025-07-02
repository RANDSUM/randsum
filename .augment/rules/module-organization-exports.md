---
type: "always_apply"
---

## Module Organization & Exports

- Use barrel exports in index.ts files to organize exports by category
- Group exports with comments: "Die classes", "Main rolling function", "Type exports"
- Re-export all necessary types from dependencies to avoid deep imports
- Use consistent export patterns: export classes/functions directly, export types separately
- Organize utility functions in utils/ subdirectories with their own index.ts
- Use descriptive file names that match their primary export (e.g., roll5e.ts exports roll5e)
