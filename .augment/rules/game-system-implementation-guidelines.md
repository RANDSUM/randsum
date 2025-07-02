---
type: "always_apply"
---

## Game System Implementation Guidelines

- Each game system should have its own package in gamePackages/
- Implement core rolling mechanics specific to that game system
- Include relevant tables and reference data as needed
- Use TypeScript for type safety of game-specific data structures
- Follow the pattern of exporting main roll function and result types
- Include comprehensive examples in README showing typical usage patterns
- Implement helper functions for common game mechanics (advantage, critical hits, etc.)
