# Randsum Dice Notation

## Overview

Dice notation is a compact way to represent dice rolls and their modifications. For example, `4d20+2` means "roll four twenty-sided dice, then add two".

Randsum extends standard dice notation with powerful modifiers like dropping lowest rolls, rerolling specific values, and ensuring unique results.

The core `roll()` function accepts several argument types: a **number** (sides for a single die, e.g. `roll(20)` for 1d20), a **notation string** (e.g. `roll("4d6L")`), an **options object** (e.g. `roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })`), or **multiple arguments** combined into one total (e.g. `roll("1d20", "2d6", "+5")`).

## Basic Syntax

All notation in randsum is case-insensitive (`2d8` = `2D8`).

### Standard Rolls

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

## Modifiers

### Basic Arithmetic

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

// Drop by value
roll("4d20D{>17}") // Drop rolls over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { greaterThan: 17 } }
})

roll("4d20D{<5}") // Drop rolls under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { lessThan: 5 } }
})

roll("4d20D{8,12}") // Drop 8s and 12s
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { exact: [8, 12] } }
})
```

### Reroll Modifiers

Reroll dice matching certain conditions:

```typescript
roll("4d20R{>17}") // Reroll results over 17
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { greaterThan: 17 } }
})

roll("4d20R{<5}") // Reroll results under 5
roll({
  sides: 20,
  quantity: 4,
  modifiers: { reroll: { lessThan: 5 } }
})

roll("4d20R{8,12}") // Reroll 8s and 12s
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

### Replace Modifiers

Replace specific results with new values:

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
```

### Unique Results

Force unique rolls within a pool:

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

```typescript
roll("4d20!") // Roll an extra d20 for each 20 rolled
roll({
  sides: 20,
  quantity: 4,
  modifiers: { explode: true }
})

roll("3d6!5") // Explode with max depth of 5
roll({
  sides: 6,
  quantity: 3,
  modifiers: { explode: 5 }
})

roll("3d6!0") // Explode unlimited (capped at 100 for safety)
roll({
  sides: 6,
  quantity: 3,
  modifiers: { explode: 0 }
})
```

**How it works:** When a die shows its maximum value, it "explodes" - a new die is rolled and added to the result. This continues for each new maximum value rolled, creating additional dice in the result.

**Example:** `3d6!` rolls [6, 4, 6]. The two 6s explode, adding [5, 3]. Final result: [6, 4, 6, 5, 3] = 24.

### Compounding Exploding (!!)

Exploding dice that add to the triggering die instead of creating new dice:

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

roll("3d6!!0") // Compound explode unlimited (capped at 100)
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

roll("3d6!p0") // Penetrate unlimited (capped at 100)
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
  modifiers: { multiply: 2 }
})
```

**How it works:** The multiplier is applied to the sum of all dice after other modifiers (drop, keep, explode, etc.) but **before** `plus`/`minus` arithmetic modifiers are applied.

**Order of operations:** `(dice sum × multiply) ± plus/minus`

**Example:** `2d6*2+3` rolls [4, 5] = 9. Multiplied by 2 = 18. Plus 3 = 21.

**Use cases:** Critical hits that double or triple base damage before modifiers. Or systems where dice are multiplied before bonuses are added.

### Count Successes (S{...})

Count dice meeting a threshold instead of summing values. Used in dice pool systems like World of Darkness and Shadowrun:

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

### Total Multiplier (\*\*)

Multiply the entire final total after all other modifiers:

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
| 60       | Unique          | `U`       | Ensure no duplicate values         |
| 85       | Multiply        | `*N`      | Multiply dice sum (pre-arithmetic) |
| 90       | Plus            | `+N`      | Add to total                       |
| 91       | Minus           | `-N`      | Subtract from total                |
| 95       | Count Successes | `S{...}`  | Count dice meeting threshold       |
| 100      | Total Multiply  | `**N`     | Multiply entire final total        |

Lower priority numbers execute first. This order ensures predictable behavior:

- Dice values are capped/constrained first
- Pool size is adjusted (drop/keep)
- Values are replaced or rerolled
- Explosive mechanics add dice (explode adds new dice, compound/penetrate modify existing)
- Uniqueness is enforced
- Dice sum is multiplied (pre-arithmetic)
- Arithmetic modifiers (+/-) apply
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

```typescript
roll("1d20", "-2d6", "10d8+2") // Roll 1d20, 2d6, and 10d8 + 2.
roll("1d20-2d6+10d8+2") // Same as above, but in a single string
roll(
  {
    sides: 20
  },
  {
    sides: 6,
    quantity: 2
    arithmetic: "subtract"
  },
  {
    sides: 8,
    quantity: 10
    modifiers: { plus: 2 }
  }
)
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

## Performance Considerations

### Depth Limits

All explosive modifiers (explode, compound, penetrate) have built-in depth limits:

- **Explicit depth**: `!N`, `!!N`, `!pN` - Limited to N depth
- **Unlimited (0)**: `!0`, `!!0`, `!p0` - Capped at 100 for safety
- **Default**: `!`, `!!`, `!p` - Limited to 1 explosion per die

These limits prevent infinite loops and ensure performance remains predictable.

### Best Practices

1. **Use depth limits** for explosive modifiers in production code
2. **Keep dice quantities reasonable** (< 100 dice for best performance)
3. **Prefer compound over explode** if you don't need separate dice tracking
4. **Use multipliers sparingly** - they're cheap but unnecessary if not needed

## Attribution

The extended notation syntax was inspired by [Sophie's Dice](https://sophiehoulden.com/dice/documentation/notation.html#keep).
