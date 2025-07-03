---
type: "always_apply"
---

## Project Architecture & Structure

- This is a TypeScript monorepo using Moon build orchestrator and Bun runtime/package manager
- Use ESM modules exclusively (`"type": "module"` in package.json)
- Organize packages into two categories:
  - `packages/roller` - Core dice rolling implementation (merged from core, dice, notation)
  - `packages/` - Game system implementations (5e, blades, root-rpg, etc.)
- Each package follows the structure: `src/`, `__tests__/`, `dist/` (generated), `package.json`, `README.md`, `moon.yml`
- Use workspace dependencies with `workspace:~` syntax for internal package references
