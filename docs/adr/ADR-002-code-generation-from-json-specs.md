# ADR-002: Code generation from JSON specs

## Status

Accepted

## Context

Game packages contained hand-written TypeScript with duplicated patterns across each game. The roller API surface was non-trivial, so adding a new game required deep understanding of modifiers, outcome resolution, and table lookups. Inconsistencies between games crept in over time.

## Decision

Define game mechanics declaratively in `.randsum.json` spec files and generate TypeScript via a codegen pipeline (`@randsum/gameSchema`). Each spec is validated against a JSON Schema, normalized into an intermediate representation, and emitted as a self-contained TypeScript module.

## Consequences

- Consistent, predictable output across all game packages.
- Adding a new game is primarily a JSON authoring task, not a TypeScript implementation task.
- Schema validation catches errors before code is generated.
- Trade-off: the codegen pipeline itself adds complexity. Debugging generated code is harder than debugging hand-written code.
- Trade-off: any game mechanic that cannot be expressed in the schema requires extending the schema and codegen, not just writing TypeScript.
