---
type: "always_apply"
---

## TypeScript Patterns

- Use strict TypeScript configuration with all strict checks enabled
- Prefer interfaces over types for object shapes
- Use discriminated union types extensively for type safety
- Use union types for game-specific enums (e.g., 'Advantage' | 'Disadvantage')
- Export types and interfaces alongside implementations
- Use type guards for runtime type checking (e.g., isNumericRollOptions)
- Prefer readonly properties for immutable data structures
- Use template literal types for string patterns where appropriate
- NEVER use `any`
- NEVER use `as` for type assertions
- Prefer using nullish coalescing operator (`??`) instead of a logical or (`||`), as it is a safer operator.
