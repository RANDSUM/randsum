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

In addition to standard `NdS` notation, `roll()` accepts shorthand string arguments for common special dice. These are standalone argument types — they cannot be combined with notation modifiers inline (use the options object form for modified rolls).

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

### Zero-Bias Dice (`zN`)

Zero-bias dice shift standard die faces down by 1, producing a range of 0 to N-1 instead of 1 to N. Useful in systems where zero-indexed results are needed, such as Ironsworn's oracle tables or percentile-style lookups starting at 0.

| Notation | Faces            | Range   | Description       |
| -------- | ---------------- | ------- | ----------------- |
| `z6`     | 0, 1, 2, 3, 4, 5 | 0 to 5  | One zero-bias d6  |
| `4z6`    | 0, 1, 2, 3, 4, 5 | 0 to 20 | Four zero-bias d6 |
| `z20`    | 0 through 19     | 0 to 19 | One zero-bias d20 |

```typescript
roll("z6") // Roll 1d6 with faces 0-5
roll("4z6") // Roll 4d6 with faces 0-5
roll("Z20") // Case-insensitive
```

Internally, `z6` rolls a d6 with a replace modifier mapping `{ 1 -> 0, 2 -> 1, 3 -> 2, 4 -> 3, 5 -> 4, 6 -> 5 }`. The result is a standard die roll shifted down by 1.

**Note:** Zero-bias dice support a quantity prefix (e.g., `4z6`) but do not support inline notation modifiers. Use the options object form for modified rolls.

### Custom Dice Faces (`d{...}`)

Custom dice let you define arbitrary face values. Faces can be numeric, string, or mixed. Duplicate faces are allowed for weighted results.

| Notation                | Faces                | Description                           |
| ----------------------- | -------------------- | ------------------------------------- |
| `d{2,3,5,7}`            | 2, 3, 5, 7           | Numeric custom faces (d4 with primes) |
| `d{fire,ice,lightning}` | fire, ice, lightning | String custom faces                   |
| `d{1,fire,3}`           | 1, fire, 3           | Mixed faces (all treated as strings)  |
| `d{-1,0,1}`             | -1, 0, 1             | Negative and zero faces               |
| `d{1,1,1,2}`            | 1, 1, 1, 2           | Weighted: 75% chance of 1             |
| `3d{hit,miss}`          | hit, miss            | Quantity prefix: roll 3 custom dice   |

```typescript
roll("d{2,3,5,7}") // Roll a d4 with faces [2, 3, 5, 7]
roll("d{fire,ice,lightning}") // Roll a d3 with string faces
roll("3d{hit,miss}") // Roll 3 custom dice with "hit" and "miss" faces
roll("d{-1,0,1}") // Equivalent to dF
roll("d{1,1,1,2}") // Weighted die: 75% chance of 1
```

**How it works:**

- **Numeric faces** (all values are valid numbers): Rolls a die with the number of faces equal to the list length, then applies a replace modifier to map each face to the specified value. The result is numeric and contributes to the total.
- **String faces** (any non-numeric value present): Uses the `sides: T[]` path, producing `customResults` on the roll result instead of numeric values. Mixed faces (e.g., `d{1,fire,3}`) are all treated as strings.

**Note:** Custom dice support a quantity prefix (e.g., `3d{hit,miss}`). The `d` is case-insensitive.

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

#### Margin of Success (`ms{N}`)

Margin of success is input-only sugar that converts to subtraction before parsing. `ms{N}` is equivalent to `-N`.

| Notation     | Equivalent | Description                         |
| ------------ | ---------- | ----------------------------------- |
| `1d20ms{15}` | `1d20-15`  | Roll 1d20, subtract 15 (the target) |

```typescript
roll("1d20ms{15}") // Roll 1d20, subtract 15
// Equivalent to:
roll("1d20-15")
```

**How it works:** The `ms{N}` token is pre-processed into `-N` before the notation is parsed. The resulting roll uses a `minus` modifier. Output notation always uses `-N` form — `ms` does not appear in the result's `notation` field.

**Use cases:** Systems where you need to know how much a roll exceeds (or falls short of) a target number. A positive total means success by that margin; a negative total means failure.

**Note:** `ms` is case-insensitive (`ms`, `Ms`, `MS`, `mS` are all valid).

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

#### Reroll Once (`ro{...}`)

Reroll once is sugar over `R{...}1` — it rerolls matching values with a maximum of 1 reroll. This is the most common reroll pattern in tabletop RPGs, where you get one chance to improve a bad roll.

| Notation   | Equivalent | Description                       |
| ---------- | ---------- | --------------------------------- |
| `ro{<3}`   | `R{<3}1`   | Reroll values under 3, once       |
| `ro{>17}`  | `R{>17}1`  | Reroll values over 17, once       |
| `ro{>=18}` | `R{>=18}1` | Reroll values at or over 18, once |
| `ro{<=2}`  | `R{<=2}1`  | Reroll values at or under 2, once |
| `ro{5}`    | `R{5}1`    | Reroll exact 5s, once             |
| `ro{=5}`   | `R{=5}1`   | Reroll exact 5s, once             |
| `ro{1,2}`  | `R{1,2}1`  | Reroll 1s and 2s, once            |

```typescript
roll("4d6ro{<3}") // Reroll values under 3, max 1 reroll
roll({
  sides: 6,
  quantity: 4,
  modifiers: {
    reroll: {
      lessThan: 3,
      max: 1
    }
  }
})

roll("1d20ro{1}") // Reroll a natural 1, once
roll({
  sides: 20,
  quantity: 1,
  modifiers: {
    reroll: {
      exact: [1],
      max: 1
    }
  }
})
```

**How it works:** `ro{...}` is equivalent to `R{...}1`. The `toNotation` function emits `ro{...}` (not `R{...}1`) when `max` is 1. The `toDescription` function says "Reroll once" instead of "Reroll (up to 1 times)".

**Note:** `ro` is case-insensitive (`ro`, `Ro`, `RO`, `rO` are all valid). No trailing max count is accepted — the count is always implicitly 1.

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

#### Keep Middle (`KM`)

Keep middle is sugar over dropping both the lowest and highest dice from the pool. It discards outliers from both ends, keeping the central values.

| Notation | Equivalent | Description                                 |
| -------- | ---------- | ------------------------------------------- |
| `6d6KM`  | `6d6LH`    | Drop 1 lowest and 1 highest (keep middle 4) |
| `6d6KM2` | `6d6L2H2`  | Drop 2 from each end (keep middle 2)        |

```typescript
roll("6d6KM") // Keep middle 4 (drop 1 lowest, 1 highest)
roll({
  sides: 6,
  quantity: 6,
  modifiers: {
    drop: { lowest: 1, highest: 1 }
  }
})

roll("6d6KM2") // Keep middle 2 (drop 2 lowest, 2 highest)
roll({
  sides: 6,
  quantity: 6,
  modifiers: {
    drop: { lowest: 2, highest: 2 }
  }
})
```

**How it works:** `KM` drops 1 from each end of the sorted results. `KMN` drops N from each end. Internally, it resolves to `{ drop: { lowest: N, highest: N } }`.

**Use cases:** Systems that want to reduce variance by trimming extreme rolls. A "trimmed mean" approach common in statistical analysis and some homebrew RPG systems.

**Note:** `KM` is case-insensitive (`km`, `Km`, `KM`, `kM` are all valid).

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

### Sort (`s` / `sa` / `sd`)

Sort the dice results for display purposes. Sorting does not affect the total — it only reorders the rolls array.

| Notation | Description               |
| -------- | ------------------------- |
| `s`      | Sort ascending (default)  |
| `sa`     | Sort ascending (explicit) |
| `sd`     | Sort descending           |

```typescript
roll("4d6s") // Sort results ascending
roll({
  sides: 6,
  quantity: 4,
  modifiers: { sort: "ascending" }
})

roll("4d6sa") // Sort results ascending (explicit)
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

**How it works:** The sort modifier reorders the rolls array after all value-modifying operations are complete but before arithmetic modifiers are applied. It is display-only — the total is unaffected by sort order.

**Example:** `4d6s` rolls [3, 1, 6, 2]. Sorted ascending: [1, 2, 3, 6]. Total = 12 (same either way).

**Note:** `s` is case-insensitive. The `s` modifier does not conflict with `S{N}` (count successes) — the parser uses negative lookahead to distinguish them. `S` followed by `{` is always count successes; `s`, `sa`, or `sd` without `{` is sort.

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

### Combining Modifiers

Modifiers can be chained together. They are applied in a specific order to ensure consistent results:

**Modifier Application Order:**

| Priority | Modifier        | Notation        | Description                        |
| -------- | --------------- | --------------- | ---------------------------------- |
| 10       | Cap             | `C{...}`        | Limit roll values to a range       |
| 20       | Drop            | `H`, `L`        | Remove dice from pool              |
| 21       | Keep            | `K`, `kl`       | Keep dice in pool                  |
| 30       | Replace         | `V{...}`        | Replace specific values            |
| 40       | Reroll          | `R{...}`        | Reroll dice matching conditions    |
| 50       | Explode         | `!`             | Roll additional dice on max        |
| 51       | Compound        | `!!`            | Add explosion to existing die      |
| 52       | Penetrate       | `!p`            | Add explosion minus 1 to die       |
| 60       | Unique          | `U`             | Ensure no duplicate values         |
| 85       | Multiply        | `*N`            | Multiply dice sum (pre-arithmetic) |
| 90       | Plus            | `+N`            | Add to total                       |
| 91       | Minus           | `-N`            | Subtract from total                |
| 92       | Sort            | `s`, `sa`, `sd` | Sort rolls (display only)          |
| 95       | Count Successes | `S{...}`        | Count dice meeting threshold       |
| 100      | Total Multiply  | `**N`           | Multiply entire final total        |

Lower priority numbers execute first. This order ensures predictable behavior:

- Dice values are capped/constrained first
- Pool size is adjusted (drop/keep)
- Values are replaced or rerolled
- Explosive mechanics add dice (explode adds new dice, compound/penetrate modify existing)
- Uniqueness is enforced
- Dice sum is multiplied (pre-arithmetic)
- Arithmetic modifiers (+/-) apply
- Rolls are sorted for display (does not affect total)
- Successes are counted (if using dice pool systems)
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

### World of Darkness (Custom Faces)

```typescript
roll("d{1,1,1,1,1,2}") // Weighted die: 5/6 fail, 1/6 success
roll("5d10S{8}") // Standard WoD pool: count successes >= 8
```

### Zero-Bias Percentile

```typescript
roll("z100") // Roll 0-99 (zero-indexed percentile)
roll("z10") // Roll 0-9 (zero-indexed d10)
```

### Ironsworn Action Roll

```typescript
roll("z10") // Action die: 0-9
```

### Custom Narrative Dice

```typescript
roll("d{hit,miss}") // Binary outcome die
roll("3d{hit,miss}") // Roll 3 narrative dice
roll("d{fire,ice,lightning,void}") // Elemental damage die
```

### Reroll Once (D&D 5e Great Weapon Fighting)

```typescript
roll("2d6ro{<=2}") // Reroll 1s and 2s once (greatsword damage)
roll("1d20ro{1}") // Reroll a natural 1, once (Halfling Lucky)
```

### Keep Middle (Trimmed Rolls)

```typescript
roll("5d6KM") // Drop highest and lowest, keep middle 3
roll("7d6KM2") // Drop 2 from each end, keep middle 3
```

### Sorted Display

```typescript
roll("4d6sL") // Sort ascending, drop lowest (visual clarity)
roll("10d10sdS{7}") // Sort descending, count successes (easy reading)
```

### Margin of Success

```typescript
roll("1d20ms{15}") // How much did you beat DC 15 by?
roll("1d100ms{50}") // Percentile margin of success
```

## Performance Considerations

### Depth Limits

All explosive modifiers (explode, compound, penetrate) have built-in depth limits:

- **Explicit depth**: `!!N`, `!pN` - Limited to N depth
- **Unlimited (0)**: `!!0`, `!p0` - Capped at 1000 for safety
- **Default**: `!`, `!!`, `!p` - Limited to 1 explosion per die

These limits prevent infinite loops and ensure performance remains predictable.

### Best Practices

1. **Use depth limits** for explosive modifiers in production code
2. **Keep dice quantities reasonable** (< 100 dice for best performance)
3. **Prefer compound over explode** if you don't need separate dice tracking
4. **Use multipliers sparingly** - they're cheap but unnecessary if not needed

## Attribution

The extended notation syntax was inspired by [Sophie's Dice](https://sophiehoulden.com/dice/documentation/notation.html#keep).
