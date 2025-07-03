---
type: "always_apply"
---

## Package Organization & Dependencies

- Roller package (@randsum/raoller) is the main implementation
- Game packages depend only on dice package, not core directly
- Re-export all necessary types from dependencies in each package's index.ts
- Use barrel exports (index.ts files) to organize exports by category
- Mark internal packages as `"private": true` in package.json
- Use consistent package.json structure with proper exports field for dual ESM/CJS
