# Randsum Dice Notation

## Overview

Dice notation is a compact way to represent dice rolls and their modifications. For example, `4d20+2` means "roll four twenty-sided dice, then add two".

Randsum extends standard dice notation with powerful modifiers like dropping lowest rolls, rerolling specific values, and ensuring unique results.

The core `roll()` function accepts several argument types: a **number** (sides for a single die, e.g. `roll(20)` for 1d20), a **notation string** (e.g. `roll("4d6L")`), an **options object** (e.g. `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })`), or **multiple arguments** combined into one total (e.g. `roll("1d20", "2d6")`).

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

In addition to standard `NdS` notation, `roll()` accepts shorthand string arguments for common special dice. These are standalone argument types — they cannot be combined with notation modifiers inline (use the options object form for modified rolls). Geometric dice (`gN`) and draw dice (`DDN`) are also available as special notation-level die types.

### Geometric Die (`gN`)

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

### Draw Die (`DDN`)

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

### Percentile Die (`d%`)

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

### Fate/Fudge Dice (`dF`)

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

### Basic Arithmetic

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

### Cap Modifiers

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

### Drop Modifiers

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

### Reroll Modifiers

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

### Replace Modifiers

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

### Unique Results

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

### Keep Modifiers

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

### Exploding Dice

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

**How it works:** When a die shows its maximum value, it "explodes" - a new die is rolled and added to the result. This continues for each new maximum value rolled, creating additional dice in the result.

**Example:** `3d6!` rolls [6, 4, 6]. The two 6s explode, adding [5, 3]. Final result: [6, 4, 6, 5, 3] = 24.

### Compounding Exploding (!!)

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

### Penetrating Exploding (!p)

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

**How it works:** When a die shows its maximum value, it penetrates - a new roll is made, but 1 is subtracted from the result before adding. Each subsequent penetration also subtracts 1. This creates a diminishing return effect.

**Example:** `1d6!p` rolls 6. This penetrates, rolling 5. The value added is 5 - 1 = 4, so the die becomes 6 + 4 = 10. If that roll had been a 6, it would penetrate again: roll 3, subtract 1 = 2, so the die becomes 6 + 4 + 2 = 12.

**Use cases:** Penetrating dice are used in Hackmaster and similar systems where you want explosive results but with diminishing returns to prevent unlimited growth.

**Comparison:**

- **Explode (`!`)**: `[6]` → `[6, 6, 4]` = 16 (new dice added)
- **Compound (`!!`)**: `[6]` → `[16]` = 16 (die value modified)
- **Penetrate (`!p`)**: `[6]` → `[12]` = 12 (6 + (6-1) + (3-1) if it keeps penetrating, die value modified with -1 on each subsequent roll)

### Pre-Arithmetic Multiplier (\*)

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

### Count Successes (S{N})

Count dice meeting a threshold instead of summing values. Used in dice pool systems like World of Darkness and Shadowrun:

| Notation | Description                                 |
| -------- | ------------------------------------------- |
| `S{N}`   | Count dice that rolled >= N                 |
| `S{N,B}` | Count successes >= N, subtract botches <= B |

**Important:** `S` only accepts plain integer thresholds — comparison operators (`>`, `<`, `>=`, `<=`) are **not** supported inside `S{}`. Use `S{7}`, not `S{>7}`.

```typescript
roll("5d10S{7}") // Count how many dice rolled >= 7
roll({
  sides: 10,
  quantity: 5,
  modifiers: {
    countSuccesses: { threshold: 7 }
  }
})

// With botch threshold (successes - botches)
roll("5d10S{7,1}") // Count successes >= 7, subtract botches <= 1
roll({
  sides: 10,
  quantity: 5,
  modifiers: {
    countSuccesses: {
      threshold: 7,
      botchThreshold: 1
    }
  }
})
```

**How it works:** Instead of summing dice values, the total becomes a count of dice that meet or exceed the threshold. If a botch threshold is specified, dice at or below that value are counted as botches and subtracted from the success count.

**Example:** `5d10S{7}` rolls [8, 3, 10, 6, 9]. Successes >= 7: [8, 10, 9] = 3 successes.

**Example with botch:** `5d10S{7,1}` rolls [8, 1, 10, 1, 9]. Successes >= 7: 3, Botches <= 1: 2. Result = 3 - 2 = 1.

**Use cases:** World of Darkness, Shadowrun, and other dice pool systems where you count successes rather than sum values.

### Sort (sa/sd)

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
  modifiers: { sort: "ascending" }
})

roll("4d6sd") // Sort results descending
roll({
  sides: 6,
  quantity: 4,
  modifiers: { sort: "descending" }
})
```

**How it works:** Sort reorders the dice results for display without changing the total. Useful for readability when reviewing large pools.

### Integer Division (//N)

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

### Modulo (%N)

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

### Count Failures (F{N})

Count how many dice rolled at or below a threshold. The total becomes the failure count:

| Notation | Description                 |
| -------- | --------------------------- |
| `F{N}`   | Count dice that rolled <= N |

**Important:** `F` requires curly braces (`F{N}`) to avoid conflict with Fate dice notation (`dF`). The pattern is case-insensitive.

```typescript
roll("5d10F{3}") // Count how many dice rolled <= 3
roll({
  sides: 10,
  quantity: 5,
  modifiers: {
    countFailures: { threshold: 3 }
  }
})
```

**How it works:** Instead of summing dice values, the total becomes a count of dice that are at or below the threshold. This is a total transformer like `countSuccesses`.

**Example:** `5d10F{3}` rolls [8, 2, 10, 1, 9]. Failures <= 3: [2, 1] = 2 failures.

**Use cases:** Dice pool systems where you need to count both successes and failures separately, risk assessment mechanics, World of Darkness botch counting.

### Wild Die (W)

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

### Total Multiplier (\*\*)

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

### Annotations/Labels ([text])

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

### Repeat Operator (xN)

Notation sugar that repeats a roll expression N times:

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

| Priority | Modifier        | Notation  | Description                        |
| -------- | --------------- | --------- | ---------------------------------- |
| 10       | Cap             | `C{...}`  | Limit roll values to a range       |
| 20       | Drop            | `H`, `L`  | Remove dice from pool              |
| 21       | Keep            | `K`, `kl` | Keep dice in pool                  |
| 30       | Replace         | `V{...}`  | Replace specific values            |
| 40       | Reroll          | `R{...}`  | Reroll dice matching conditions    |
| 50       | Explode         | `!`       | Roll additional dice on max        |
| 51       | Compound        | `!!`      | Add explosion to existing die      |
| 52       | Penetrate       | `!p`      | Add explosion minus 1 to die       |
| 55       | Wild Die        | `W`       | D6 System wild die behavior        |
| 60       | Unique          | `U`       | Ensure no duplicate values         |
| 85       | Multiply        | `*N`      | Multiply dice sum (pre-arithmetic) |
| 90       | Plus            | `+N`      | Add to total                       |
| 91       | Minus           | `-N`      | Subtract from total                |
| 92       | Sort            | `sa`/`sd` | Sort results for display           |
| 93       | Integer Divide  | `//N`     | Integer divide total               |
| 94       | Modulo          | `%N`      | Total modulo N                     |
| 95       | Count Successes | `S{...}`  | Count dice meeting threshold       |
| 96       | Count Failures  | `F{...}`  | Count dice at or below threshold   |
| 100      | Total Multiply  | `**N`     | Multiply entire final total        |

Lower priority numbers execute first. This order ensures predictable behavior:

- Dice values are capped/constrained first
- Pool size is adjusted (drop/keep)
- Values are replaced or rerolled
- Explosive mechanics add dice (explode adds new dice, compound/penetrate modify existing)
- Wild die behavior is applied (after explosive mechanics)
- Uniqueness is enforced
- Dice sum is multiplied (pre-arithmetic)
- Arithmetic modifiers (+/-) apply
- Results are sorted (if requested)
- Integer division and modulo are applied
- Successes/failures are counted (if using dice pool systems)
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

## Performance Considerations

### Depth Limits

All explosive modifiers (explode, compound, penetrate) have built-in depth limits:

- **Explicit depth**: `!!N`, `!pN` - Limited to N depth
- **Unlimited (0)**: `!!0`, `!p0` - Capped at 1000 for safety
- **Default**: `!`, `!!`, `!p` - Limited to 1 explosion per die

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
