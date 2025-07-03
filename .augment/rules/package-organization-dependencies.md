---
type: "always_apply"
---

## Package Organization & Dependencies

- Roller package (@randsum/roller) is the main implementation (merged from core, dice, notation)
- Game packages depend only on roller package
- Re-export all necessary types from dependencies in each package's index.ts
- Use barrel exports (index.ts files) to organize exports by category
- Mark internal packages as `"private": true` in package.json
- Use consistent package.json structure with proper exports field for dual ESM/CJS
