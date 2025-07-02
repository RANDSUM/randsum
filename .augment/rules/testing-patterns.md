---
type: "always_apply"
---

## Testing Patterns

- Use Bun test framework exclusively
- Test files in `__tests__/` directories with `.test.ts` extension
- Import test utilities from 'bun:test': describe, expect, test, mock, spyOn
- Use consistent test structure: describe blocks for grouping, descriptive test names
- Test coverage configuration in bunfig.toml with thresholds: lines=1.0, branches=0.8, statements=0.8
- Mock external dependencies and random functions for deterministic tests
- Create helper functions for common test patterns (e.g., createRollParameters)
- Test both happy path and error conditions
- Use type assertions in tests to verify TypeScript types
