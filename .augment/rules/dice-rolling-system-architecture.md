---
type: "always_apply"
description: "Core architecture principles for RANDSUM dice system"
---

# Dice System Architecture

## Core Principles

- **Separation of Concerns**: Core rolling → Modifier application → Result formatting
- **Type Safety**: All operations must be type-safe with proper interfaces
- **Immutable Data**: Never mutate input data, always return new objects
- **Discriminated Unions**: Use `type` field for result types (/custom/mixed)

## Key Components

- **Die Classes**: Die and CustomDie extending base Die class
- **Modifier System**: Common interface with `apply()` method returning `{rolls, logs}`
- **Result Types**: RollResult, CustomRollResult with discriminated unions
- **Random Generation**: Centralized `coreRandom()` function

## Modifier Requirements

- All modifiers implement common interface with `name` and `apply()` method
- `apply()` returns `{rolls: number[], logs: ModifierLog[]}`
- ModifierLog must include `modifier`, `options`, `added`, `removed` arrays
- Never mutate input rolls - always return new arrays
- Support modifier chaining by applying sequentially

## Testing Standards

- Use MockRandom for deterministic testing
- Test that modifiers don't mutate input data
- Verify modifier logs contain proper added/removed arrays
- Test architectural constraints (immutability, type safety)
