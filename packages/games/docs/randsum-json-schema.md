# The `.randsum.json` Guide

A narrative guide to authoring a game spec. Covers the structure of a
`.randsum.json` file, how each field translates into generated TypeScript, and
the patterns drawn from the six game specs currently in the tree.

The formal JSON Schema for this format lives at
`packages/games/randsum.json`. Examples in this guide cite real specs in
`packages/games/*.randsum.json` with file path and line numbers so you can read
the source alongside the prose.

> **Placement note.** This guide sits inside `packages/games/docs/` rather than
> the repo-level `docs/` because it documents a file format that is intrinsic
> to this package. `packages/games/randsum.json` is the schema, the specs are
> siblings of that schema, the codegen that consumes them lives in
> `packages/games/src/lib/codegen/`, and the type reference —
> `packages/games/src/lib/types.ts` — is co-located. Keeping the human-facing
> guide in the same package reduces the blast radius of a rename or an
> extraction and keeps the reader one `cd` away from everything they need.

---

## Contents

1. [What a `.randsum.json` spec is](#1-what-a-randsumjson-spec-is)
2. [Spec anatomy](#2-spec-anatomy)
3. [Roll definitions](#3-roll-definitions)
4. [Pool conditions and conditional pools](#4-pool-conditions-and-conditional-pools)
5. [Tables and outcomes](#5-tables-and-outcomes)
6. [Inputs](#6-inputs)
7. [Common patterns — a cookbook](#7-common-patterns--a-cookbook)
8. [Extending the schema](#8-extending-the-schema)
9. [Validation errors](#9-validation-errors)

---

## 1. What a `.randsum.json` spec is

A `.randsum.json` file declaratively describes how a single tabletop game
resolves a roll. Each spec is the source of truth for one game package.

**The unit: one game, one spec.** A spec lives at the root of `packages/games/`
under `<shortcode>.randsum.json`. For example, `blades.randsum.json` is the
complete Blades in the Dark implementation; there is no other place to look.

**The lifecycle: spec → codegen → generated `.ts`.** At build time,
`packages/games/codegen.ts` reads every `*.randsum.json` at the package root,
validates each against the meta-schema (`packages/games/randsum.json`),
resolves any external `$ref` URLs, normalizes the spec into an intermediate
representation (`packages/games/src/lib/normalizer.ts`), and emits a
self-contained TypeScript module at `packages/games/src/<shortcode>.generated.ts`.

The generated module is checked into git. The pre-push hook runs
`bun run --filter @randsum/games gen:check` to fail the push if a generated
file is stale relative to its spec.

**The philosophy: extend the schema, never hand-write TS.** Generated files
open with the comment `// Auto-generated from <name> spec.` — that comment is
the whole contract. If a game mechanic cannot be expressed in the current
schema, the correct move is to extend
`packages/games/randsum.json`, update the codegen, and regenerate. The
incorrect move is to edit the generated TypeScript by hand; the next
`gen:check` will revert it. See
`docs/adr/ADR-002-code-generation-from-json-specs.md` for the architectural
rationale.

The payoff: consistency across games, schema-level validation of new specs,
and a single place to change a cross-cutting behavior (a new modifier, a new
outcome type, a new resolver) rather than N hand-rolled implementations.

---

## 2. Spec anatomy

Every spec is a JSON object with a handful of top-level fields. The authoritative
types live in `packages/games/randsum.json:7-61`.

```jsonc
{
  "$schema": "https://randsum.dev/schemas/v1/randsum.json",
  "name": "Blades in the Dark",
  "shortcode": "blades",
  "version": "1.0.0",
  "game_url": "https://bladesinthedark.com",
  "srd_url": "https://bladesinthedark.com/basics",

  "pools":    { /* named PoolDefinition entries */ },
  "tables":   { /* named TableDefinition entries */ },
  "outcomes": { /* named OutcomeOperation entries */ },

  "roll":     { /* the primary RollDefinition */ }
  // optional: "rollFortune", "rollProject", etc. — see §3.7
}
```

### 2.1 Required top-level fields

| Field       | Meaning                                                                       | Reference                    |
| ----------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `$schema`   | Must be `https://randsum.dev/schemas/v1/randsum.json`. Enables IDE tooling.  | `randsum.json:10-14`        |
| `name`      | Human-readable game name (e.g. `"Blades in the Dark"`).                       | `randsum.json:15-18`        |
| `shortcode` | `^[a-z][a-z0-9-]*$`. Becomes the generated filename and subpath import name. | `randsum.json:19-23`        |
| `game_url`  | URL to the game's official site.                                              | `randsum.json:24-27`        |
| `roll`      | The default `RollDefinition`. Exported as `roll` from the generated module.   | `randsum.json:51-54`        |

### 2.2 Optional top-level fields

| Field       | Meaning                                                                      | Reference                    |
| ----------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `srd_url`   | URL to the game's SRD when one exists.                                       | `randsum.json:28-31`         |
| `version`   | Spec version (semver recommended).                                           | `randsum.json:32-35`         |
| `pools`     | Named dice-pool templates. Reference with `{ "$ref": "#/pools/<name>" }`.    | `randsum.json:36-40`         |
| `tables`    | Named outcome tables. Reference with `{ "$ref": "#/tables/<name>" }`.        | `randsum.json:41-45`         |
| `outcomes`  | Named outcome operations. Reference with `{ "$ref": "#/outcomes/<name>" }`. | `randsum.json:46-50`         |

### 2.3 `patternProperties`: named rolls beyond `roll`

The schema declares a `patternProperties` entry for `^roll[A-Z][a-zA-Z]*$`
(`packages/games/randsum.json:56-61`). Any top-level key that matches — e.g.
`rollFortune`, `rollProject` — is treated as an additional roll definition,
validated against the same `RollDefinition` schema, and exported from the
generated module under that name.

**None of the current specs use this feature.** It exists in the schema and
codegen (`packages/games/src/lib/typeGuards.ts:14,55-62`), but every
in-tree spec has only the primary `roll`. Authors of games with multiple
distinct roll types (Burning Wheel base + artha, PbtA peripheral moves,
etc.) are the intended users.

### 2.4 `$defs`

The meta-schema's `$defs` section
(`packages/games/randsum.json:62-910`) is purely for schema reuse via
`$ref`. It is not part of a spec's surface area — you will never write
`$defs` in a `.randsum.json`. The names that appear throughout this guide
(`PoolDefinition`, `TableRange`, `PoolCondition`, `ResolveOperation`,
`OutcomeOperation`, `ModifyOperation`, `IntegerOrInput`, etc.) are the names
of entries in that section.

The TypeScript-side mirror of those types lives in
`packages/games/src/lib/types.ts` — consult that file when reading codegen
source.

---

## 3. Roll definitions

A `RollDefinition` describes a complete pipeline that turns inputs and random
dice into a `GameRollResult`. The schema is at
`packages/games/randsum.json:174-236`; the TypeScript shape is at
`packages/games/src/lib/types.ts:178-189`.

The pipeline has four ordered stages:

```
dice (stage 1) → modify (stage 2) → resolve (stage 3) → outcome (stage 4)
```

Stages 1 and 3 are always required. Stages 2 and 4 are optional. Additional
fields (`when`, `inputs`, `postResolveModifiers`, `conditionalPools`,
`details`) wire conditional overrides, input binding, and the shape of the
generated result object.

### 3.1 Stage 1: dice / dicePools

`dice` is either a single `DiceConfig` or an array of two or more. When you
need named pools for multi-pool mechanics, use `dicePools` instead.

**Single pool** — the Blades action roll
(`packages/games/blades.randsum.json:48-51`):

```json
"dice": {
  "pool": { "$ref": "#/pools/actionDice" },
  "quantity": { "$input": "rating" }
}
```

**Named multi-pool** — the Daggerheart Hope/Fear pair
(`packages/games/daggerheart.randsum.json:20-23`):

```json
"dicePools": {
  "hope": { "pool": { "sides": { "$input": "amplifyHope", "ifTrue": 20, "ifFalse": 12 } } },
  "fear": { "pool": { "sides": { "$input": "amplifyFear", "ifTrue": 20, "ifFalse": 12 } } }
}
```

A `DiceConfig` (`randsum.json:370-389`) has:

- `pool` — either `{ "$ref": "#/pools/<name>" }` or an inline `PoolDefinition`
  (e.g. `{ "sides": 20 }`).
- `quantity` (optional) — overrides the referenced pool's default quantity.
  Accepts an integer, an `$input` reference, or an `$input` boolean dispatch.
- `key` — required on each entry of an `array`-style `dice`. Names the pool for
  downstream `comparePool*` resolvers.

`dice` and `dicePools` are mutually exclusive
(`randsum.json:179`). `dicePools` is always the right choice when downstream
resolution needs to refer to pools by name rather than by array index.

### 3.2 Stage 2: modify

`modify` is an optional array of operations that apply to individual dice
before resolution (`randsum.json:202-206`, `randsum.json:404-463`). Each
operation is a single-key object:

| Key           | Effect                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| `keepHighest` | Keep only the N highest dice (advantage).                                       |
| `keepLowest`  | Keep only the N lowest dice (disadvantage, Blades desperate).                   |
| `add`         | Add a flat value to each kept die. Use for per-die bonuses — not for pool totals. |
| `cap`         | Clamp each die to `{ min, max }`.                                               |
| `markDice`    | Attach a `flag` string to each die matching a comparison.                       |
| `keepMarked`  | Keep only dice previously marked with a given flag.                             |

Every `IntegerOrInput` field here (`keepHighest`, `keepLowest`, `add`, cap
bounds, mark value) accepts either a literal integer, `{ "$input": "name" }`
to bind to a declared input, or a boolean dispatch
`{ "$input": "flag", "ifTrue": N, "ifFalse": M }`. See
`randsum.json:875-910`.

**Important distinction.** The `add` modifier inside `modify` adds to _each
die_. To add to the _resolved total_, use `postResolveModifiers` (see §3.5).
Most games want the latter for stat/bonus addition — `pbta.randsum.json:16-20`
is an exception that adds stat/forward/ongoing per-die, and the generated
code (`packages/games/src/pbta.generated.ts`) shows the difference.

### 3.3 Stage 3: resolve

Resolution collapses the dice pool(s) into a single total. Every roll
definition is required to declare a `resolve` (`randsum.json:177`). The
`ResolveOperation` union (`randsum.json:490-555`) has six shapes:

1. **`"sum"`** — add all kept dice. The overwhelmingly common case.

2. **`{ "countMatching": { operator, value } }`** — count dice satisfying a
   comparison. Use for PbtA-style "count hits" mechanics.

3. **`{ "tableLookup": <tableRef> }`** — map the pool total through a named or
   inline table. Used by Blades to express critical detection at the resolve
   layer.

4. **`{ "comparePoolHighest": ComparePoolOperation }`** — with `dicePools`,
   pick the pool whose highest kept die wins; map the winning pool name to a
   result string. Used by Daggerheart Hope/Fear
   (`daggerheart.randsum.json:36-42`).

5. **`{ "comparePoolSum": ComparePoolOperation }`** — same idea as
   `comparePoolHighest` but compares pool sums.

6. **`{ "remoteTableLookup": RemoteTableLookupOperation }`** — fetch a JSON
   dataset at _codegen time_, bake it into the generated module as a static
   constant, and look up results at runtime with zero network calls. Used by
   Salvage Union (`salvageunion.randsum.json:13-31`). Full shape documented in
   §5.3.

### 3.4 Stage 4: outcome

After resolution, `outcome` maps the total to a game result string. Like
`modify`, the stage is optional — without it, the result is just the numeric
total (see `packages/games/src/lib/codegen/emitOutcome.ts:98-100`).

The `OutcomeOperation` union
(`packages/games/randsum.json:659-709`) has three shapes:

1. **`{ "ranges": TableRange[] }`** — a list of range or pool-condition
   entries evaluated top-to-bottom; first match wins.

2. **`{ "degreeOfSuccess": { criticalSuccess?, success?, failure?,
   criticalFailure? } }`** — the PF2e tiered pattern. Each property is the
   minimum total required to reach that degree. Codegen sorts by threshold
   descending and emits a fall-through chain
   (`packages/games/src/lib/codegen/emitOutcome.ts:5-33`).

3. **`{ "tableLookup": <tableRef> }`** — same shape as the `resolve`
   variant; lets the author reuse a named table.

An `outcome` may also be a `$ref` to a named entry in the spec's `outcomes`
section:

```json
"outcome": { "$ref": "#/outcomes/coreMechanicOutcome" }
```

This is the pattern Blades uses to share the outcome table between the
default roll and the desperate override
(`blades.randsum.json:27-36, 54, 61`).

### 3.5 `postResolveModifiers`

Applied to the total, not to individual dice. The only supported operation
is `add` (`randsum.json:391-402`). Daggerheart uses this to apply the
proficiency modifier after Hope/Fear resolution
(`daggerheart.randsum.json:43`):

```json
"postResolveModifiers": [{ "add": { "$input": "modifier" } }]
```

Combine with a `degreeOfSuccess` or `ranges` outcome to express the typical
`NdS + stat ≥ threshold` mechanic without polluting the per-die modifier
chain.

### 3.6 `when`: conditional pipeline overrides

`when` (`randsum.json:215-219`, `randsum.json:257-326`) is an ordered array
of `{ condition, override }` entries. Before the pipeline runs, each entry's
`condition` is evaluated against the provided inputs. The first match
replaces any stages it declares; unspecified stages fall through to the
outer defaults.

Blades uses `when` to swap the pipeline for the desperate-action case
(`packages/games/blades.randsum.json:55-63`):

```json
"when": [
  {
    "condition": { "input": "rating", "operator": "=", "value": 0 },
    "override": {
      "dice":   { "pool": { "$ref": "#/pools/actionDice" }, "quantity": 2 },
      "modify": [{ "keepLowest": 1 }],
      "outcome": { "$ref": "#/outcomes/desperateActionOutcome" }
    }
  }
]
```

A `Condition` (`randsum.json:268-288`) references an `input` name, an
`operator` (`=`, `>`, `>=`, `<`, `<=`), and a literal `value` that must match
the input's declared type. A `PipelineOverride`
(`randsum.json:290-326`) must set at least one stage (`minProperties: 1`).

D&D 5e uses two `when` entries to swap the pipeline for advantage and
disadvantage (`fifth.randsum.json:40-55`). Only the `dice` and `modify`
stages are overridden; the shared `resolve: "sum"` and `details` fall through.

### 3.7 Named rolls (pattern-property roll keys)

As documented in §2.3, any top-level key matching `^roll[A-Z][a-zA-Z]*$` is
treated as an additional roll definition. The generated module exports each
under its declared name. No in-tree spec uses this feature yet; new specs
should prefer `when` overrides for variants that share most of their
pipeline, and reserve named rolls for mechanics that are structurally distinct.

---

## 4. Pool conditions and conditional pools

Two different schema features share the word "conditional":

- **`poolCondition`** — a predicate about _how many dice_ in the already-rolled
  pool match something. Used inside `TableRange` entries to express things like
  "two or more sixes means critical." Schema at
  `packages/games/randsum.json:128-172`.

- **`conditionalPools`** — extra named dice pools that are rolled _only_ when
  an input condition matches, then added to or subtracted from the main
  total. Schema at `packages/games/randsum.json:225-229,238-255`.

They do different jobs. Read carefully.

### 4.1 `poolCondition`

A `PoolCondition` evaluates a counting predicate against a pool of dice and
checks whether the count meets a threshold. The shape is:

```json
{
  "pool": "preModify" | "postModify",   // optional, defaults to preModify
  "countWhere": { "operator": "=", "value": 6 },
  "atLeast": 2                          // OR "atLeastRatio": 0.5 — exactly one
}
```

- `countWhere` picks which dice to count. An operator of `=` with `value: 6`
  counts sixes; `>=` with `value: 4` counts successes in a PbtA-ish pool.
- `atLeast` is an absolute count. `atLeastRatio` is a fraction of the pool
  (e.g. `0.5` = half or more — the Shadowrun glitch pattern). Exactly one
  must be present (`randsum.json:168-171`).
- `pool` selects whether to count the dice as rolled (`preModify`) or after
  keeps/drops/rerolls (`postModify`). `preModify` is the default. Blades
  criticals must count the raw d6 pool, so `preModify` is correct.

In Blades, the critical check lives inside a `TableRange` — which is how it
rides alongside a normal `exact`/`min`/`max` comparison
(`packages/games/blades.randsum.json:14-24`):

```json
"coreMechanic": {
  "ranges": [
    { "poolCondition": { "countWhere": { "operator": "=", "value": 6 }, "atLeast": 2 },
      "result": "critical" },
    { "exact": 6,                  "result": "success" },
    { "min": 4, "max": 5,          "result": "partial" },
    { "min": 1, "max": 3,          "result": "failure" }
  ]
}
```

When a `TableRange` combines a `poolCondition` with `exact`/`min`/`max`, the
two use AND semantics (both must match —
`randsum.json:106-107`). The generated code produces
`preModify.filter(v => v === 6).length >= 2` for the critical check
(`packages/games/src/blades.generated.ts:48`) and threads the `preModify`
array through from the roll record's initial rolls.

### 4.2 `conditionalPools`

`conditionalPools` attaches zero or more extra pools to a roll. Each pool is
keyed by a string identifier and declares a `condition`, a `pool` (inline
or `$ref`), and `arithmetic` that is either `"add"` or `"subtract"`. When
the condition matches at call time, the pool is rolled and its total is
added to (or subtracted from) the main total.

Daggerheart uses this pattern for advantage and disadvantage d6s
(`packages/games/daggerheart.randsum.json:24-35`):

```json
"conditionalPools": {
  "advantage": {
    "condition": { "input": "rollingWith", "operator": "=", "value": "Advantage" },
    "pool":      { "sides": 6 },
    "arithmetic": "add"
  },
  "disadvantage": {
    "condition": { "input": "rollingWith", "operator": "=", "value": "Disadvantage" },
    "pool":      { "sides": 6 },
    "arithmetic": "subtract"
  }
}
```

The keys (`"advantage"`, `"disadvantage"`) matter: they are referenced from
the `details` section via `{ "$conditionalPool": "advantage", "field": "total" }`
to surface the extra d6 result in the typed output
(`daggerheart.randsum.json:56-59`).

---

## 5. Tables and outcomes

Game results come from one of four resolver/outcome shapes: range-keyed
tables, degree-of-success thresholds, inline range arrays, and remote
table lookups.

### 5.1 `tables` section and `TableRange`

The spec-level `tables` map holds reusable tables keyed by name. Each is a
`TableDefinition` — `{ "ranges": TableRange[] }`
(`randsum.json:80-93`). A `TableRange` has:

- `result` — required. The string written back as the game result.
- `exact` — exact numeric match, OR
- `min` + `max` — inclusive range match, OR
- `poolCondition` — pool-count predicate (see §4.1).

At least one of `exact`, `(min,max)`, or `poolCondition` must be present
(`randsum.json:113-125`). `exact` is mutually exclusive with `min`/`max`.

Ranges are evaluated top-to-bottom; the first match wins. This is important:
put the more specific rows first (e.g. Blades puts the `poolCondition`
critical before the `exact: 6` success).

### 5.2 `outcomes` and range-to-result mapping

An `OutcomeOperation` wraps an outcome. The three shapes (§3.4) map to three
codegen paths in
`packages/games/src/lib/codegen/emitOutcome.ts`:

- `ranges` → a chain of `if (total === X) return ...` / `if (total >= X &&
  total <= Y) return ...` statements followed by a `throw new SchemaError(...,
  'NO_TABLE_MATCH')` (line 112-114). If the total falls outside every
  declared range, the roll throws.
- `degreeOfSuccess` → the same tiered fall-through documented at
  `emitOutcome.ts:5-33`. The _lowest_ declared degree acts as the default; if
  none is declared, codegen emits a `NO_TABLE_MATCH` throw.
- `tableLookup` → normalized into a range evaluation via the resolved
  `TableDefinition` (`packages/games/src/lib/normalizer.ts:61-69`).

Opaque vs. numeric results:

- When an `outcome` is present, the `result` field is a string literal union
  of every `result` value in the table. The generated type export (e.g.
  `BladesRollResult`) is that union.
- When `outcome` is _omitted_, `result` is the `total` number. Codegen emits
  `return { total, result: total, rolls: ... }` at
  `emitOutcome.ts:99`.

### 5.3 `remoteTableLookup` — build-time tables

The `remoteTableLookup` resolver embeds a remote JSON dataset into the
generated module. At codegen time, `packages/games/codegen.ts:59-84`
fetches the URL, writes the JSON to
`packages/games/__fixtures__/<shortcode>-tables.json` for the
`gen:check` CI path, and passes the dataset to the emitter. The generated
module ships with the full table baked into the JS bundle. At runtime the
module never hits the network.

The shape (`randsum.json:557-602`):

```json
"resolve": {
  "remoteTableLookup": {
    "url":       "https://salvageunion.io/schema/roll-tables.json",
    "find": {
      "field":        "name",
      "input":        "tableName",
      "errorMessage": "Invalid Salvage Union table name: \"${value}\""
    },
    "tableField":    "table",
    "resultMapping": { /* see below */ }
  }
}
```

- `url` is the JSON endpoint. Must return an array (or declare `dataPath` to
  point at a nested array).
- `find` tells the resolver which entry to pick. It matches `field` against
  the declared input `input`. `errorMessage` is a template with `${value}` as
  the placeholder — thrown as `SchemaError('NO_TABLE_MATCH')` if no entry
  matches.
- `tableField` names the field on the chosen entry whose value is the
  range-keyed table. Range keys follow `packages/games/src/lib/lookupByRange.ts`:
  either `"N"` (exact) or `"N-M"` (inclusive range), with negative numbers
  allowed.
- `resultMapping` composes the returned object from four sources documented
  in `randsum.json:604-657`:

  | Leaf                 | Source                                                                        |
  | -------------------- | ----------------------------------------------------------------------------- |
  | `{ "$lookupResult": "path" }` | Dot-path into the resolver result. Supports `fallback`.                |
  | `{ "$foundTable":  "field" }` | A field on the matched entry (e.g. the whole `table` object).          |
  | `{ "$input":       "name" }`  | Pass-through of a declared input.                                      |
  | `{ "expr":         "total" }` | The numeric roll total.                                                |

The Salvage Union spec illustrates every leaf type
(`packages/games/salvageunion.randsum.json:21-30`):

```json
"resultMapping": {
  "key":         { "$lookupResult": "key" },
  "label":       { "$lookupResult": "result.label", "fallback": { "$lookupResult": "key" } },
  "description": { "$lookupResult": "result.value" },
  "tableName":   { "$input": "tableName" },
  "table":       { "$foundTable": "table" },
  "roll":        { "expr": "total" }
}
```

### 5.4 `lookupByRange` helper

The only shared runtime helper used by generated code is
`packages/games/src/lib/lookupByRange.ts`. It iterates table keys, matches
them against `N` or `N-M` patterns, and returns `{ key, result }` where
`result` has optional `label` and `value` fields. Salvage Union's generated
module is the only current consumer; the helper is bundled with the game
that needs it.

If a table key doesn't match `N` or `N-M` (line 25 — the `RANGE_PATTERN` is
`/^(-?\d+)(?:-(-?\d+))?$/`), it's silently skipped. If the roll falls
outside every range, the helper returns `{ key: String(value), result: { label:
'No result' } }` — a live spec that depends on strict failure should not use
`$lookupResult` with `fallback` set to a default; it should assert the table
covers the full roll range.

---

## 6. Inputs

A roll definition declares runtime inputs in an `inputs` object
(`randsum.json:181-185`). Each entry is an `InputDeclaration`
(`randsum.json:328-368`). Declared inputs are the only things a spec can
bind with `$input`; any other usage is a schema error.

### 6.1 `InputDeclaration` shape

| Field         | Meaning                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| `type`        | Required. One of `"integer"`, `"string"`, `"boolean"`.                                       |
| `minimum`     | Integer inputs only. Generated code emits `validateRange` at the head of `roll`.             |
| `maximum`     | Integer inputs only. Same.                                                                    |
| `default`     | Value used when the caller omits the input.                                                   |
| `enum`        | Exhaustive list of allowed values (produces a TS string-literal union for string inputs).   |
| `optional`    | When true, the input can be omitted _even without_ a default — the generated parameter is `?`. |
| `description` | Human-readable; passed through to `validateFinite` / `validateRange` messages.              |

Integer inputs with `minimum` and `maximum` generate two validator calls —
`validateFinite` then `validateRange`
(`packages/games/src/blades.generated.ts:21-32`) — both of which throw
`ValidationError` (from
`packages/roller/src/errors.ts:87-92`) on failure.

String inputs with `enum` get a runtime check that throws
`SchemaError('INVALID_INPUT_TYPE')`
(`packages/games/src/daggerheart.generated.ts:31-38`).

### 6.2 `$input` bindings

Three forms (`randsum.json:875-910`, `packages/games/src/lib/types.ts:1-4`):

| Form                                                   | Use                                              |
| ------------------------------------------------------ | ------------------------------------------------ |
| Literal integer (`5`)                                  | Baseline.                                        |
| `{ "$input": "name" }`                                 | Bind to a declared integer input.                |
| `{ "$input": "flag", "ifTrue": 20, "ifFalse": 12 }`    | Dispatch an integer based on a boolean input.    |

The third form is what powers Daggerheart's "amplify" feature
(`daggerheart.randsum.json:21-22`): when `amplifyHope` is true, roll
a d20 instead of a d12.

### 6.3 Generated call signature

Codegen emits an overload that accepts both a positional primitive and a
single options object. Blades, with a single `rating` input, generates:

```ts
export function roll(rating?: number): GameRollResult<BladesRollResult, undefined, RollRecord>
export function roll(input?: { rating?: number }): ...
```

Multi-input games get the object form only
(`packages/games/src/daggerheart.generated.ts:21-26`). When every declared
input has a default or is `optional`, the parameter itself is optional. An
input without a default and without `optional: true` is required (Root RPG's
`bonus` in `packages/games/root-rpg.randsum.json:10` is the canonical
required example).

### 6.4 Inputs in `details`

The `details` field lets a spec attach typed metadata to the result. A
`DetailsLeafDef` (`randsum.json:735-837`) has five variants:

| Variant                                    | Produces                                                    |
| ------------------------------------------ | ----------------------------------------------------------- |
| `{ "$input": "name", "default": X }`       | Pass-through of an input (with default if omitted).         |
| `{ "expr": "diceTotal" }`                  | Raw sum of kept dice _before_ arithmetic modifiers.         |
| `{ "expr": "total" }`                      | Final total (after all modifiers).                          |
| `{ "$pool": "name", "field": "total" }`    | Total of a named pool from `dicePools`.                     |
| `{ "$conditionalPool": "name", "field": "total" }` | Total of a conditional pool (zero when not triggered). |
| `{ "$dieCheck": { ... } }`                 | Boolean comparison on one die by (pool-index, die-index).   |

`DetailsFieldDef` additionally supports nested objects and a `when/value`
shape that emits the nested object _only_ when an input is present. D&D 5e
uses this to attach `criticals.isNatural1` / `isNatural20` only when the
caller opts in via `crit: true`
(`packages/games/fifth.randsum.json:27-39`):

```json
"details": {
  "criticals": {
    "when": { "input": "crit" },
    "value": {
      "isNatural1":  { "$dieCheck": { "pool": 0, "field": "initial", "die": 0, "operator": "=", "value": 1 } },
      "isNatural20": { "$dieCheck": { "pool": 0, "field": "initial", "die": 0, "operator": "=", "value": 20 } }
    }
  }
}
```

The emitted `DaggerheartRollDetails` and similar types are the public contract
that downstream consumers rely on; changing a spec's `details` is a
semver-visible API change.

---

## 7. Common patterns — a cookbook

Eight patterns drawn from the six specs. Each one: the mechanic, the snippet,
and a pointer at the full spec for context.

### 7.1 Best-of-N action roll (Blades position/effect)

Roll a pool of d6s, keep the highest, map to critical / success / partial /
failure. The critical case is pool-count based (two or more 6s), so it lives
at the `tables`/`outcomes` level and triggers only when the underlying raw
pool has two sixes.

`packages/games/blades.randsum.json:13-54`:

```json
"tables": {
  "coreMechanic": {
    "ranges": [
      { "poolCondition": { "countWhere": { "operator": "=", "value": 6 }, "atLeast": 2 },
        "result": "critical" },
      { "exact": 6,         "result": "success" },
      { "min": 4, "max": 5, "result": "partial" },
      { "min": 1, "max": 3, "result": "failure" }
    ]
  }
},
"roll": {
  "dice":    { "pool": { "$ref": "#/pools/actionDice" }, "quantity": { "$input": "rating" } },
  "modify":  [{ "keepHighest": 1 }],
  "resolve": "sum",
  "outcome": { "$ref": "#/outcomes/coreMechanicOutcome" }
}
```

### 7.2 Zero-dice desperate override (Blades `rating: 0`)

When the action rating drops to zero, Blades rolls 2d6 and keeps the
_lowest_, and bypasses the critical row because no single-die critical is
possible. Expressed with `when`:

`packages/games/blades.randsum.json:55-63`:

```json
"when": [{
  "condition": { "input": "rating", "operator": "=", "value": 0 },
  "override": {
    "dice":    { "pool": { "$ref": "#/pools/actionDice" }, "quantity": 2 },
    "modify":  [{ "keepLowest": 1 }],
    "outcome": { "$ref": "#/outcomes/desperateActionOutcome" }
  }
}]
```

### 7.3 Advantage and disadvantage (D&D 5e)

The archetypal 2d20 keep-highest / keep-lowest pattern. Two `when` entries,
one per mode, each overriding just the `dice` and `modify` stages.

`packages/games/fifth.randsum.json:40-55`:

```json
"when": [
  {
    "condition": { "input": "rollingWith", "operator": "=", "value": "Advantage" },
    "override": {
      "dice":   { "pool": { "sides": 20 }, "quantity": 2 },
      "modify": [{ "keepHighest": 1 }, { "add": { "$input": "modifier" } }]
    }
  },
  {
    "condition": { "input": "rollingWith", "operator": "=", "value": "Disadvantage" },
    "override": {
      "dice":   { "pool": { "sides": 20 }, "quantity": 2 },
      "modify": [{ "keepLowest": 1 }, { "add": { "$input": "modifier" } }]
    }
  }
]
```

### 7.4 Natural 1 / natural 20 detection (D&D 5e)

The `$dieCheck` leaf produces a boolean against a specific die. Nested
inside a `when`-gated `details` object, it's emitted only when `crit: true`
is passed.

`packages/games/fifth.randsum.json:27-39` — see §6.4 for the snippet and
discussion.

### 7.5 Hope and Fear duel (Daggerheart)

Two named pools, resolved by comparing the highest single die between them;
a tie becomes `"critical hope"`.

`packages/games/daggerheart.randsum.json:20-42`:

```json
"dicePools": {
  "hope": { "pool": { "sides": { "$input": "amplifyHope", "ifTrue": 20, "ifFalse": 12 } } },
  "fear": { "pool": { "sides": { "$input": "amplifyFear", "ifTrue": 20, "ifFalse": 12 } } }
},
"resolve": {
  "comparePoolHighest": {
    "pools":    ["hope", "fear"],
    "ties":     "critical hope",
    "outcomes": { "hope": "hope", "fear": "fear" }
  }
}
```

The amplify inputs use the `$input`/`ifTrue`/`ifFalse` boolean dispatch
(§6.2).

### 7.6 Conditional extra die (Daggerheart advantage/disadvantage)

An extra d6 is rolled only when `rollingWith` is set. The value is added or
subtracted from the main total. The two pool names are referenced from
`details` so the extra d6 appears in the typed result.

`packages/games/daggerheart.randsum.json:24-35, 54-59`:

```json
"conditionalPools": {
  "advantage":    { "condition": { ... "Advantage" ... },    "pool": { "sides": 6 }, "arithmetic": "add" },
  "disadvantage": { "condition": { ... "Disadvantage" ... }, "pool": { "sides": 6 }, "arithmetic": "subtract" }
},
"details": {
  "extraDie": {
    "when": { "input": "rollingWith" },
    "value": {
      "advantageRoll":    { "$conditionalPool": "advantage",    "field": "total" },
      "disadvantageRoll": { "$conditionalPool": "disadvantage", "field": "total" }
    }
  }
}
```

### 7.7 2d6 + stat hit/miss (PbtA / Root RPG)

The genre-defining PbtA move — 2d6, add stat plus situational modifiers,
compare against 10+ / 7-9 / 6-. Root RPG is the minimal version
(`packages/games/root-rpg.randsum.json:12-22`):

```json
"dice":    { "pool": { "sides": 6 }, "quantity": 2 },
"resolve": "sum",
"modify":  [{ "add": { "$input": "bonus" } }],
"outcome": {
  "ranges": [
    { "min": 10, "max": 32, "result": "Strong Hit" },
    { "min": 7,  "max": 9,  "result": "Weak Hit" },
    { "min": -18, "max": 6, "result": "Miss" }
  ]
}
```

PbtA extends this with `forward` / `ongoing` modifiers and `Advantage` /
`Disadvantage` variants (`packages/games/pbta.randsum.json:16-60`).

### 7.8 Remote table lookup with input pick (Salvage Union)

A single d20 roll whose resolution is driven by a runtime-selected table
name. The table data is fetched at codegen time and baked into the module.

`packages/games/salvageunion.randsum.json:8-32` — full snippet in §5.3. The
cached dataset lives at `packages/games/__fixtures__/salvageunion-tables.json`
so `gen:check` can run offline.

---

## 8. Extending the schema

This guide documents the schema as it is today. If you sit down to write a
new game spec and discover that a mechanic cannot be expressed in the current
shape — a new modifier, a new resolver, a new `details` leaf — the correct
response is to extend the schema, not to reach for hand-written TypeScript.

ADR-002 (`docs/adr/ADR-002-code-generation-from-json-specs.md`) is the
overarching rationale. The concrete change set for any extension is:

1. Add the new JSON Schema fragment to `packages/games/randsum.json` with a
   clear description and, where possible, constraints that an IDE will
   surface as autocomplete hints.
2. Mirror the shape in `packages/games/src/lib/types.ts`.
3. Update the normalizer (`packages/games/src/lib/normalizer.ts`) if the
   new shape needs IR representation; add entries to
   `packages/games/src/lib/normalizedTypes.ts` as needed.
4. Update the emitter (one of the files under
   `packages/games/src/lib/codegen/`) to produce the runtime code.
5. Add a spec that exercises the new feature, regenerate, and add a test
   under `packages/games/__tests__/` that asserts the new behavior.
6. Run `bun run --filter @randsum/games check`.

A dedicated codegen extension guide should sit next to this file when that
work lands. A cross-link will be added here at that point.

Until then, the existing specs are the best teacher: if you need a new
mechanic, start by looking at what is _closest_ to it in the specs in
`packages/games/*.randsum.json` and read the corresponding generated code in
`packages/games/src/*.generated.ts` to understand what shape the emitter
needs to produce.

---

## 9. Validation errors

Two error classes surface problems in a spec or its inputs. Both extend
`RandsumError` from `@randsum/roller/errors`
(`packages/roller/src/errors.ts:50-60`).

### 9.1 `SchemaError`

Defined at `packages/games/src/lib/errors.ts:12-20`. Thrown from both the
codegen pipeline and generated runtime code. Carries one of the codes below:

| Code                      | Meaning                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `REF_NOT_FOUND`           | A `$ref` in a spec (or a nested pointer) did not resolve to a definition.                        |
| `INPUT_NOT_FOUND`         | A `$input` binding referenced an input that wasn't declared, or the caller omitted a required input. |
| `INVALID_INPUT_TYPE`      | An input value did not match its declared `type` or `enum`.                                      |
| `NO_TABLE_MATCH`          | A resolved total fell outside every `TableRange` (no fallthrough).                               |
| `CONDITION_TYPE_MISMATCH` | A `condition.value` did not match the referenced input's declared type.                          |
| `INVALID_SPEC`            | Generic spec-structure failure — the spec is not a valid `RandSumSpec`.                          |
| `EXTERNAL_REF_FAILED`     | An HTTP fetch for an external `$ref` or `remoteTableLookup` URL failed or returned a non-object at a pointer segment (see `packages/games/src/lib/externalRefResolver.ts:19-53`). |

A `NO_TABLE_MATCH` at runtime is the most common symptom of a logic bug in a
spec: an `outcome.ranges` or `degreeOfSuccess` stanza that doesn't cover
every possible resolved total. The emitted fall-through throw is at
`packages/games/src/lib/codegen/emitOutcome.ts:112-114`. Fix by widening
the range or adding a catch-all low-end entry (e.g. Root RPG's `-18` minimum
on the Miss row is a catch-all that covers negative stat-plus-dice
combinations).

### 9.2 `ValidationError`

Defined at `packages/roller/src/errors.ts:87-92`. Thrown from
`validateFinite`, `validateRange`, and related helpers at
`packages/roller/src/lib/utils/validation.ts:42-67`. Generated code calls
these at the top of every `roll` function — any integer input with `minimum`
or `maximum` produces two validator calls, and failure of either throws
`ValidationError`.

Example message (from `validateRange`): `Validation error: Blades rating must
be between 0 and 6, received: 7`. Includes a `context` object with `path`
(the input name) and `value` (the rejected value).

### 9.3 Ajv validation messages (build time)

`packages/games/src/lib/validator.ts` compiles the meta-schema at module
load and runs every spec through Ajv. Failures come out of
`codegen.ts:48-55` as a list of `{ path, message }` errors and abort the
build. Because `allErrors: true` is set, every failing constraint is
reported — not just the first. Common patterns:

- `/roll/dice: must match exactly one schema in oneOf` — you likely used
  both `dice` and `dicePools`, or passed an array of only one entry (the
  schema requires `minItems: 2` for the array form —
  `randsum.json:191-195`).
- `/roll/resolve: must match exactly one schema in oneOf` — a typo in a
  resolver key, or an object where `"sum"` was expected.
- `/roll/when/0/override: must have required property ...` — a
  `PipelineOverride` with no stages set. `minProperties: 1` is enforced at
  `randsum.json:294`.
- `/roll/outcome/ranges/0: must match a schema in anyOf` — a `TableRange`
  with neither `exact`, `(min,max)`, nor `poolCondition`
  (`randsum.json:115-119`).

### 9.4 How to read a validation failure

The `path` is a JSON Pointer into the offending spec. Open the spec, navigate
to the path, compare the shape at that point against the corresponding
`$defs` entry in `randsum.json`. Most failures are one of:

1. A mis-keyed object (typo in a modifier or resolver key).
2. A union constraint violation (`oneOf`, `anyOf`) — the shape matches more
   than one or none of the expected variants.
3. A cardinality constraint (`minItems`, `minProperties`).
4. A `$ref` pointing at a non-existent name.

When in doubt, run `bun run --filter @randsum/games gen` and read the Ajv
output verbatim. The error path is the fastest way to the broken field.

---

## Appendix A — Generated artifact

Every successful codegen run produces a `src/<shortcode>.generated.ts`
module with this consistent shape:

1. A banner comment: `// Auto-generated from <name> spec. Run \`bun run codegen\` to regenerate.`
2. Imports from `@randsum/roller/roll` and `@randsum/roller/validate`.
3. A string-literal union export for the result type (e.g.
   `export type BladesRollResult = 'critical' | 'failure' | 'partial' | 'success'`).
4. An interface export for `details` when the spec declares one
   (e.g. `DaggerheartRollDetails`).
5. A `roll` function export. For single-input integer specs, this has both a
   positional and an object-form overload.
6. Re-exports of `SchemaError`, `GameRollResult`, `RollRecord`, and
   `SchemaErrorCode`.

Read `packages/games/src/blades.generated.ts` (58 lines) as a primer and
`packages/games/src/daggerheart.generated.ts` as the more elaborate case
(`dicePools`, `conditionalPools`, `details`).

---

## Appendix B — Writing a new game spec: checklist

1. Create `packages/games/<shortcode>.randsum.json` with the required
   top-level fields (§2.1).
2. Declare `pools`, `tables`, and `outcomes` if you want named reusable
   entries (they're optional).
3. Write the `roll` pipeline: `dice` (or `dicePools`), `modify` (optional),
   `resolve` (required), `outcome` (optional).
4. Add `inputs` with typed declarations; use `$input` bindings throughout
   the pipeline.
5. Add `when` overrides for variant pipelines (advantage, desperate, etc.).
6. Add `details` to shape the typed output returned to callers.
7. Run `bun run --filter @randsum/games gen`. Fix any Ajv errors at their
   reported paths.
8. Read the generated module. Does the shape look right? If not, the spec
   is lying; fix it.
9. Add a subpath export in `packages/games/package.json` and a size-limit
   entry.
10. Write `packages/games/__tests__/<shortcode>.test.ts` and
    `.property.test.ts`.
11. Run `bun run --filter @randsum/games check`.

The full end-to-end guide lives in `packages/games/CLAUDE.md` under "Adding a
New Game" — it covers the `package.json` and test-scaffolding steps this
document skipped.
