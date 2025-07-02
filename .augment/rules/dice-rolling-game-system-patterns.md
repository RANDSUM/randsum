---
type: "always_apply"
---

## Dice Rolling & Game System Patterns

- All dice rolling functions should return detailed result objects with sum, rolls, notation
- Use modifier system from core package for dice roll modifications
- Game system functions should follow naming pattern: roll[GameName] (e.g., roll5e, rollBlades)
- Implement advantage/disadvantage as drop modifiers (drop lowest/highest)
- Use consistent parameter patterns: options objects with optional modifiers
- Return game-specific result types that extend base roll results
- Include human-readable descriptions in roll results
- Use type-safe enums for game-specific outcomes (e.g., 'Strong Hit' | 'Weak Hit' | 'Miss')
- Implement meet-or-beat functions for target number systems
- Use consistent error handling with custom error classes (e.g., InvalidUniqueError)
