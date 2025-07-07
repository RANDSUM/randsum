---
title: "roll()"
description: "Execute dice rolls using RANDSUM notation"
package: "@randsum/roller"
category: "function"
signature: "roll(notation: string): RollResult"
parameters:
  - name: "notation"
    type: "string"
    description: "Valid RANDSUM dice notation string"
    required: true
returns:
  type: "RollResult"
  description: "Detailed result object containing total, dice, and breakdown"
since: "1.0.0"
examples:
  - "roll('2d6+3')"
  - "roll('4d6L')"
  - "roll('1d20')"
seeAlso:
  - "validate-notation"
  - "RollResult"
namespace: "@randsum/roller"
order: 1
tags: ["core", "function", "rolling"]
---

# roll()

The primary function for executing dice rolls using RANDSUM notation.

## Syntax

```typescript
roll(notation: string): RollResult
```

## Parameters

### `notation` (string)

A valid RANDSUM dice notation string. The notation follows the pattern:

```
{quantity}d{sides}{modifiers}
```

**Examples:**
- `"2d6"` - Roll 2 six-sided dice
- `"1d20+5"` - Roll 1d20 and add 5
- `"4d6L"` - Roll 4d6, drop the lowest
- `"3d6!"` - Roll 3d6 with exploding dice

## Return Value

Returns a `RollResult` object with the following properties:

```typescript
interface RollResult {
  total: number;        // Final calculated total
  dice: number[];       // Individual die results
  notation: string;     // Original notation string
  breakdown: string;    // Human-readable breakdown
  modifiers?: ModifierResult[]; // Applied modifiers
}
```

## Examples

### Basic Rolling

```typescript
import { roll } from '@randsum/roller';

// Simple roll
const result = roll('2d6');
console.log(result.total);    // 2-12
console.log(result.dice);     // [3, 5] (example)
console.log(result.breakdown); // "2d6: [3, 5] = 8"
```

### With Modifiers

```typescript
// Roll with arithmetic modifier
const damage = roll('1d8+3');
console.log(damage.total); // 4-11

// Roll with drop modifier
const abilityScore = roll('4d6L');
console.log(abilityScore.total); // 3-18 (weighted high)
```

### Advanced Notation

```typescript
// Complex modifier combination
const complex = roll('4d6LR{1}!+2');
console.log(complex.breakdown);
// Shows detailed breakdown of all modifiers applied
```

## Error Handling

The function throws a `NotationError` for invalid notation:

```typescript
try {
  const result = roll('invalid notation');
} catch (error) {
  if (error instanceof NotationError) {
    console.error('Invalid notation:', error.message);
  }
}
```

## Common Patterns

### D&D 5e Style

```typescript
// Advantage
const advantage = roll('2d20H');

// Disadvantage  
const disadvantage = roll('2d20L');

// Ability score generation
const stats = [
  roll('4d6L').total,
  roll('4d6L').total,
  roll('4d6L').total,
  roll('4d6L').total,
  roll('4d6L').total,
  roll('4d6L').total
];
```

### Damage Calculations

```typescript
// Regular weapon damage
const swordDamage = roll('1d8+3');

// Critical hit (double dice)
const criticalDamage = roll('2d8+3');

// Spell damage with save
const fireballDamage = roll('8d6');
const savedDamage = Math.floor(fireballDamage.total / 2);
```

## Performance Notes

- The function is optimized for repeated calls
- Results are calculated immediately (not lazy)
- Memory usage is minimal for typical gaming scenarios
- Complex modifiers may have slight performance impact

## See Also

- [`validateNotation()`](/api/validate-notation) - Validate notation without rolling
- [`RollResult`](/api/roll-result) - Return value interface
- [Dice Notation Guide](/docs/dice-notation) - Complete syntax reference
