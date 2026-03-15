# ADR-004: Literal types over branded types for public API

## Status

Accepted

## Context

TypeScript branded types (e.g., `DiceNotation & { __brand: 'notation' }`) could provide stronger compile-time safety for dice notation strings and roll arguments, preventing accidental misuse. However, branded types require explicit wrapping at call sites, adding friction to the API.

## Decision

Use literal types and union types for the public `roll()` API, allowing consumers to pass raw values directly: `roll(20)`, `roll("4d6L")`, `roll({ sides: 6 })`. Type safety is achieved through union discrimination and overloads rather than branding.

## Consequences

- Excellent developer experience: consumers pass plain numbers, strings, or objects without wrapping or casting.
- The three calling conventions (number, notation string, options object) feel natural and require no ceremony.
- Trade-off: less compile-time safety for dynamically constructed notation strings. A typo in `roll("4d6X")` is caught at runtime, not compile time.
- Trade-off: future typed template literal work (see ADR backlog) could close this gap without requiring branded types.
