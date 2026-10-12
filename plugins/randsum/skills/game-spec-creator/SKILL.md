---
name: game-spec-creator
description: Help users create .randsum.json specs for custom TTRPG dice mechanics. Use when someone wants to define a new game system, translate tabletop game rules into declarative specs, or understand the RANDSUM spec format.
license: MIT
metadata:
  author: RANDSUM
  version: "1.0"
  repository: https://github.com/RANDSUM/randsum
---

# Game Spec Creator

Create `.randsum.json` specs that declaratively define tabletop RPG dice mechanics. A spec describes a four-stage pipeline -- **Dice -> Modify -> Resolve -> Outcome** -- and generates a typed TypeScript `roll()` function via codegen.

## Spec Structure

Every spec requires these top-level fields:

```json
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json",
  "name": "My Game",
  "shortcode": "mygame",
  "game_url": "https://example.com",
  "version": "1.0.0",
  "roll": { ... }
}
```

Optional top-level sections for reuse across rolls:

- **`pools`** -- Named dice pool definitions. Reference with `{ "$ref": "#/pools/<name>" }`.
- **`tables`** -- Lookup tables mapping roll values to result strings.
- **`outcomes`** -- Named outcome operations for result classification.

### The `roll` Object

The `roll` object defines the pipeline:

| Field | Stage | Required | Purpose |
|---|---|---|---|
| `inputs` | -- | No | Declare runtime parameters (stat, modifier, rating) |
| `dice` | 1 | Yes* | Pool reference + quantity. *Or use `dicePools` for multi-pool rolls |
| `modify` | 2 | No | Modifier chain (keepHighest, keepLowest, add, cap) |
| `resolve` | 3 | Yes | Resolution: `"sum"`, `countMatching`, `tableLookup`, or `comparePool` |
| `outcome` | 4 | No | Map resolved value to a game result string |
| `when` | -- | No | Conditional overrides based on input values |
| `details` | -- | No | Extra typed fields returned alongside the result |
| `postResolveModifiers` | -- | No | Arithmetic applied after resolve (e.g. 2d6+stat) |

### Inputs

Inputs are typed parameters the caller passes at roll time. Bind them in the pipeline with `{ "$input": "paramName" }`.

```json
"inputs": {
  "modifier": { "type": "integer", "minimum": -5, "maximum": 5, "default": 0 },
  "mode": { "type": "string", "enum": ["Normal", "Advantage"], "optional": true }
}
```

Types: `integer`, `string`, `boolean`. Inputs can have `default`, `minimum`/`maximum`, `enum`, `optional`, and `description`.

### Dice

Single pool (inline or referenced):

```json
"dice": { "pool": { "sides": 20 }, "quantity": 1 }
"dice": { "pool": { "$ref": "#/pools/actionDice" }, "quantity": { "$input": "rating" } }
```

Multi-pool (use `dicePools` instead of `dice`):

```json
"dicePools": {
  "hope": { "pool": { "sides": 12 } },
  "fear": { "pool": { "sides": 12 } }
}
```

### Modify

Array of modifier operations applied to individual dice before resolving:

```json
"modify": [
  { "keepHighest": 1 },
  { "add": { "$input": "modifier" } },
  { "cap": { "min": 1, "max": 20 } }
]
```

Available: `keepHighest`, `keepLowest`, `add`, `cap`, `markDice`/`keepMarked`.

### Resolve

- `"sum"` -- Total all remaining dice
- `{ "countMatching": { "operator": ">=", "value": 7 } }` -- Count successes
- `{ "tableLookup": { "$ref": "#/tables/myTable" } }` -- Map total through a table
- `{ "comparePoolHighest": { "pools": ["a","b"], "outcomes": {...} } }` -- Compare pools

### Outcome

Map the resolved value to game result strings:

```json
"outcome": {
  "ranges": [
    { "min": 10, "max": 27, "result": "strong_hit" },
    { "min": 7, "max": 9, "result": "weak_hit" },
    { "min": -11, "max": 6, "result": "miss" }
  ]
}
```

Also supports `tableLookup` (with `$ref` or inline) and `degreeOfSuccess` for PF2e-style tiers.

### Conditional Overrides (`when`)

Override pipeline stages based on input values. First match wins; unspecified stages fall through:

```json
"when": [{
  "condition": { "input": "mode", "operator": "=", "value": "Advantage" },
  "override": {
    "dice": { "pool": { "sides": 20 }, "quantity": 2 },
    "modify": [{ "keepHighest": 1 }, { "add": { "$input": "modifier" } }]
  }
}]
```

### Pool Conditions

Check dice composition rather than totals -- used in tables for mechanics like Blades criticals:

```json
{
  "poolCondition": { "countWhere": { "operator": "=", "value": 6 }, "atLeast": 2 },
  "result": "critical"
}
```

Use `atLeastRatio` (0-1) instead of `atLeast` for proportion-based checks.

## Guided Workflow

When helping a user create a spec, follow these steps:

### 1. Identify the core mechanic
Ask: What dice do you roll? What determines success or failure? Classify it:
- **Sum-based**: Roll dice, add modifiers, compare to target (D&D, PbtA)
- **Pool-based**: Roll many dice, count successes (World of Darkness, Shadowrun)
- **Keep-best/worst**: Roll multiple, keep highest or lowest (Blades, advantage/disadvantage)
- **Comparison**: Compare two pools (Daggerheart hope/fear)
- **Table lookup**: Roll and consult a table (Salvage Union, random encounters)

### 2. Map inputs
What does the player choose or provide? Common patterns:
- Numeric modifier (stat bonus, skill rank)
- Pool size (action rating, dice pool count)
- Mode selection (advantage/disadvantage, boost/cut)
- Table name (which random table to roll on)

### 3. Build the pipeline
Define pools, modifiers, resolution strategy, and outcome ranges. Use `when` for variant mechanics. Validate against `packages/games/randsum.json`.

## Common Patterns

**Tiered outcomes (PbtA-style):** Range-based outcome with strong hit / weak hit / miss.

**Keep highest with fallback (Blades-style):** `keepHighest: 1` default, `when` rating=0 overrides to `keepLowest: 1` with 2 dice.

**Advantage/Disadvantage (D&D-style):** `when` conditions that change pool quantity and keep strategy.

**Pool conditions (criticals):** `poolCondition` in table ranges to detect multiple max-value dice.

**Multi-pool comparison (Daggerheart-style):** `dicePools` + `comparePoolHighest` resolve.

**Post-resolve arithmetic:** `postResolveModifiers` for bonuses applied after resolution (not per-die).

**Boolean-conditional values:** `{ "$input": "flag", "ifTrue": 20, "ifFalse": 12 }` for inputs that change die size.

## Validation and Testing

- **Meta-schema**: `packages/games/randsum.json` (or `https://randsum.dev/schemas/v1/randsum.json`)
- **Run codegen**: `bun run --filter @randsum/games gen`
- **Run tests**: `bun run --filter @randsum/games test`
- **Check bundle size**: each game should be under 8 KB (except table-heavy games)

## Examples

See [references/SPEC_EXAMPLES.md](references/SPEC_EXAMPLES.md) for complete working specs at three complexity levels.
