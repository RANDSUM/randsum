# ADR-006: Notation Scope Boundary — Single Roll Expressions Only

## Status
Accepted

## Context

As the RANDSUM dice notation grows toward a full DSL (tokenizer, parser, evaluator, validator, serializer all present), we need to draw a clear line between what the core notation engine supports and what belongs in higher-level tooling.

The notation gap research (2026-03-14) identified several features from other platforms that involve **multi-expression composition**:

- **Named results** (`a=4d6, b=2d8, a+b`) — variable assignment, symbol tables, expression references. Only supported by Sophie's Dice (1 platform).
- **Sub-expressions** (`!{20=[4d8]}`) — conditional branching where a roll result triggers a different roll expression. Only supported by Sophie's Dice (1 platform).
- **Grouped/pool rolls** (`{4d6, 3d8}kh`) — merging dice from multiple expressions into a shared pool for modifier application. Supported by Roll20, Foundry, RPG Dice Roller (3 platforms).

These features share a common trait: they compose multiple independent roll expressions into a larger evaluation context. This is fundamentally different from what `roll()` does today — evaluate a single expression (possibly with multiple dice groups that sum together).

## Decision

The core notation engine (`@randsum/roller`) will **not** support multi-expression composition features:

- **Named results**: No variable assignment, no symbol tables, no expression references.
- **Sub-expressions**: No conditional branching to different roll expressions based on results.

These features belong in **higher-level tooling** — an Obsidian plugin, a scratchpad/playground application, a scripting layer, or a game-specific pipeline — where the orchestration logic can call `roll()` multiple times and compose results in application code.

### Grouped/Pool Rolls: Deferred, Not Rejected

Grouped rolls (`{4d6, 3d8}kh`) sit at the boundary. They compose multiple dice definitions but produce a single result — which is within the spirit of "a single roll." They also have 3-platform precedent. This feature is **deferred for future evaluation** rather than explicitly excluded. If implemented, it would extend the argument parsing to merge pools before modifier application, not introduce variable binding or conditional logic.

### Dynamic Dice: Under Consideration

Dynamic dice (`(2d4)d8`) — where one roll's result parameterizes another — is also at the boundary. It's a single expression that happens to require two-phase evaluation. This is closer to "a single roll with a computed parameter" than "composing multiple expressions." No decision is made here; it will be evaluated separately based on demand and implementation complexity.

## Consequences

### What This Means for the Core Engine

- `roll()` accepts one or more dice expressions that sum together. Each expression is independent.
- Modifiers apply within a single expression, not across expressions.
- No assignment operators, no variable references, no conditional branching in notation.
- The notation language remains a **description language** for dice mechanics, not a **programming language** for dice logic.

### What This Means for Tooling

Higher-level tools that need composition can:

```typescript
// Application-level composition — not in the notation engine
const attack = roll('1d20+5')
const damage = attack.total >= 15 ? roll('2d6+3') : null

// Scratchpad/plugin could parse its own syntax:
// "a = 1d20+5, b = 2d6+3, if a >= 15 then b"
// and orchestrate multiple roll() calls
```

This keeps the core engine simple, fast, and focused while allowing unlimited composition at the application layer.

### Features Explicitly Out of Scope

| Feature | Reason | Where It Belongs |
|---------|--------|-----------------|
| Named results (`a=4d6`) | Multi-expression composition | Scratchpad plugin, Obsidian plugin |
| Sub-expressions (`!{20=[4d8]}`) | Conditional branching | Game package pipelines, application code |
| Expression variables | Symbol table / DSL scope | Scripting layer above the engine |

### Features Still Under Consideration

| Feature | Status | Notes |
|---------|--------|-------|
| Grouped/pool rolls (`{4d6, 3d8}kh`) | Deferred | Single result, 3-platform precedent |
| Dynamic dice (`(2d4)d8`) | Under consideration | Single expression, two-phase evaluation |

## References
- Notation gap research (2026-03-14): `memory/notation-gaps.md`
- Named results and sub-expressions: Sophie's Dice only (1 platform each)
- Grouped rolls: Roll20, Foundry, RPG Dice Roller (3 platforms)
