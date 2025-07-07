---
title: "Quick Start"
description: "Learn the basics of RANDSUM with simple examples"
category: "guide"
order: 2
tags: ["basics", "examples", "tutorial"]
---

# Quick Start

Get up and running with RANDSUM in minutes. This guide covers the essential concepts and basic usage patterns.

## Basic Rolling

The simplest way to use RANDSUM is with the `roll()` function:

```typescript
import { roll } from '@randsum/roller';

// Roll a single d20
const d20 = roll('1d20');
console.log(d20.total); // 1-20

// Roll 2d6 with a +3 modifier
const damage = roll('2d6+3');
console.log(damage.total); // 5-15
```

## Understanding Results

RANDSUM returns detailed information about each roll:

```typescript
const result = roll('3d6');

console.log(result.total);     // Final total
console.log(result.dice);      // Individual die results
console.log(result.notation);  // Original notation
console.log(result.breakdown); // Detailed breakdown
```

## Common Patterns

### Advantage/Disadvantage (D&D 5e style)
```typescript
// Advantage - roll 2d20, keep highest
const advantage = roll('2d20H');

// Disadvantage - roll 2d20, keep lowest  
const disadvantage = roll('2d20L');
```

### Ability Score Generation
```typescript
// Roll 4d6, drop lowest (classic D&D)
const abilityScore = roll('4d6L');
```

### Exploding Dice
```typescript
// Exploding d10s - reroll and add on 10s
const exploding = roll('3d10!');
```

## Game System Integration

For specific game systems, use the dedicated packages:

```typescript
import { bladesRoll } from '@randsum/blades';
import { daggerheartRoll } from '@randsum/daggerheart';

// Blades in the Dark action roll
const bladesResult = bladesRoll(3); // 3 dice

// Daggerheart dual d12 roll
const dhResult = daggerheartRoll();
```

## Error Handling

RANDSUM provides clear error messages for invalid notation:

```typescript
try {
  const result = roll('invalid notation');
} catch (error) {
  console.error(error.message); // Clear explanation of the issue
}
```

## Next Steps

- [Dice Notation Reference](/docs/dice-notation) - Complete syntax guide
- [API Documentation](/docs/api) - Full API reference
- [Examples](/examples) - More complex usage patterns
