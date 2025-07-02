---
type: "always_apply"
---

## Anti-Patterns to Avoid

- Do not manually edit package.json files - use package managers (bun add, bun remove)
- Do not create circular dependencies between packages
- Do not use CommonJS modules - stick to ESM
- Do not skip type checking or linting in CI/CD
- Do not use any or unknown types without justification
- Do not create deep import paths - use barrel exports
- Do not duplicate testing utilities - abstract to packages/core
- Do not use Python tools when bun-native alternatives exist
