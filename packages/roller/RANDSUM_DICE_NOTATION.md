# Randsum Dice Notation

> **Formal Specification:** For the complete taxonomy, classification system, conformance levels, and execution pipeline specification, see [RANDSUM_DICE_NOTATION_SPEC.md](../../RANDSUM_DICE_NOTATION_SPEC.md) at the repository root. This document is the notation syntax guide; the spec is the authoritative reference for implementers.

## Overview

Dice notation is a compact way to represent dice rolls and their modifications. For example, `4d20+2` means "roll four twenty-sided dice, then add two".

Randsum extends standard dice notation with powerful modifiers like dropping lowest rolls, rerolling specific values, and ensuring unique results.

The core `roll()` function accepts several argument types: a **number** (sides for a single die, e.g. `roll(20)` for 1d20), a **notation string** (e.g. `roll("4d6L")`), an **options object** (e.g. `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })`), or **multiple arguments** combined into one total (e.g. `roll("1d20", "2d6")`).

## Taxonomy

Every notation feature is classified as a **primitive**, **alias**, or **macro**:

- **Primitive** — irreducible behavior that cannot be expressed as a composition of other features
- **Alias** — notation convenience that maps to one or more primitives with identical observable behavior
- **Macro** — conditional dispatch to multiple primitives based on runtime state

Alias features are documented alongside the primitive they desugar to. Each alias section traces the exact desugaring.

> For the full faceted classification system (Pipeline Stages, Operational Verbs, Output Channels, and Conformance Levels), see the [Formal Specification](../../RANDSUM_DICE_NOTATION_SPEC.md).

### Dice Types

| Die          | Notation | Classification                           |
| ------------ | -------- | ---------------------------------------- |
| Standard     | `NdS`    | Primitive                                |
| Custom Faces | `d{...}` | Primitive                                |
| Geometric    | `gN`     | Primitive (unique generation model)      |
| Draw         | `DDN`    | Primitive (sampling without replacement) |
| Percentile   | `d%`     | Alias → `1d100`                          |
| Fate/Fudge   | `dF`     | Alias → `d3` + Replace                   |
| Zero-Bias    | `zN`     | Alias → `d{0..N-1}`                      |

### Modifiers (13 primitives, 8 alias, 1 macro)

**Value Modifiers (Clamp, Map verbs)** — transform individual die values in-place, no pool membership change:

| Modifier | Notation | Priority | Classification | Verb  |
| -------- | -------- | -------- | -------------- | ----- |
| Cap      | `C{...}` | 10       | Primitive      | Clamp |
| Replace  | `V{...}` | 30       | Primitive      | Map   |

**Pool Modifiers (Filter, Substitute verbs)** — change which dice remain in the pool or re-randomize their values:

| Modifier    | Notation           | Priority | Classification                     | Verb       |
| ----------- | ------------------ | -------- | ---------------------------------- | ---------- |
| Drop        | `L`, `H`, `D{...}` | 20       | Primitive                          | Filter     |
| Keep        | `K`, `kl`          | 21       | Alias → inverse of Drop            | Filter     |
| Keep Middle | `KM`               | 21       | Alias → Drop lowest + Drop highest | Filter     |
| Reroll      | `R{...}`           | 40       | Primitive                          | Substitute |
| Reroll Once | `ro{...}`          | 40       | Alias → `R{...}` with `max: 1`     | Substitute |
| Unique      | `U`                | 60       | Primitive                          | Substitute |

**Explosion Family (Generate, Accumulate verbs)** — add dice or accumulate values on max:

| Modifier         | Notation  | Priority | Classification                                                 | Verb       |
| ---------------- | --------- | -------- | -------------------------------------------------------------- | ---------- |
| Explode          | `!`       | 50       | Primitive (single-pass, adds dice to pool)                     | Generate   |
| Compound         | `!!`      | 51       | Primitive (accumulates into existing die, pool size preserved) | Accumulate |
| Penetrate        | `!p`      | 52       | Primitive (accumulates roll-1 into die)                        | Accumulate |
| Explode Sequence | `!s{...}` | 53       | Primitive (steps through die sizes)                            | Generate   |
| Inflation        | `!i`      | 53       | Alias → `!s{...}` going up TTRPG standard set                  | Generate   |
| Reduction        | `!r`      | 53       | Alias → `!s{...}` going down TTRPG standard set                | Generate   |
| Wild Die         | `W`       | 55       | Macro → compound on max, drop on 1, noop otherwise             | Dispatch   |

**Total Modifiers (Scale verb)** — arithmetic applied to the final number:

| Modifier          | Notation | Priority | Classification                            | Verb  |
| ----------------- | -------- | -------- | ----------------------------------------- | ----- |
| Multiply          | `*N`     | 85       | Primitive (pre-arithmetic)                | Scale |
| Plus              | `+N`     | 90       | Primitive                                 | Scale |
| Minus             | `-N`     | 91       | Alias → negative Plus                     | Scale |
| Margin of Success | `ms{N}`  | 91       | Alias → Minus N                           | Scale |
| Integer Divide    | `//N`    | 93       | Primitive                                 | Scale |
| Modulo            | `%N`     | 94       | Primitive                                 | Scale |
| Multiply Total    | `**N`    | 100      | Alias → Multiply at post-arithmetic phase | Scale |

**Counting Modifiers (Reinterpret verb)** — replace the aggregation model (sum to count):

| Modifier        | Notation | Priority | Classification                          | Verb        |
| --------------- | -------- | -------- | --------------------------------------- | ----------- |
| Count           | `#{...}` | 95       | Primitive                               | Reinterpret |
| Count Successes | `S{N}`   | 95       | Alias → Count with `greaterThanOrEqual` | Reinterpret |
| Count Failures  | `F{N}`   | 95       | Alias → Count with `lessThanOrEqual`    | Reinterpret |

**Display & Meta (Order verb)** — presentation and notation-level features:

| Feature     | Notation  | Priority | Classification                                 | Verb  |
| ----------- | --------- | -------- | ---------------------------------------------- | ----- |
| Sort        | `sa`/`sd` | 92       | Primitive (display only, no effect on total)   | Order |
| Annotations | `[text]`  | —        | Primitive (metadata)                           | —     |
| Repeat      | `xN`      | —        | Alias → parser expansion into N roll arguments | —     |

## Execution Pipeline

Modifiers execute in priority order. That ordering encodes three distinct stages, each marked by a capability flag in the modifier schema. Understanding the stages explains why certain modifiers must run before others and what it means for the pool to be "frozen".

### Three-Stage Model

```
Stage 1 — Deterministic Pool Shaping (priority 10-30)
  No randomness. Pure functions over the dice array.
  Modifiers: cap, replace, drop, keep
  Boundary signal: requiresRollFn = false

Stage 2 — Stochastic Pool Dynamics (priority 40-60)
  Introduces randomness. Every modifier here requires rollOne.
  Modifiers: reroll, explode, compound, penetrate, explodeSequence, unique, wildDie
  Boundary signal: requiresRollFn = true

Stage 3 — Total Derivation (priority 80-100)
  Pool is frozen. Operates on the computed total.
  Modifiers: count, multiply, plus, minus, integerDivide, modulo, multiplyTotal, sort
  Boundary signal: mutatesRolls = false
```

**Why stages matter for notation authors:** Modifiers in different stages have different contracts. A Stage 1 modifier (e.g., `C{<1}`) always sees the full initial roll result — it cannot depend on explosion outcomes. A Stage 2 modifier (e.g., `!`) operates on the pool as shaped by Stage 1, and may invoke the random function multiple times. Stage 3 modifiers never see individual dice — they operate only on the summed total that Stage 1 and Stage 2 produced.

The stage boundaries are not arbitrary conventions — they are structural facts encoded in `requiresRollFn` and `mutatesRolls`. A modifier with `requiresRollFn = true` cannot safely run in Stage 1 (where no roll function is available). A modifier with `mutatesRolls = false` has declared that it does not transform the dice array, which is the defining contract of Stage 3.

### The Verb Taxonomy

Within each stage, modifiers perform distinct verbs that describe what they do to the pool or total:

| Verb            | Stage | Modifiers                                                   | What it does                                           |
| --------------- | ----- | ----------------------------------------------------------- | ------------------------------------------------------ |
| **Clamp**       | 1     | cap                                                         | Constrain values to boundaries                         |
| **Map**         | 1     | replace                                                     | Deterministic value substitution                       |
| **Filter**      | 1     | drop, keep                                                  | Remove dice from pool (pool shrinks)                   |
| **Substitute**  | 2     | reroll, unique                                              | Re-randomize matching dice (pool size unchanged)       |
| **Generate**    | 2     | explode, explodeSequence                                    | Append new dice to pool (pool grows)                   |
| **Accumulate**  | 2     | compound, penetrate                                         | Fold explosion into existing die (pool size preserved) |
| **Scale**       | 3     | plus, minus, multiply, multiplyTotal, integerDivide, modulo | Arithmetic on the total                                |
| **Reinterpret** | 3     | count                                                       | Replace aggregation model (sum to cardinality)         |
| **Order**       | 3     | sort                                                        | Presentation-only reordering (no total effect)         |
| **Dispatch**    | 2     | wildDie                                                     | Runtime conditional branch (macro)                     |

**Dispatch** is a macro, not a primitive verb. `wildDie` branches at runtime: on a maximum roll it dispatches to Accumulate behavior; on a 1 it dispatches to Filter behavior; otherwise it is a no-op. It requires `rollOne` (Stage 2) because the accumulating explosion branch introduces randomness.

**Order** (`sort`) has no effect on the computed total. It reorders the dice array for display purposes only. Its presence in Stage 3 is correct by execution ordering — the pool is frozen before sort runs — but sort produces no arithmetic change.

**Reinterpret** (`count`) is the structural outlier. It uses the total channel but replaces the aggregation model rather than adjusting the sum arithmetically. It is the only modifier that changes what the total means rather than what the total is.

### Two-Channel Architecture

`ModifierApplyResult` exposes two output channels that never overlap within a single modifier:

- **Pool channel** (`rolls`) — modifiers that transform the dice array. Used by Stage 1 and Stage 2 modifiers. The resulting array is the input to the next modifier in priority order.
- **Total channel** (`transformTotal`) — modifiers that transform the computed sum. Used by Stage 3 modifiers. The pool is not touched.

The `mutatesRolls: false` flag on a modifier's schema is the code's declaration that it uses only the total channel. A modifier with `mutatesRolls: false` will never modify the dice array — the runtime passes the pool through unchanged and applies `transformTotal` to the sum instead.

No modifier uses both channels simultaneously. A modifier either shapes the pool or adjusts the total — never both.

## Basic Syntax

All notation in randsum is case-insensitive (`2d8` = `2D8`).

### Standard Rolls

| Notation | Description              |
| -------- | ------------------------ |
| `NdS`    | Roll N dice with S sides |
| `1d20`   | Roll one d20             |
| `4d6`    | Roll four d6             |

```typescript
// Roll one d20
roll(20) // number argument
roll("1d20") // notation string
roll({
  sides: 20,
  quantity: 1
})

// Roll four d6
roll("4d6")
roll({
  sides: 6,
  quantity: 4
})
```

## Special Dice

All special dice are valid dice notation — `isDiceNotation('4dF')`, `isDiceNotation('d%')`, `isDiceNotation('z6')`, `isDiceNotation('DD6')`, etc. all return `true`. The `tokenize()` function produces typed tokens for each special die type (`percentile`, `fate`, `zeroBias`, `geometric`, `draw`, `customFaces`).

In addition to standard `NdS` notation, `roll()` accepts shorthand string arguments for common special dice. Geometric dice (`gN`), draw dice (`DDN`), and zero-bias dice (`zN`) support inline modifiers. Percentile (`d%`), Fate (`dF`), and custom faces (`d{...}`) do not support inline notation modifiers — use the options object form for modified rolls.

### Custom Dice Faces (`d{...}`) — _primitive_

Define dice with arbitrary face values. All notation in randsum is case-insensitive.

| Notation                | Description                  |
| ----------------------- | ---------------------------- |
| `d{2,3,5,7}`            | Die with faces 2, 3, 5, 7    |
| `d{-1,0,1}`             | Die with negative/zero faces |
| `d{fire,ice,lightning}` | Die with string faces        |
| `3d{1,1,2}`             | 3 dice with weighted faces   |

```typescript
roll("d{2,3,5,7}") // Roll a die with faces 2, 3, 5, 7
roll({
  sides: [2, 3, 5, 7],
  quantity: 1
})

roll("d{-1,0,1}") // Die with negative and zero faces
roll({
  sides: [-1, 0, 1],
  quantity: 1
})

roll("d{fire,ice,lightning}") // Die with string faces
roll({
  sides: ["fire", "ice", "lightning"],
  quantity: 1
})

roll("3d{1,1,2}") // Three weighted dice (1 appears twice as often as 2)
roll({
  sides: [1, 1, 2],
  quantity: 3
})
```

**How it works:** The faces listed inside the braces define the exact values that can appear on each roll. Duplicate values create weighted distributions — `d{1,1,2}` has a 2/3 chance of rolling 1 and a 1/3 chance of rolling 2.

**String faces:** When faces are non-numeric strings, the roll result contains string values rather than numbers. The total for string-faced dice is not summed numerically.

**Use cases:** Custom damage type dice (fire/ice/lightning), narrative dice (success/failure/complication), weighted probability dice, or any die with non-standard faces.

### Zero-Bias Dice (`zN`) — _alias → d{0..N-1}_

Zero-indexed dice that roll 0 to N-1 instead of 1 to N. All notation in randsum is case-insensitive.

| Notation | Description                 |
| -------- | --------------------------- |
| `zN`     | Zero-indexed die (0 to N-1) |
| `z6`     | Roll 0-5 instead of 1-6     |
| `3z10`   | Three zero-bias d10s (0-9)  |

```typescript
roll("z6") // Roll 0-5
roll("3z10") // Three dice, each 0-9
roll("z100") // Zero-indexed percentile: 0-99
```

> **Note:** Zero-bias dice are notation-only -- there is no options object equivalent. Use the notation string form `roll('z6')` or construct faces manually: `roll({ sides: [0, 1, 2, 3, 4, 5] })`.

**How it works:** A zero-bias die with N sides produces values from 0 to N-1 instead of the standard 1 to N. Internally, the roller maps this to a standard die with replace modifiers. This is equivalent to rolling a standard die and subtracting 1, but expressed as a first-class notation for clarity.

**Use cases:** Zero-indexed random table lookups, percentile systems that use 0-99, programming-friendly dice for array index selection, or any system where a 0-based range is more natural.

### Geometric Die (`gN`) — _primitive_

A geometric die rolls dN repeatedly until a 1 appears, and the result is the number of rolls it took. This models waiting times and geometric distributions.

| Notation | Description                             |
| -------- | --------------------------------------- |
| `gN`     | Roll dN until 1 appears, result = count |
| `3gN`    | Three independent geometric rolls       |

```typescript
roll("g6") // Roll d6 until 1 appears, return attempt count (average: 6)
roll("3g6") // Three independent geometric d6 rolls
roll("G6") // Case-insensitive
```

Internally, `gN` sets the `geometric: true` flag on `RollParams`. A safety cap of 1000 iterations prevents infinite loops.

**Use cases:** Resource depletion tracking, chase mechanics, random encounter distance, survival countdowns.

### Draw Die (`DDN`) — _primitive_

A draw die samples without replacement from a pool of faces — like drawing cards from a deck. Each face value can only appear once until the pool is exhausted, at which point it reshuffles.

| Notation | Description                                      |
| -------- | ------------------------------------------------ |
| `DDN`    | Draw one unique value from [1..N]                |
| `3DDN`   | Draw 3 unique values from [1..N]                 |
| `6DD6`   | Always a permutation of [1,2,3,4,5,6]            |
| `8DD6`   | Full permutation of [1..6] + 2 more (reshuffles) |

```typescript
roll("DD6") // Draw one from d6 pool (1-6, each face unique)
roll("3DD6") // Draw 3 unique values from [1..6]
roll("6DD6") // Always a permutation of [1,2,3,4,5,6]
roll("8DD6") // Full permutation + 2 more (reshuffles after exhaustion)
roll("dd6") // Case-insensitive: DD, dd, Dd, dD all work
```

Internally, `DDN` sets the `draw: true` flag on `RollParams` and uses Fisher-Yates shuffle for uniform distribution.

**Use cases:** Card-deck mechanics, random encounter tables without repeats, draft picks, Catan-style resource distribution.

### Percentile Die (`d%`) — _alias → 1d100_

A percentile die rolls 1-100. Used in Call of Cthulhu, Warhammer Fantasy, and any system with percentage-based resolution.

| Argument | Equivalent  | Description   |
| -------- | ----------- | ------------- |
| `'d%'`   | `roll(100)` | Roll one d100 |

```typescript
roll("d%") // Roll 1d100
roll("D%") // Case-insensitive
roll(100) // Equivalent numeric form
roll("1d100") // Equivalent notation form
```

Internally, `'d%'` maps to `{ quantity: 1, sides: 100 }`.

`d%` does not support a quantity prefix. To roll multiple percentile dice, pass multiple arguments:

```typescript
roll("d%", "d%") // Two percentile dice
```

### Fate/Fudge Dice (`dF`) — _alias → d3 + Replace_

Fate dice (also called Fudge dice) produce results of -1, 0, or +1 per die. The standard Fate Core roll is `4dF`, giving a range of -4 to +4. An extended variant (`dF.2`) uses five faces: -2, -1, 0, +1, +2.

| Argument  | Faces             | Range per die | Description               |
| --------- | ----------------- | ------------- | ------------------------- |
| `'dF'`    | -1, 0, +1         | -1 to +1      | Standard Fate/Fudge die   |
| `'dF.1'`  | -1, 0, +1         | -1 to +1      | Explicit standard variant |
| `'dF.2'`  | -2, -1, 0, +1, +2 | -2 to +2      | Extended Fudge die        |
| `'4dF'`   | -1, 0, +1         | -4 to +4      | Standard Fate Core roll   |
| `'4dF.2'` | -2, -1, 0, +1, +2 | -8 to +8      | Four extended dice        |

```typescript
roll("dF") // One Fate die: -1, 0, or +1
roll("4dF") // Standard Fate Core roll (4 dice, range -4 to +4)
roll("dF.1") // Same as 'dF' — explicit standard variant
roll("dF.2") // Extended Fudge die: -2, -1, 0, +1, or +2
roll("4dF.2") // Four extended dice (range -8 to +8)
roll("Df") // Case-insensitive
```

Fate dice can be mixed with other roll arguments:

```typescript
roll("4dF", "2d6", 20) // Fate dice + 2d6 + 1d20, totals combined
```

Internally, `dF` uses the replace modifier to map die faces to negative and zero values. `'dF'` rolls a d3 with replacements `{ 1 -> -1, 2 -> 0, 3 -> 1 }`. `'dF.2'` rolls a d5 with replacements `{ 1 -> -2, 2 -> -1, 3 -> 0, 4 -> 1, 5 -> 2 }`. The `notation` field on the resulting `RollRecord` preserves the original `dF` form (e.g., `"4dF"`) rather than the expanded d3/d5 notation.

**Note:** To apply modifiers to Fate dice (e.g., keep highest), use the options object form directly rather than appending modifiers to the `'dF'` string. Neither `d%` nor `dF` support inline notation modifiers — there is no `d%L` or `4dFkh3`.

## Modifiers

### Basic Arithmetic — _primitive (Plus), alias (Minus)_

| Notation | Description           |
| -------- | --------------------- |
| `+N`     | Add N to total        |
| `-N`     | Subtract N from total |

```typescript
roll("4d6+2") // Add 2 to total
roll({
  sides: 6,
  quantity: 4,
  modifiers: { plus: 2 }
})

roll("4d6-1") // Subtract 1 from total
roll({
  sides: 6,
  quantity: 4,
  modifiers: { minus: 1 }
})
```

### Cap Modifiers — _primitive_

Limit roll values to specific ranges:

| Notation   | Description                                    |
| ---------- | ---------------------------------------------- |
| `C{>N}`    | Cap rolls over N down to N                     |
| `C{<N}`    | Cap rolls under N up to N                      |
| `C{>=N}`   | Cap rolls at or over N down to N               |
| `C{<=N}`   | Cap rolls at or under N up to N                |
| `C{N}`     | Cap rolls above N to N (bare number = max cap) |
| `C{=N}`    | Same as `C{N}` — explicit equals syntax        |
| `C{<N,>M}` | Cap both ends: floor N, ceiling M              |

**Comparison operators:** All condition-based modifiers (`C`, `D`, `R`) support:

- `>N` — strictly greater than N
- `<N` — strictly less than N
- `>=N` — greater than or equal to N
- `<=N` — less than or equal to N
- `=N` or bare `N` — exactly equal to N (behavior depends on modifier)

```typescript
roll("4d20C{>18}") // Cap rolls over 18 to 18
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: { greaterThan: 18 }
  }
})

roll("4d20C{<3}") // Cap rolls under 3 to 3
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: { lessThan: 3 }
  }
})

roll("4d20C{>=18}") // Cap rolls at or over 18 to 18
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: { greaterThanOrEqual: 18 }
  }
})

roll("4d20C{<=3}") // Cap rolls at or under 3 to 3
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: { lessThanOrEqual: 3 }
  }
})

// Bare number: cap max at 5 (no roll can exceed 5)
roll("4d6C{5}")
roll("4d6C{=5}") // Same as above — explicit = syntax
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    cap: { exact: [5] } // exact values act as a max cap
  }
})

roll("4d20C{<2,>19}") // Cap rolls under 2 to 2 and over 19 to 19
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    cap: {
      greaterThan: 19,
      lessThan: 2
    }
  }
})
```

### Drop Modifiers — _primitive_

Drop specific dice from the results:

| Notation     | Description                      |
| ------------ | -------------------------------- |
| `L`          | Drop lowest 1                    |
| `LN`         | Drop lowest N                    |
| `H`          | Drop highest 1                   |
| `HN`         | Drop highest N                   |
| `LH`         | Drop lowest 1 and highest 1      |
| `D{>N}`      | Drop all rolls over N            |
| `D{>=N}`     | Drop all rolls at or over N      |
| `D{<N}`      | Drop all rolls under N           |
| `D{<=N}`     | Drop all rolls at or under N     |
| `D{X,Y,...}` | Drop exact values                |
| `D{=X,=Y}`   | Drop exact values (explicit `=`) |

```typescript
roll("4d6L") // Drop lowest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { lowest: 1 } }
})

roll("4d6L2") // Drop 2 lowest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { lowest: 2 } }
})

roll("4d6H") // Drop highest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { highest: 1 } }
})

roll("4d6H2") // Drop 2 highest
roll({
  sides: 6,
  quantity: 4,
  modifiers: { drop: { highest: 2 } }
})

roll("4d6LH") // Drop both lowest and highest

// Drop by value
roll("4d20D{>17}") // Drop rolls over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { greaterThan: 17 } }
})

roll("4d20D{>=17}") // Drop rolls at or over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { greaterThanOrEqual: 17 } }
})

roll("4d20D{<5}") // Drop rolls under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { lessThan: 5 } }
})

roll("4d20D{<=5}") // Drop rolls at or under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { lessThanOrEqual: 5 } }
})

roll("4d20D{8,12}") // Drop 8s and 12s (bare numbers = exact match)
roll("4d20D{=8,=12}") // Same — explicit = syntax
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { exact: [8, 12] } }
})
```

**Note:** `L` and `H` can be combined in one notation string. `4d6LH` drops the lowest die and the highest die, leaving 2 of the original 4.

### Reroll Modifiers — _primitive_

Reroll dice matching certain conditions:

| Notation   | Description                               |
| ---------- | ----------------------------------------- |
| `R{>N}`    | Reroll results over N                     |
| `R{>=N}`   | Reroll results at or over N               |
| `R{<N}`    | Reroll results under N                    |
| `R{<=N}`   | Reroll results at or under N              |
| `R{X,Y}`   | Reroll exact values X and Y               |
| `R{=X,=Y}` | Reroll exact values (explicit `=` syntax) |
| `R{<N}M`   | Reroll under N, max M total rerolls       |

```typescript
roll("4d20R{>17}") // Reroll results over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { greaterThan: 17 } }
})

roll("4d20R{>=17}") // Reroll results at or over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { greaterThanOrEqual: 17 } }
})

roll("4d20R{<5}") // Reroll results under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { lessThan: 5 } }
})

roll("4d20R{<=5}") // Reroll results at or under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { lessThanOrEqual: 5 } }
})

roll("4d20R{8,12}") // Reroll 8s and 12s (bare numbers = exact match)
roll("4d20R{=8,=12}") // Same — explicit = syntax
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { exact: [8, 12] } }
})

roll("4d20R{<5}3") // Reroll under 5, max 3 attempts
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    reroll: {
      lessThan: 5,
      max: 3
    }
  }
})
```

**Note:** The max count in `R{<N}M` caps the total number of rerolls across the entire dice pool, not per die.

### Reroll Once — _alias → Reroll with max=1_

Reroll once is shorthand for rerolling with a maximum of 1 attempt. All notation in randsum is case-insensitive.

| Notation  | Description                      |
| --------- | -------------------------------- |
| `ro{N}`   | Reroll exact value N, max 1 time |
| `ro{<N}`  | Reroll under N, max 1 time       |
| `ro{<=N}` | Reroll at or under N, max 1 time |
| `ro{>N}`  | Reroll over N, max 1 time        |
| `ro{>=N}` | Reroll at or over N, max 1 time  |

```typescript
roll("2d20ro{1}") // Reroll 1s once (Great Weapon Fighting lite)
roll({
  sides: 20,
  quantity: 2,
  modifiers: {
    reroll: { exact: [1], max: 1 }
  }
})

roll("4d6ro{<3}") // Reroll under 3, max 1 attempt
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    reroll: { lessThan: 3, max: 1 }
  }
})
```

**Alias equivalence:** `ro{...}` is alias for `R{...}1`. For example, `4d6ro{<3}` is identical to `4d6R{<3}1`.

**Use cases:** D&D 5e Savage Attacker feat, Great Weapon Fighting (reroll 1s and 2s once per die), or any system where you want a single reroll chance without unlimited retries.

### Replace Modifiers — _primitive_

Replace specific results with new values:

| Notation     | Description                                    |
| ------------ | ---------------------------------------------- |
| `V{X=Y}`     | Replace value X with Y                         |
| `V{>N=Y}`    | Replace results over N with Y                  |
| `V{>=N=Y}`   | Replace results at or over N with Y            |
| `V{<N=Y}`    | Replace results under N with Y                 |
| `V{<=N=Y}`   | Replace results at or under N with Y           |
| `V{X=Y,A=B}` | Replace X with Y and A with B (multiple rules) |

```typescript
roll("4d20V{8=12}") // Replace 8s with 12s
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: 8,
      to: 12
    }
  }
})

roll("4d20V{>17=20}") // Replace results over 17 with 20
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: { greaterThan: 17 },
      to: 20
    }
  }
})

roll("4d20V{<5=1}") // Replace results under 5 with 1
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: { lessThan: 5 },
      to: 1
    }
  }
})

roll("4d20V{>=18=20}") // Replace results at or over 18 with 20
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: { greaterThanOrEqual: 18 },
      to: 20
    }
  }
})

roll("4d20V{<=3=1}") // Replace results at or under 3 with 1
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    replace: {
      from: { lessThanOrEqual: 3 },
      to: 1
    }
  }
})

roll("4d20V{1=6,2=5}") // Replace 1s with 6s and 2s with 5s
```

**Note:** Multiple replacement rules can be specified in a single `V{}` block by comma-separating them. Rules are applied in order.

### Unique Results — _primitive_

Force unique rolls within a pool:

| Notation | Description                             |
| -------- | --------------------------------------- |
| `U`      | All results must be unique              |
| `U{X,Y}` | Unique except values X and Y may repeat |

```typescript
roll("4d20U") // All results must be unique
roll({
  sides: 20,
  quantity: 4,
  modifiers: { unique: true }
})

roll("4d20U{5,10}") // Unique except 5s and 10s can repeat
roll({
  sides: 20,
  quantity: 4,
  modifiers: {
    unique: { notUnique: [5, 10] }
  }
})
```

### Keep Modifiers — _alias → inverse of Drop_

Keep specific dice from the result (complement to drop):

| Notation | Description    |
| -------- | -------------- |
| `K`      | Keep highest 1 |
| `KN`     | Keep highest N |
| `kl`     | Keep lowest 1  |
| `klN`    | Keep lowest N  |

```typescript
roll("4d6K3") // Keep highest 3
roll({
  sides: 6,
  quantity: 4,
  modifiers: { keep: { highest: 3 } }
})

roll("4d6K") // Keep highest 1
roll({
  sides: 6,
  quantity: 4,
  modifiers: { keep: { highest: 1 } }
})

roll("4d6kl2") // Keep lowest 2
roll({
  sides: 6,
  quantity: 4,
  modifiers: { keep: { lowest: 2 } }
})

roll("4d6kl") // Keep lowest 1
roll({
  sides: 6,
  quantity: 4,
  modifiers: { keep: { lowest: 1 } }
})
```

**Note:** Keeping N highest is equivalent to dropping (quantity - N) lowest. For example, `4d6K3` is the same as `4d6L1`.

### Keep Middle — _alias → Drop lowest + Drop highest_

Keep middle dice by dropping equal numbers from both ends. All notation in randsum is case-insensitive.

| Notation | Description                               |
| -------- | ----------------------------------------- |
| `KM`     | Keep middle (drop 1 lowest + 1 highest)   |
| `KMN`    | Keep middle N (drop N lowest + N highest) |

```typescript
roll("5d6KM") // Keep middle 3 (drop 1 lowest + 1 highest)
roll({
  sides: 6,
  quantity: 5,
  modifiers: {
    drop: { lowest: 1, highest: 1 }
  }
})

roll("7d8KM2") // Keep middle 3 (drop 2 lowest + 2 highest)
roll({
  sides: 8,
  quantity: 7,
  modifiers: {
    drop: { lowest: 2, highest: 2 }
  }
})
```

**Alias equivalence:** `KM` is alias for `LH` (drop 1 lowest + 1 highest). `KMN` is alias for `LNHN` (drop N lowest + N highest). For example, `5d6KM` is identical to `5d6LH`, and `7d8KM2` is identical to `7d8L2H2`.

**Use cases:** Systems that want a median-biased result, trimming outliers from both ends of the roll.

### Exploding Dice — _primitive_

Roll additional dice on maximum results:

| Notation | Description                       |
| -------- | --------------------------------- |
| `!`      | Explode once per die on max value |

```typescript
roll("4d20!") // Roll an extra d20 for each 20 rolled
roll({
  sides: 20,
  quantity: 4,
  modifiers: { explode: true }
})
```

**How it works:** When a die shows its maximum value, a new die is rolled and added to the pool. This is a single pass — newly added dice are not checked for further explosions. Use compound (`!!`) or penetrate (`!p`) for recursive chaining.

**Example:** `3d6!` rolls [6, 4, 6]. The two 6s explode, adding [5, 3]. Final result: [6, 4, 6, 5, 3] = 24.

### Conditional Explode (`!{condition}`) — _extension of Explode primitive_

Explode on a configurable condition instead of only on the maximum value. Uses the same Condition Expression syntax as Cap, Drop, Reroll, and Count.

| Notation | Description                    |
| -------- | ------------------------------ |
| `!{>=N}` | Explode when result >= N       |
| `!{>N}`  | Explode when result > N        |
| `!{=N}`  | Explode on exact value N       |
| `!{N,M}` | Explode on exact values N or M |

Bare `!` is sugar for `!{=max}` (trigger on maximum face value).

```typescript
roll("5d10!{>=8}") // World of Darkness 8-again: explode on 8, 9, or 10
roll("5d10!{=10}") // World of Darkness 10-again: explode only on 10
roll("4d6!{>=5}") // Explode on 5 or 6
roll({
  sides: 10,
  quantity: 5,
  modifiers: { explode: { greaterThanOrEqual: 8 } }
})
```

### Compounding Exploding (!!) — _primitive_

Exploding dice that add to the triggering die instead of creating new dice:

| Notation | Description                            |
| -------- | -------------------------------------- |
| `!!`     | Compound once per die on max value     |
| `!!N`    | Compound with max depth N              |
| `!!0`    | Compound unlimited (capped internally) |

```typescript
roll("3d6!!") // Compound explode: add to die instead of new dice
roll({
  sides: 6,
  quantity: 3,
  modifiers: { compound: true }
})

roll("3d6!!5") // Compound explode with max depth of 5
roll({
  sides: 6,
  quantity: 3,
  modifiers: { compound: 5 }
})

roll("3d6!!0") // Compound explode unlimited (capped at 1000)
roll({
  sides: 6,
  quantity: 3,
  modifiers: { compound: 0 }
})
```

**How it works:** When a die shows its maximum value, it compounds - a new roll is added **directly to that die's value**. Unlike regular exploding, this doesn't create new dice; it modifies the existing die.

**Example:** `1d6!!` rolls 6. This compounds, rolling 4. The die value becomes 6 + 4 = 10. If that 4 had been a 6, it would compound again: 6 + 6 + 3 = 15.

**Use cases:** Compounding is useful in systems where you want explosive growth on a single die value rather than multiple dice. Common in damage systems where a critical hit adds to the base damage value.

**Differences from Explode:**

- **Explode (`!`)**: Creates new dice → `[6, 4, 6]` becomes `[6, 4, 6, 5, 3]` (5 dice)
- **Compound (`!!`)**: Modifies existing die → `[6, 4, 6]` becomes `[15, 4, 12]` (still 3 dice)

### Conditional Compound (`!!{condition}`) — _extension of Compound primitive_

Compound on a configurable condition instead of only on the maximum value.

| Notation  | Description               |
| --------- | ------------------------- |
| `!!{>=N}` | Compound when result >= N |
| `!!{>N}`  | Compound when result > N  |
| `!!{=N}`  | Compound on exact value N |
| `!!{N,M}` | Compound on values N or M |

Bare `!!` is sugar for `!!{=max}` (trigger on maximum face value).

```typescript
roll("3d6!!{>=5}") // Compound when result is 5 or 6
roll("3d6!!{=6}") // Compound only on maximum (same as bare !!)
roll({
  sides: 6,
  quantity: 3,
  modifiers: { compound: { greaterThanOrEqual: 5 } }
})
```

### Penetrating Exploding (!p) — _primitive_

Exploding dice where each subsequent explosion subtracts 1 (Hackmaster-style):

| Notation | Description                             |
| -------- | --------------------------------------- |
| `!p`     | Penetrate once per die on max value     |
| `!pN`    | Penetrate with max depth N              |
| `!p0`    | Penetrate unlimited (capped internally) |

```typescript
roll("3d6!p") // Penetrate explode: subtract 1 from subsequent rolls
roll({
  sides: 6,
  quantity: 3,
  modifiers: { penetrate: true }
})

roll("3d6!p5") // Penetrate with max depth of 5
roll({
  sides: 6,
  quantity: 3,
  modifiers: { penetrate: 5 }
})

roll("3d6!p0") // Penetrate unlimited (capped at 1000)
roll({
  sides: 6,
  quantity: 3,
  modifiers: { penetrate: 0 }
})
```

**How it works:** When a die shows its maximum value, it penetrates - a new roll is made, but 1 is subtracted from the result before adding. Each subsequent penetration also subtracts 1. The subtracted value has a minimum of 1 (a roll of 1 becomes 1, not 0), preventing negative contributions. This creates a diminishing return effect.

**Example:** `1d6!p` rolls 6. This penetrates, rolling 5. The value added is 5 - 1 = 4, so the die becomes 6 + 4 = 10. If that roll had been a 6, it would penetrate again: roll 3, subtract 1 = 2, so the die becomes 6 + 4 + 2 = 12.

**Use cases:** Penetrating dice are used in Hackmaster and similar systems where you want explosive results but with diminishing returns to prevent unlimited growth.

**Comparison:**

- **Explode (`!`)**: `[6]` → `[6, 6, 4]` = 16 (new dice added)
- **Compound (`!!`)**: `[6]` → `[16]` = 16 (die value modified)
- **Penetrate (`!p`)**: `[6]` → `[12]` = 12 (6 + (6-1) + (3-1) if it keeps penetrating, die value modified with -1 on each subsequent roll)

### Conditional Penetrate (`!p{condition}`) — _extension of Penetrate primitive_

Penetrate on a configurable condition instead of only on the maximum value.

| Notation  | Description                |
| --------- | -------------------------- |
| `!p{>=N}` | Penetrate when result >= N |
| `!p{>N}`  | Penetrate when result > N  |
| `!p{=N}`  | Penetrate on exact value N |
| `!p{N,M}` | Penetrate on values N or M |

Bare `!p` is sugar for `!p{=max}` (trigger on maximum face value).

```typescript
roll("3d6!p{>=5}") // Penetrate when result is 5 or 6
roll("3d6!p{=6}") // Penetrate only on maximum (same as bare !p)
roll({
  sides: 6,
  quantity: 3,
  modifiers: { penetrate: { greaterThanOrEqual: 5 } }
})
```

### Explode Sequence — _primitive_

Explode through a sequence of die sizes rather than reusing the same die. All notation in randsum is case-insensitive.

| Notation    | Description                                        |
| ----------- | -------------------------------------------------- |
| `!s{4,6,8}` | Explode through sequence of die sizes 4, 6, 8      |
| `!i`        | Inflation: explode UP through TTRPG standard set   |
| `!r`        | Reduction: explode DOWN through TTRPG standard set |

**TTRPG standard die set:** `[4, 6, 8, 10, 12, 20, 100]`

```typescript
roll("1d6!s{4,6,8,10}") // On max, explode with d4, then d6, then d8, then d10
roll({
  sides: 6,
  quantity: 1,
  modifiers: {
    explodeSequence: [4, 6, 8, 10]
  }
})

roll("1d6!i") // Inflation: on d6, start at next size up (d8, d10, d12, d20, d100)
roll({
  sides: 6,
  quantity: 1,
  modifiers: {
    explodeSequence: [8, 10, 12, 20, 100]
  }
})

roll("1d20!r") // Reduction: on d20, start at next size down (d12, d10, d8, d6, d4)
roll({
  sides: 20,
  quantity: 1,
  modifiers: {
    explodeSequence: [12, 10, 8, 6, 4]
  }
})
```

**How it works:** When a die shows its maximum value, it explodes using the next die size in the sequence rather than the same size. Each subsequent explosion uses the next die in the list. When the end of the sequence is reached, the final die size repeats (with the standard safety cap to prevent infinite loops).

**Example:** `1d6!s{4,8,12}` rolls a d6 and gets 6 (max). This explodes as a d4, rolling 4 (max). That explodes as a d8, rolling 5. Final result: 6 + 4 + 5 = 15. If the d8 had also been max (8), it would explode as a d12 (the final die), and d12 would repeat for any further explosions.

**Inflation (`!i`):** Starts at the next TTRPG standard die size above the current die and works upward. For a d6, the sequence is d8, d10, d12, d20, d100. Each explosion steps to the next larger die.

**Reduction (`!r`):** Starts at the next TTRPG standard die size below the current die and works downward. For a d20, the sequence is d12, d10, d8, d6, d4. Each explosion steps to the next smaller die.

**Use cases:** Rifts Mega-Damage, stepladder explosion systems, or any homebrew where escalating (or de-escalating) die sizes on explosions adds dramatic tension.

### Pre-Arithmetic Multiplier (*) — *primitive\*

Multiply the dice sum before adding/subtracting arithmetic modifiers:

| Notation | Description                                    |
| -------- | ---------------------------------------------- |
| `*N`     | Multiply dice sum by N (before +/- arithmetic) |

```typescript
roll("2d6*2+3") // (dice sum * 2) + 3
roll({
  sides: 6,
  quantity: 2,
  modifiers: {
    multiply: 2,
    plus: 3
  }
})

roll("4d6*3") // Multiply dice sum by 3
roll({
  sides: 6,
  quantity: 4,
  modifiers: { multiply: 3 }
})
```

**How it works:** The multiplier is applied to the sum of all dice after other modifiers (drop, keep, explode, etc.) but **before** `plus`/`minus` arithmetic modifiers are applied.

**Order of operations:** `(dice sum × multiply) ± plus/minus`

**Example:** `2d6*2+3` rolls [4, 5] = 9. Multiplied by 2 = 18. Plus 3 = 21.

**Use cases:** Critical hits that double or triple base damage before modifiers. Or systems where dice are multiplied before bonuses are added.

### Count Successes (S{N}) — _alias → Count with greaterThanOrEqual_

> **Alias equivalence:** `S{7}` is identical to `#{>=7}`. `S{7,1}` is identical to `#{>=7,<=1}` with deduct mode.
>
> **Implementation note:** `S{N}` parses directly into `{ count: { greaterThanOrEqual: N } }` — the same `count` key used by the `#{}` primitive. The `countSuccessesBehavior` defined in `src/lib/modifiers/behaviors/countSuccesses.ts` is dead code: `countSuccessesModifier` is never registered in `RANDSUM_MODIFIERS`. All execution flows through `countBehavior`.

Count dice meeting a threshold instead of summing values. Used in dice pool systems like World of Darkness and Shadowrun:

| Notation | Description                                 |
| -------- | ------------------------------------------- |
| `S{N}`   | Count dice that rolled >= N                 |
| `S{N,B}` | Count successes >= N, subtract botches <= B |

**Important:** `S` only accepts plain integer thresholds — comparison operators (`>`, `<`, `>=`, `<=`) are **not** supported inside `S{}`. Use `S{7}`, not `S{>7}`.

```typescript
roll("5d10S{7}") // Count how many dice rolled >= 7
// Equivalent options-object form (S{N} is an alias — use the count key):
roll({
  sides: 10,
  quantity: 5,
  modifiers: {
    count: { greaterThanOrEqual: 7 }
  }
})

// With botch threshold (successes - botches)
roll("5d10S{7,1}") // Count successes >= 7, subtract botches <= 1
// Equivalent options-object form:
roll({
  sides: 10,
  quantity: 5,
  modifiers: {
    count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true }
  }
})
```

**How it works:** Instead of summing dice values, the total becomes a count of dice that meet or exceed the threshold. If a botch threshold is specified, dice at or below that value are counted as botches and subtracted from the success count. Execution is handled entirely by the `count` modifier (`countBehavior`) — `S{N}` is parse-time alias only.

**Example:** `5d10S{7}` rolls [8, 3, 10, 6, 9]. Successes >= 7: [8, 10, 9] = 3 successes.

**Example with botch:** `5d10S{7,1}` rolls [8, 1, 10, 1, 9]. Successes >= 7: 3, Botches <= 1: 2. Result = 3 - 2 = 1.

**Use cases:** World of Darkness, Shadowrun, and other dice pool systems where you count successes rather than sum values.

### Sort (sa/sd) — _primitive (display only)_

Sort dice results for display purposes:

| Notation | Description     |
| -------- | --------------- |
| `sa`     | Sort ascending  |
| `sd`     | Sort descending |

```typescript
roll("4d6sa") // Sort results ascending
roll({
  sides: 6,
  quantity: 4,
  modifiers: { sort: "asc" }
})

roll("4d6sd") // Sort results descending
roll({
  sides: 6,
  quantity: 4,
  modifiers: { sort: "desc" }
})
```

**How it works:** Sort reorders the dice results for display without changing the total. Useful for readability when reviewing large pools.

### Integer Division (//N) — _primitive_

Integer divide the total, truncating toward zero:

| Notation | Description                                            |
| -------- | ------------------------------------------------------ |
| `//N`    | Integer divide total by N (truncates via `Math.trunc`) |

```typescript
roll("4d6//2") // Integer divide total by 2
roll({
  sides: 6,
  quantity: 4,
  modifiers: { integerDivide: 2 }
})

roll("10d10//3") // Integer divide total by 3
roll({
  sides: 10,
  quantity: 10,
  modifiers: { integerDivide: 3 }
})
```

**How it works:** The integer division modifier divides the total by N and truncates toward zero using `Math.trunc`. It operates at priority 93, after sort but before modulo.

**Example:** `4d6//2` rolls [3, 5, 4, 2] = 14. Integer divided by 2 = 7.

**Use cases:** Halving damage (e.g., resistance in D&D), averaging mechanics, systems that use integer math for resource calculation.

### Modulo (%N) — _primitive_

Apply modulo to the total:

| Notation | Description    |
| -------- | -------------- |
| `%N`     | Total modulo N |

```typescript
roll("4d6%3") // Total modulo 3
roll({
  sides: 6,
  quantity: 4,
  modifiers: { modulo: 3 }
})

roll("1d20%5") // Total modulo 5
roll({
  sides: 20,
  quantity: 1,
  modifiers: { modulo: 5 }
})
```

**How it works:** The modulo modifier applies the `%` operator to the total. It operates at priority 94, after integer division but before count successes.

**Example:** `4d6%3` rolls [3, 5, 4, 2] = 14. 14 % 3 = 2.

**Use cases:** Wrapping values into ranges, clock mechanics, cyclic resource systems.

### Count (`#{...}`) — _primitive_

Count dice matching conditions instead of summing values. This changes the result model from a sum to a count. The `#` modifier uses the same comparison operators as cap, drop, and reroll. All notation in randsum is case-insensitive.

| Notation     | Description                                   |
| ------------ | --------------------------------------------- |
| `#{>=N}`     | Count dice >= N (successes)                   |
| `#{<=N}`     | Count dice <= N (failures)                    |
| `#{>N}`      | Count dice strictly greater than N            |
| `#{<N}`      | Count dice strictly less than N               |
| `#{=N}`      | Count dice exactly equal to N                 |
| `#{>=N,<=M}` | Count >= N, subtract count <= M (deduct mode) |

```typescript
roll("5d10#{>=7}") // Count dice >= 7
roll({
  sides: 10,
  quantity: 5,
  modifiers: { count: { greaterThanOrEqual: 7 } }
})

roll("5d10#{<=3}") // Count dice <= 3
roll({
  sides: 10,
  quantity: 5,
  modifiers: { count: { lessThanOrEqual: 3 } }
})

roll("5d10#{>=7,<=1}") // Successes minus botches (deduct mode)
roll({
  sides: 10,
  quantity: 5,
  modifiers: { count: { greaterThanOrEqual: 7, lessThanOrEqual: 1, deduct: true } }
})
```

**How it works:** Instead of summing dice values, the total becomes a count of dice matching the specified condition. When a single condition is given, the total equals the number of dice that match. When two conditions are given (e.g., `#{>=7,<=1}`), deduct mode is activated: the count of dice matching the second condition is subtracted from the count matching the first.

**Example:** `5d10#{>=7}` rolls [8, 3, 10, 6, 9]. Dice >= 7: [8, 10, 9] = 3.

**Example with deduct:** `5d10#{>=7,<=1}` rolls [8, 1, 10, 1, 9]. Dice >= 7: 3. Dice <= 1: 2. Result = 3 - 2 = 1.

**Use cases:** World of Darkness, Shadowrun, and any dice pool system that counts hits or failures instead of summing values. The deduct form handles WoD-style botch subtraction natively.

### Count Failures (F{N}) — _alias → Count with lessThanOrEqual_

> **Alias equivalence:** `F{3}` is identical to `#{<=3}`.
>
> **Implementation note:** `F{N}` parses directly into `{ count: { lessThanOrEqual: N } }` — the same `count` key used by the `#{}` primitive. The `countFailuresBehavior` defined in `src/lib/modifiers/behaviors/countFailures.ts` is dead code: `countFailuresModifier` is never registered in `RANDSUM_MODIFIERS`. All execution flows through `countBehavior`.

Count how many dice rolled at or below a threshold. The total becomes the failure count:

| Notation | Description                 |
| -------- | --------------------------- |
| `F{N}`   | Count dice that rolled <= N |

**Important:** `F` requires curly braces (`F{N}`) to avoid conflict with Fate dice notation (`dF`). The pattern is case-insensitive.

```typescript
roll("5d10F{3}") // Count how many dice rolled <= 3
// Equivalent options-object form (F{N} is an alias — use the count key):
roll({
  sides: 10,
  quantity: 5,
  modifiers: {
    count: { lessThanOrEqual: 3 }
  }
})
```

**How it works:** Instead of summing dice values, the total becomes a count of dice that are at or below the threshold. Execution is handled entirely by the `count` modifier (`countBehavior`) — `F{N}` is parse-time alias only.

**Example:** `5d10F{3}` rolls [8, 2, 10, 1, 9]. Failures <= 3: [2, 1] = 2 failures.

**Use cases:** Dice pool systems where you need to count both successes and failures separately, risk assessment mechanics, World of Darkness botch counting.

### Margin of Success — _alias → Minus N_

Calculate the margin above or below a target number. All notation in randsum is case-insensitive.

| Notation | Description                               |
| -------- | ----------------------------------------- |
| `ms{N}`  | Subtract N from total (margin of success) |

```typescript
roll("1d20ms{15}") // How far above/below DC 15?
roll({
  sides: 20,
  quantity: 1,
  modifiers: { minus: 15 }
})

roll("1d20+5ms{15}") // With modifier, margin against DC 15
roll({
  sides: 20,
  quantity: 1,
  modifiers: { plus: 5, minus: 15 }
})
```

**Alias equivalence:** `ms{N}` is alias for `-N`. For example, `1d20ms{15}` is identical to `1d20-15`. The `ms` form exists for readability when calculating margins of success or failure against a difficulty class or target number.

**Use cases:** Checking how far above or below a DC a roll lands, degree-of-success systems, or any context where the margin matters more than the raw total.

### Wild Die (W) — _macro_

The D6 System wild die modifier (West End Games):

| Notation | Description                |
| -------- | -------------------------- |
| `W`      | Last die is the "wild die" |

```typescript
roll("5d6W") // Last die is wild
roll({
  sides: 6,
  quantity: 5,
  modifiers: { wildDie: true }
})
```

**How it works:** The last die in the pool is designated as the "wild die" with special behavior:

- **Wild die = max value (6):** The wild die compound-explodes — keep rolling and adding while the maximum is rolled.
- **Wild die = 1:** Remove the wild die AND the highest non-wild die from the pool.
- **Otherwise:** No special effect, the wild die acts as a normal die.

The wild die modifier operates at priority 55, after explode/compound/penetrate.

**Example:** `5d6W` rolls [4, 3, 5, 2, 6]. The wild die (6) compound-explodes: rolls 4, so wild die becomes 10. Result: [4, 3, 5, 2, 10] = 24.

**Example (wild 1):** `5d6W` rolls [4, 3, 5, 2, 1]. The wild die (1) triggers removal: remove the 1 (wild) and the 5 (highest non-wild). Result: [4, 3, 2] = 9.

**Use cases:** West End Games D6 System (Star Wars D6, Ghostbusters, Indiana Jones RPG).

### Total Multiplier (\*\*) — _alias → Multiply at post-arithmetic phase_

Multiply the entire final total after all other modifiers:

| Notation | Description                                                  |
| -------- | ------------------------------------------------------------ |
| `**N`    | Multiply entire final total by N (after all other modifiers) |

```typescript
roll("2d6+3**2") // (dice + 3) * 2
roll({
  sides: 6,
  quantity: 2,
  modifiers: {
    plus: 3,
    multiplyTotal: 2
  }
})

roll("4d6L+2**3") // ((drop lowest) + 2) * 3
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    drop: { lowest: 1 },
    plus: 2,
    multiplyTotal: 3
  }
})
```

**How it works:** The total multiplier is applied **last**, after all other modifiers including `plus`/`minus`. It multiplies the complete final result.

**Order of operations:** `((dice sum × multiply) ± plus/minus) × multiplyTotal`

**Example:** `2d6+3**2` rolls [4, 5] = 9. Plus 3 = 12. Multiplied by 2 = 24.

**Use cases:** Final multipliers like area effect multipliers, critical hit total multipliers, or system-wide bonuses that apply to the entire result.

**Difference from Pre-Arithmetic Multiplier:**

- **Pre-Arithmetic (`*`)**: `2d6*2+3` = (9 × 2) + 3 = 21
- **Total (`**`)**: `2d6+3\*\*2` = (9 + 3) × 2 = 24

### Annotations/Labels ([text]) — _primitive (metadata)_

Attach metadata labels to dice terms. Labels are flavor text with no mechanical effect:

| Notation                | Description                    |
| ----------------------- | ------------------------------ |
| `[text]`                | Label attached to a roll group |
| `2d6+3[fire]+1d4[cold]` | Labels on specific dice groups |

```typescript
roll("2d6+3[fire]+1d4[cold]") // Labels attach to specific roll groups
roll("4d6L[strength]") // Label the roll purpose
```

**How it works:** Labels are enclosed in square brackets and attached to the preceding dice term. They are stripped before modifier parsing and stored in `RollParams.label` and `RollRecord.label`. Labels are validated by `isDiceNotation` — notation with labels is valid notation.

**Use cases:** Tracking damage types in D&D, labeling ability score rolls, annotating complex multi-group rolls for display purposes.

### Repeat Operator (xN) — _alias → parser expansion_

Notation alias that repeats a roll expression N times:

| Notation | Description                           |
| -------- | ------------------------------------- |
| `xN`     | Repeat the preceding notation N times |

```typescript
roll("4d6Lx6") // Equivalent to roll("4d6L", "4d6L", "4d6L", "4d6L", "4d6L", "4d6L")
roll("2d6+3x4") // Roll 2d6+3 four times, sum all totals
roll("1d20X3") // Case-insensitive
```

**How it works:** The `xN` suffix is detected during notation parsing. It strips the suffix, then repeats the base notation N times as separate roll groups. N must be >= 1.

**Example:** `4d6Lx6` expands to six separate `4d6L` rolls — perfect for generating all six D&D ability scores in a single call.

**Use cases:** D&D ability score generation (`4d6Lx6`), rolling multiple identical damage dice groups, batch stat generation.

### Combining Modifiers

Modifiers can be chained together. They are applied in a specific order to ensure consistent results:

**Modifier Application Order:**

| Priority | Modifier         | Notation  | Description                        |
| -------- | ---------------- | --------- | ---------------------------------- |
| 10       | Cap              | `C{...}`  | Limit roll values to a range       |
| 20       | Drop             | `H`, `L`  | Remove dice from pool              |
| 21       | Keep             | `K`, `kl` | Keep dice in pool                  |
| 30       | Replace          | `V{...}`  | Replace specific values            |
| 40       | Reroll           | `R{...}`  | Reroll dice matching conditions    |
| 50       | Explode          | `!`       | Roll additional dice on max        |
| 51       | Compound         | `!!`      | Add explosion to existing die      |
| 52       | Penetrate        | `!p`      | Add explosion minus 1 to die       |
| 53       | Explode Sequence | `!s{...}` | Explode through die size sequence  |
| 55       | Wild Die         | `W`       | D6 System wild die behavior        |
| 60       | Unique           | `U`       | Ensure no duplicate values         |
| 85       | Multiply         | `*N`      | Multiply dice sum (pre-arithmetic) |
| 90       | Plus             | `+N`      | Add to total                       |
| 91       | Minus            | `-N`      | Subtract from total                |
| 92       | Sort             | `sa`/`sd` | Sort results for display           |
| 93       | Integer Divide   | `//N`     | Integer divide total               |
| 94       | Modulo           | `%N`      | Total modulo N                     |
| 95       | Count            | `#{...}`  | Count dice matching conditions     |
| 100      | Total Multiply   | `**N`     | Multiply entire final total        |

> **Note:** `S{N}` and `F{N}` are alias for `#{>=N}` and `#{<=N}` respectively. They share priority 95 with Count.

Lower priority numbers execute first. This order ensures predictable behavior:

- Dice values are capped/constrained first
- Pool size is adjusted (drop/keep)
- Values are replaced or rerolled
- Explosive mechanics add dice (explode adds new dice, compound/penetrate modify existing, explode sequence steps through die sizes)
- Wild die behavior is applied (after explosive mechanics)
- Uniqueness is enforced
- Dice sum is multiplied (pre-arithmetic)
- Arithmetic modifiers (+/-) apply
- Results are sorted (if requested)
- Integer division and modulo are applied
- Dice are counted instead of summed (if using dice pool systems)
- Final total is multiplied (if using total multiplier)

```typescript
roll("4d6L+2") // Drop lowest, add 2
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    drop: { lowest: 1 },
    plus: 2
  }
})

roll("2d20H!+1") // Drop highest, explode, add 1
roll({
  sides: 20,
  quantity: 2,
  modifiers: {
    drop: { highest: 1 },
    explode: true,
    plus: 1
  }
})

roll("4d6R{<3}L") // Reroll under 3, then drop lowest
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    reroll: { lessThan: 3 },
    drop: { lowest: 1 }
  }
})

roll("3d6!!*2+3") // Compound explode, multiply by 2, add 3
roll({
  sides: 6,
  quantity: 3,
  modifiers: {
    compound: true,
    multiply: 2,
    plus: 3
  }
})
// Result: ((compound dice sum) × 2) + 3

roll("2d6*2+3**2") // Multiply dice by 2, add 3, multiply total by 2
roll({
  sides: 6,
  quantity: 2,
  modifiers: {
    multiply: 2,
    plus: 3,
    multiplyTotal: 2
  }
})
// Result: (((dice sum) × 2) + 3) × 2

roll("4d6K3!+2") // Keep highest 3, explode, add 2
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    keep: { highest: 3 },
    explode: true,
    plus: 2
  }
})

roll("3d6!pL+1") // Penetrate explode, drop lowest, add 1
roll({
  sides: 6,
  quantity: 3,
  modifiers: {
    penetrate: true,
    drop: { lowest: 1 },
    plus: 1
  }
})

roll("4d6ro{<3}K3") // Reroll under 3 once, keep highest 3
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    reroll: { lessThan: 3, max: 1 },
    keep: { highest: 3 }
  }
})

roll("5d8KM+3") // Keep middle (drop 1 lowest + 1 highest), add 3
roll({
  sides: 8,
  quantity: 5,
  modifiers: {
    drop: { lowest: 1, highest: 1 },
    plus: 3
  }
})
```

**Important Notes:**

- Pre-arithmetic multiply (`*`) applies before `plus`/`minus`: `2d6*2+3` = (sum × 2) + 3
- Total multiply (`**`) applies after everything: `2d6+3**2` = (sum + 3) × 2
- You can use both multipliers together: `2d6*2+3**2` = ((sum × 2) + 3) × 2
- Keep is processed before explode/compound/penetrate, so explosions only happen on kept dice
- Drop/Keep happen after reroll but before explode, so you reroll first, then keep/drop

## Multiple Dice Sides in a Single Roll

You can roll multiple dice sides in a single by passing multiple arguments:

| Form                 | Description                                     |
| -------------------- | ----------------------------------------------- |
| `roll("NdS", "NdS")` | Roll multiple dice groups, sum totals           |
| `roll("-NdS")`       | Negative prefix subtracts this group from total |
| `roll("NdS-NdS")`    | Inline subtraction in a single notation string  |

```typescript
roll("1d20", "-2d6", "10d8+2") // Roll 1d20, subtract 2d6, roll 10d8+2
roll("1d20-2d6+10d8+2") // Same as a single notation string
```

## Adding or Subtracting Rolls from the Total

You can add or subtract rolls from the total by using the `arithmetic` option, or by adding a `+` or `-` to the notation:

```typescript
roll("2d12-1d6") // Roll 2d12, add them, then subtract 1d6
roll(
  {
    sides: 12,
    quantity: 2
  },
  {
    sides: 6,
    quantity: 1,
    arithmetic: "subtract"
  }
)
```

### Ultra-Complex: Balanced Hero Roll

A roll that demonstrates every comparison operator working together:

```typescript
// "Balanced Hero Roll":
// - Roll 8d10
// - Cap values above 8 to 8 (ceiling), and cap values below 3 to 3 (floor) → effective range [3,8]
// - Keep highest 5
// - Reroll any remaining 3s (the floor-capped minimum)
// - Add 4
roll("8d10C{>8,<3}K5R{=3}+4")
roll({
  sides: 10,
  quantity: 8,
  modifiers: {
    cap: { greaterThan: 8, lessThan: 3 },
    keep: { highest: 5 },
    reroll: { exact: [3] },
    plus: 4
  }
})

// Equivalent using >=/<= operators (functionally the same for integer dice):
roll("8d10C{>=8,<=3}K5R{=3}+4")
roll({
  sides: 10,
  quantity: 8,
  modifiers: {
    cap: { greaterThanOrEqual: 8, lessThanOrEqual: 3 },
    keep: { highest: 5 },
    reroll: { exact: [3] },
    plus: 4
  }
})

// "Bounded Ability Score": 4d6, cap max at 5, reroll 1s, keep highest 3
roll("4d6C{5}K3R{1}") // bare number cap
roll("4d6C{=5}K3R{=1}") // explicit = form
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    cap: { exact: [5] }, // bare/exact values cap the maximum
    keep: { highest: 3 },
    reroll: { exact: [1] }
  }
})
```

**Step-by-step for `8d10C{>8,<3}K5R{=3}+4`:**

1. Roll 8d10 → e.g. `[10, 7, 3, 9, 2, 8, 1, 5]`
2. Cap `>8` to 8, cap `<3` to 3 → `[8, 7, 3, 8, 3, 8, 3, 5]`
3. Keep highest 5 → `[8, 7, 8, 8, 5]`
4. Reroll any 3s (none left after step 3) → `[8, 7, 8, 8, 5]`
5. Add 4 → total = 40

## Common Use Cases

### D&D 5e Critical Hits

#### Option 1: Double Base Damage (Pre-Arithmetic Multiply)

```typescript
roll("2d6+3*2") // Double base dice damage before modifier
// Result: [4, 5] = 9 → (9 × 2) + 3 = 21
```

#### Option 2: Double Total Damage (Total Multiply)

```typescript
roll("2d6+3**2") // Double entire damage including modifier
// Result: [4, 5] = 9 → (9 + 3) × 2 = 24
```

### D&D 5e Ability Score Generation

```typescript
roll("4d6K3") // Roll 4d6, keep highest 3
roll("4d6L") // Equivalent: Roll 4d6, drop lowest 1
```

### D&D 5e Advantage/Disadvantage

```typescript
roll("2d20K") // Advantage: keep highest
roll("2d20kl") // Disadvantage: keep lowest
```

### Hackmaster Penetrating Dice

```typescript
roll("1d6!p") // Standard penetrate
roll("2d6!p+3") // Penetrate with modifier
```

### Area Effect Spells

```typescript
roll("8d6*2") // 8d6 damage, doubled for area effect
roll("8d6+5**2") // 8d6+5 damage, doubled for area effect
```

### Compounding Critical Systems

```typescript
roll("1d8!!+5") // Critical: compound base damage, add modifier
roll("2d6!!*2+3") // Critical: compound, multiply base, add modifier
```

### Exploding Dice with Keep

```typescript
roll("4d6K3!") // Keep highest 3, then explode
roll("3d6!pL+1") // Penetrate explode, drop lowest, add 1
```

### D&D Ability Score Generation (Repeat Operator)

```typescript
roll("4d6Lx6") // Generate all 6 ability scores in one call
```

### Star Wars D6 System (Wild Die)

```typescript
roll("5d6W") // 5d6 with wild die
roll("3d6W+2") // 3d6 with wild die and +2 modifier
```

### World of Darkness Dice Pool

```typescript
roll("8d10#{>=8,<=1}") // WoD: successes on 8+, botch on 1
roll("8d10S{8,1}") // Alias: same as above
```

### Shadowrun Hits

```typescript
roll("12d6#{>=5}") // Count hits (5 or 6)
roll("12d6S{5}") // Alias: same as above
```

### Labeled Damage Rolls

```typescript
roll("2d6+3[fire]+1d4[cold]") // Track damage types
roll("1d20+7[attack]") // Label the roll purpose
```

### Geometric Survival Rolls

```typescript
roll("g6") // How many turns until resource depletion?
roll("3g6") // Three independent geometric rolls
```

### Card-Deck Draw Mechanics

```typescript
roll("3DD6") // Draw 3 unique values from a d6 pool
roll("6DD6") // Full permutation of [1,2,3,4,5,6]
```

### D&D 5e Great Weapon Fighting (Reroll Once)

```typescript
roll("2d6ro{<3}+5") // Reroll 1s and 2s once, add STR modifier
```

### Stepladder Explosion (Explode Sequence)

```typescript
roll("1d6!s{4,6,8,10,12}") // Explode through increasing die sizes
roll("1d8!i") // Inflation: explode up through standard TTRPG dice
roll("1d12!r") // Reduction: explode down through standard TTRPG dice
```

### Custom Damage Type Dice

```typescript
roll("d{fire,ice,lightning}") // Random damage type
roll("3d{1,1,2,2,3}") // Weighted custom dice
```

### Zero-Indexed Random Tables

```typescript
roll("z20") // Roll 0-19 for a 20-entry table (zero-indexed)
roll("z100") // Roll 0-99 for percentile table lookups
```

## Performance Considerations

### Depth Limits

All explosive modifiers (explode, compound, penetrate, explode sequence) have built-in depth limits:

- **Explicit depth**: `!!N`, `!pN` - Limited to N depth
- **Unlimited (0)**: `!!0`, `!p0` - Capped at 1000 for safety
- **Default**: `!`, `!!`, `!p` - Limited to 1 explosion per die
- **Explode sequence**: `!s{...}`, `!i`, `!r` - Capped by sequence length; final die repeats with safety cap

These limits prevent infinite loops and ensure performance remains predictable.

### Geometric Die Safety

Geometric dice (`gN`) have a built-in safety cap of 1000 iterations per die to prevent infinite loops in unlikely but possible long-running sequences.

### Best Practices

1. **Use depth limits** for explosive modifiers in production code
2. **Keep dice quantities reasonable** (< 100 dice for best performance)
3. **Prefer compound over explode** if you don't need separate dice tracking
4. **Use multipliers sparingly** - they're cheap but unnecessary if not needed

## Attribution

The extended notation syntax was inspired by [Sophie's Dice](https://sophiehoulden.com/dice/documentation/notation.html#keep).
