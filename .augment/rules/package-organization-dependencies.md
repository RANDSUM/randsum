---
type: "always_apply"
---

## Package Organization & Dependencies

- Core package (@randsum/core) contains shared utilities, types, and modifiers
- Dice package (@randsum/dice) is the main implementation, depends on core
- Notation package (@randsum/notation) handles dice notation parsing, depends on core
- Game packages depend only on dice package, not core directly
- Re-export all necessary types from dependencies in each package's index.ts
- Use barrel exports (index.ts files) to organize exports by category
- Mark internal packages as `"private": true` in package.json
- Use consistent package.json structure with proper exports field for dual ESM/CJS
