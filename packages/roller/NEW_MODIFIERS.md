# New Roller Modifiers: In-Depth Guide

## Overview

This document provides comprehensive documentation for the new modifiers added to `@randsum/roller`: Keep (K), Compounding Exploding (!!), Penetrating Exploding (!p), Pre-Arithmetic Multiplier (\*), and Total Multiplier (\*\*).

## Table of Contents

1. [Keep Modifier (K)](#keep-modifier-k)
2. [Compounding Exploding (!!)](#compounding-exploding-)
3. [Penetrating Exploding (!p)](#penetrating-exploding-p)
4. [Pre-Arithmetic Multiplier (\*)](#pre-arithmetic-multiplier-)
5. [Total Multiplier (\*\*)](#total-multiplier-)
6. [Modifier Order and Precedence](#modifier-order-and-precedence)
7. [Common Use Cases](#common-use-cases)
8. [Performance Considerations](#performance-considerations)

---

## Keep Modifier (K)

### Notation Syntax

- `K` or `K1` - Keep highest 1 die
- `K2`, `K3`, etc. - Keep highest N dice
- `kl` or `kl1` - Keep lowest 1 die
- `kl2`, `kl3`, etc. - Keep lowest N dice

### How It Works

The Keep modifier is the complement to the Drop modifier. Instead of removing dice, it keeps only the specified dice from the result.

**Mathematical Relationship:**

- `4d6K3` (keep highest 3) = `4d6L1` (drop lowest 1)
- `4d6kl2` (keep lowest 2) = `4d6H2` (drop highest 2)

**Implementation:** Internally, Keep is converted to Drop for processing: keeping N highest is equivalent to dropping (quantity - N) lowest.

### Examples

```typescript
// D&D 5e: Roll 4d6, keep highest 3 for ability scores
roll("4d6K3")
// Result: [6, 4, 5, 2] → Keeps [6, 5, 4] = 15

// Advantage: Keep highest from 2d20
roll("2d20K")
// Result: [18, 12] → Keeps [18] = 18

// Keep lowest 2 for disadvantage
roll("2d20kl2")
// Result: [18, 12] → Keeps [18, 12] = 30 (all dice kept)

// Complex example: Keep highest 3 from 5d6
roll("5d6K3")
// Result: [1, 3, 6, 4, 5] → Keeps [6, 5, 4] = 15
```

### Use Cases

- **Ability Score Generation**: `4d6K3` for D&D 5e ability scores
- **Advantage/Disadvantage**: `2d20K` (advantage) or `2d20kl` (disadvantage)
- **Talent Selection**: Roll multiple dice and keep the best results
- **Minimum Guarantee**: Keep lowest to ensure minimum values

### Edge Cases

- Keeping more dice than rolled: Throws validation error
- Keeping 0 dice: Throws validation error
- Keeping all dice: Equivalent to no modifier

---

## Compounding Exploding (!!)

### Notation Syntax

- `!!` - Compound explode once per die (backward compatible)
- `!!0` - Compound explode unlimited (capped at 100 for safety)
- `!!N` - Compound explode with max depth N

### How It Works

Compounding exploding is similar to regular exploding, but instead of creating new dice, it **adds the rerolled value directly to the triggering die**.

**Key Difference from Regular Explode:**

- **Explode (`!`)**: Creates new dice → `[6]` becomes `[6, 5]` (2 dice, sum = 11)
- **Compound (`!!`)**: Modifies existing die → `[6]` becomes `[11]` (1 die, value = 11)

**Process:**

1. Roll dice normally
2. For each die showing maximum value:
   - Reroll that die
   - **Add** the new roll to the die's value (instead of creating a new die)
   - If the new roll is also maximum, repeat
3. Continue until max depth reached or no maximum values rolled

### Examples

```typescript
// Basic compound explode
roll("3d6!!")
// Result: [6, 4, 6]
// - First 6 compounds: roll 5 → 6 + 5 = 11
// - Last 6 compounds: roll 3 → 6 + 3 = 9
// Final: [11, 4, 9] = 24

// Compound with depth limit
roll("1d6!!3") // Max depth 3
// Result: [6] → compounds up to 3 times
// - Roll 1: 6
// - Roll 2: 6 compounds → roll 5 = 6 + 5 = 11
// - Roll 3: 5 doesn't compound (not max)
// Final: [11]

// Unlimited compound (capped at 100)
roll("1d6!!0")
// Result: [6] compounds until non-max rolled or 100 depth reached
```

### Use Cases

- **Damage Systems**: Critical hits that add to base damage (not separate dice)
- **Growing Powers**: Abilities that become stronger on maximum rolls
- **Compounding Bonuses**: Systems where success builds on previous success
- **Single-Die Explosive Systems**: When you want explosive growth on one die value

### Mathematical Properties

**Expected Value Growth:**

- Regular d6: EV = 3.5
- Compound d6!!: EV ≈ 4.2 (higher due to compounding)
- Each compound adds (sides / 2) to the expected value per compound occurrence

**Variance:**

- Compound has lower variance than explode because values are concentrated in fewer dice
- Maximum possible value is bounded by (sides × depth) per die

### Edge Cases

- Depth limit prevents infinite loops (capped at 100)
- Empty dice pools: Returns empty array
- Single die: Works normally, modifying that die's value

---

## Penetrating Exploding (!p)

### Notation Syntax

- `!p` or `!p1` - Penetrate explode once per die (backward compatible)
- `!p0` - Penetrate explode unlimited (capped at 100 for safety)
- `!pN` - Penetrate explode with max depth N

### How It Works

Penetrating exploding is like compound exploding, but with a **diminishing return mechanic**: each subsequent explosion subtracts 1 from the rolled value before adding it.

**Key Mechanic:**

- First explosion: Add full rerolled value
- Second explosion: Subtract 1 from rerolled value before adding
- Third explosion: Subtract 1 from rerolled value before adding
- This creates diminishing returns with each penetration

**Process:**

1. Roll dice normally
2. For each die showing maximum value:
   - Reroll that die
   - **Subtract 1** from the new roll
   - Add (roll - 1) to the die's value
   - If the new roll (before subtraction) is also maximum, repeat
3. Continue until max depth reached or no maximum values rolled

### Examples

```typescript
// Basic penetrate explode
roll("1d6!p")
// Result: [6]
// - 6 penetrates: roll 6 → subtract 1 → 5 → 6 + 5 = 11
// - The 6 (before subtraction) penetrates again: roll 4 → subtract 1 → 3 → 11 + 3 = 14
// - 4 doesn't penetrate (not max)
// Final: [14]

// Penetrate with depth limit
roll("3d6!p2") // Max depth 2
// Result: [6, 4, 6]
// - First 6 penetrates: roll 5 → 6 + 4 = 10 (depth 1)
// - 5 doesn't penetrate
// - Last 6 penetrates: roll 6 → 6 + 5 = 11 (depth 1)
// - 6 penetrates again: roll 3 → 11 + 2 = 13 (depth 2, stops here)
// Final: [10, 4, 13] = 27

// Unlimited penetrate (capped at 100)
roll("1d6!p0")
// Result: [6] penetrates until non-max rolled or 100 depth reached
```

### Use Cases

- **Hackmaster**: Original penetrating dice system
- **Diminishing Returns**: Systems where explosive growth should taper off
- **Balanced Explosions**: Preventing unlimited growth while keeping excitement
- **Realistic Damage**: Critical hits that are powerful but bounded

### Mathematical Properties

**Expected Value:**

- Penetrate d6!p: EV ≈ 3.9 (between regular and compound)
- Each penetration adds less value than compound due to -1 penalty
- Bounded growth prevents extreme outliers

**Comparison:**

- **Regular explode**: Higher variance, unbounded growth per die
- **Compound**: Lower variance, unbounded growth per die
- **Penetrate**: Medium variance, bounded growth per die (diminishing)

### Edge Cases

- Depth limit prevents infinite loops (capped at 100)
- Minimum roll of 1 ensures no negative values (max(1, roll - 1))
- Single die: Works normally, modifying that die's value

---

## Pre-Arithmetic Multiplier (\*)

### Notation Syntax

- `*N` - Multiply dice sum by N (before `+`/`-` arithmetic)

**Important:** Use `*N`, not `**N` (which is total multiply). The pattern matches a single `*` followed by digits, not double `**`.

### How It Works

The pre-arithmetic multiplier multiplies the sum of all dice **after** dice modifiers (drop, keep, explode, etc.) but **before** `plus`/`minus` arithmetic modifiers.

**Order of Operations:**

```
(dice sum × multiply) ± plus/minus
```

**Process:**

1. Apply all dice modifiers (cap, drop, keep, replace, reroll, explode, compound, penetrate, unique)
2. Sum the modified dice
3. **Multiply** by the multiplier
4. Add/subtract arithmetic modifiers (`plus`/`minus`)

### Examples

```typescript
// Basic multiply
roll("2d6*2")
// Result: [4, 5] = 9 → 9 × 2 = 18

// Multiply before addition
roll("2d6*2+3")
// Result: [4, 5] = 9 → (9 × 2) + 3 = 21

// Multiply with other modifiers
roll("4d6L*2+1") // Drop lowest, multiply, add 1
// Result: [1, 3, 5, 6] → Drop 1 → [3, 5, 6] = 14 → (14 × 2) + 1 = 29

// Critical hit: double base damage before modifiers
roll("1d8+5*2")
// Result: [6] → (6 × 2) + 5 = 17
// Note: This is (dice × 2) + modifier, not ((dice + modifier) × 2)

// Multiple dice with multiply
roll("3d6*3")
// Result: [2, 4, 6] = 12 → 12 × 3 = 36
```

### Use Cases

- **Critical Hits**: Double or triple base damage before modifiers (`2d6*2+3`)
- **Area Effects**: Multiply base damage by area size
- **Weapon Multipliers**: Base damage multipliers before bonuses
- **Scaling Systems**: Systems where dice are scaled before modifiers are applied

### Mathematical Properties

- Linear scaling of base dice result
- Multiplicative before additive preserves relative differences
- Works with all dice modifiers (explode, drop, etc.)

### Edge Cases

- Multiply by 1: No change (but still processed)
- Multiply by 0: Results in 0 dice sum (but plus/minus still applied)
- Negative multipliers: Not supported (validation error)
- Floating-point multipliers: Not supported (must be integer)

---

## Total Multiplier (\*\*)

### Notation Syntax

- `**N` - Multiply final total by N (after all other modifiers)

**Important:** Use `**N` (double asterisk), not `*N` (which is pre-arithmetic multiply).

### How It Works

The total multiplier multiplies the **complete final result** after all other modifiers including `plus`/`minus`.

**Order of Operations:**

```
((dice sum × multiply) ± plus/minus) × multiplyTotal
```

**Process:**

1. Apply all dice modifiers
2. Apply pre-arithmetic multiply (`*`)
3. Apply arithmetic modifiers (`plus`/`minus`)
4. **Multiply** by the total multiplier (`**`)
5. Return result

### Examples

```typescript
// Basic total multiply
roll("2d6+3**2")
// Result: [4, 5] = 9 → 9 + 3 = 12 → 12 × 2 = 24

// Total multiply with other modifiers
roll("4d6L+2**3") // Drop lowest, add 2, multiply total by 3
// Result: [1, 3, 5, 6] → Drop 1 → [3, 5, 6] = 14 → 14 + 2 = 16 → 16 × 3 = 48

// Both multipliers together
roll("2d6*2+3**2")
// Result: [4, 5] = 9 → (9 × 2) + 3 = 21 → 21 × 2 = 42
// Breakdown: ((9 × 2) + 3) × 2 = 42

// Critical hit with total multiplier
roll("1d8+5**2") // Critical: multiply final total
// Result: [6] → 6 + 5 = 11 → 11 × 2 = 22
// Note: This is ((dice + modifier) × 2), different from pre-arithmetic

// Compare with pre-arithmetic
roll("1d8+5*2") // (dice × 2) + modifier = (6 × 2) + 5 = 17
roll("1d8+5**2") // ((dice + modifier) × 2) = (6 + 5) × 2 = 22
```

### Use Cases

- **Final Multipliers**: Area effect multipliers, critical hit total multipliers
- **System-Wide Bonuses**: Multipliers that apply to entire result
- **Stacked Effects**: Combined with pre-arithmetic multiply for complex calculations
- **Percentage Bonuses**: Converting percentage bonuses to multipliers

### Mathematical Properties

- Applies after all other calculations
- Can combine with pre-arithmetic multiply: `2d6*2+3**2` = ((sum × 2) + 3) × 2
- Preserves all previous modifier effects

### Edge Cases

- Multiply by 1: No change (but still processed)
- Multiply by 0: Results in 0 total
- Negative multipliers: Not supported (validation error)
- Floating-point multipliers: Not supported (must be integer)

---

## Modifier Order and Precedence

### Application Order

Modifiers are applied in this specific order to ensure consistent and predictable results:

1. **Cap** (`C{...}`) - Limit individual die values
2. **Drop / Keep** (`L`, `H`, `D{...}`, `K`, `kl`) - Remove or keep specific dice
3. **Replace** (`V{...}`) - Replace specific values
4. **Reroll** (`R{...}`) - Reroll dice matching conditions
5. **Explode / Compound / Penetrate** (`!`, `!!`, `!p`) - Explosive dice mechanics
6. **Unique** (`U`) - Ensure unique values
7. **Success Count** (`S{...}`) - Count successes instead of summing
8. **Pre-Arithmetic Multiply** (`*`) - Multiply dice sum before arithmetic
9. **Plus / Minus** (`+`, `-`) - Add or subtract from total
10. **Total Multiply** (`**`) - Multiply final total

### Why This Order Matters

**Example 1: Drop then Explode**

```typescript
roll("4d6L!") // Drop lowest, then explode
// Order: Roll 4d6 → Drop lowest → Explode kept dice
// Result: [1, 3, 5, 6] → Drop 1 → [3, 5, 6] → Explode 6 → [3, 5, 6, 4]
```

**Example 2: Explode then Drop**

```typescript
roll("4d6!L") // Explode, then drop lowest
// Order: Roll 4d6 → Explode → Drop lowest
// Result: [1, 3, 5, 6] → Explode 6 → [1, 3, 5, 6, 4] → Drop 1 → [3, 5, 6, 4]
// Note: Cannot do this in notation, but shows order importance
```

**Example 3: Multiply Order**

```typescript
roll("2d6*2+3**2")
// Order: Roll → Multiply (*) → Plus (+) → MultiplyTotal (**)
// Result: [4, 5] = 9 → (9 × 2) + 3 = 21 → 21 × 2 = 42
```

### Precedence Rules

1. **Dice modifications** (cap, drop, keep, replace, reroll) happen first
2. **Explosive mechanics** (explode, compound, penetrate) happen after dice are finalized
3. **Multipliers** happen in sequence: pre-arithmetic (`*`) before arithmetic, total (`**`) after
4. **Arithmetic** (`+`, `-`) happens between multipliers
5. **Final multiply** (`**`) happens last

---

## Common Use Cases

### D&D 5e Critical Hits

**Option 1: Double Base Damage**

```typescript
roll("2d6+3*2") // Double base damage before modifier
// Result: (7 × 2) + 3 = 17
```

**Option 2: Double Total Damage**

```typescript
roll("2d6+3**2") // Double entire damage including modifier
// Result: (7 + 3) × 2 = 20
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

### Ability Score Generation

```typescript
roll("4d6K3") // D&D 5e: 4d6, keep highest 3
roll("3d6!K2") // With exploding dice, keep highest 2
```

### Compounding Critical Systems

```typescript
roll("1d8!!+5") // Critical: compound base damage, add modifier
roll("2d6!!*2+3") // Critical: compound, multiply base, add modifier
```

---

## Performance Considerations

### Depth Limits

All explosive modifiers (explode, compound, penetrate) have built-in depth limits:

- **Explicit depth**: `!N`, `!!N`, `!pN` - Limited to N depth
- **Unlimited (0)**: `!0`, `!!0`, `!p0` - Capped at 100 for safety
- **Default**: Limited to 1 explosion per die

These limits prevent infinite loops and ensure performance remains predictable.

### Computational Complexity

**O(n × d)** where:

- `n` = number of dice
- `d` = max depth of explosions

**Performance Characteristics:**

- Regular explode: O(n × d) - creates new dice
- Compound: O(n × d) - modifies existing dice (slightly faster)
- Penetrate: O(n × d) - modifies existing dice (same as compound)

### Best Practices

1. **Use depth limits** for explosive modifiers in production code
2. **Keep dice quantities reasonable** (< 100 dice for best performance)
3. **Prefer compound over explode** if you don't need separate dice tracking
4. **Use multipliers sparingly** - they're cheap but unnecessary if not needed

---

## Summary

### Quick Reference

| Modifier       | Notation  | When Applied   | Use Case             |
| -------------- | --------- | -------------- | -------------------- |
| Keep           | `K`, `kl` | After drop     | Keep best/worst dice |
| Compound       | `!!`      | After explode  | Add to die value     |
| Penetrate      | `!p`      | After explode  | Add to die with -1   |
| Pre-Arith Mult | `*N`      | Before `+`/`-` | Multiply base damage |
| Total Mult     | `**N`     | After all      | Multiply final total |

### Notation Examples

```typescript
// Keep
"4d6K3" // Keep highest 3
"2d20kl" // Keep lowest 1

// Compound
"3d6!!" // Compound explode
"1d6!!5" // Compound with depth 5

// Penetrate
"3d6!p" // Penetrate explode
"1d6!p3" // Penetrate with depth 3

// Multipliers
"2d6*2+3" // (dice × 2) + 3
"2d6+3**2" // ((dice + 3) × 2)
"2d6*2+3**2" // (((dice × 2) + 3) × 2)
```

---

## Further Reading

- [RANDSUM_DICE_NOTATION.md](./RANDSUM_DICE_NOTATION.md) - Complete notation reference
- [AGENTS.md](./AGENTS.md) - Development guidelines
- [ERROR_REFERENCE.md](./ERROR_REFERENCE.md) - Error handling guide
