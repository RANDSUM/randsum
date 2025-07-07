---
title: "Basic Rolling Examples"
description: "Simple examples to get started with RANDSUM dice rolling"
package: "@randsum/roller"
difficulty: "beginner"
tags: ["basics", "tutorial", "examples"]
---

# Basic Rolling Examples

Learn the fundamentals of RANDSUM with these simple, practical examples.

## Simple Dice Rolls

Start with the most basic dice rolling patterns:

```typescript
import { roll } from '@randsum/roller';

// Single die
const d20 = roll('1d20');
console.log(`Rolled: ${d20.total}`); // 1-20

// Multiple dice
const damage = roll('2d6');
console.log(`Damage: ${damage.total}`); // 2-12

// With modifiers
const attack = roll('1d20+5');
console.log(`Attack roll: ${attack.total}`); // 6-25
```

## Common Gaming Patterns

### D&D Style Rolls

```typescript
// Ability score generation (4d6, drop lowest)
const strength = roll('4d6L');
console.log(`Strength: ${strength.total}`); // 3-18, weighted high

// Advantage (2d20, keep highest)
const advantage = roll('2d20H');
console.log(`With advantage: ${advantage.total}`);

// Disadvantage (2d20, keep lowest)
const disadvantage = roll('2d20L');
console.log(`With disadvantage: ${disadvantage.total}`);
```

### Damage Rolls

```typescript
// Weapon damage
const swordDamage = roll('1d8+3');
console.log(`Sword damage: ${swordDamage.total}`);

// Critical hit (double dice)
const criticalHit = roll('2d8+3');
console.log(`Critical damage: ${criticalHit.total}`);

// Fireball damage
const fireball = roll('8d6');
console.log(`Fireball damage: ${fireball.total}`);
```

## Exploring Results

RANDSUM provides detailed information about each roll:

```typescript
const result = roll('3d6+2');

console.log('=== Roll Results ===');
console.log(`Notation: ${result.notation}`);     // "3d6+2"
console.log(`Total: ${result.total}`);           // Final result
console.log(`Dice: [${result.dice.join(', ')}]`); // Individual dice
console.log(`Breakdown: ${result.breakdown}`);   // Human-readable
```

## Handling Edge Cases

```typescript
// Minimum possible roll
const allOnes = roll('3d6'); // Could be 3 (1+1+1)

// Maximum possible roll  
const allSixes = roll('3d6'); // Could be 18 (6+6+6)

// Zero dice (edge case)
try {
  const zero = roll('0d6');
  console.log(zero.total); // 0
} catch (error) {
  console.error('Error:', error.message);
}
```

## Multiple Rolls

```typescript
// Roll multiple times
function rollStats() {
  const stats = [];
  for (let i = 0; i < 6; i++) {
    stats.push(roll('4d6L').total);
  }
  return stats;
}

const characterStats = rollStats();
console.log('Character stats:', characterStats);
```

## Probability Exploration

```typescript
// Simulate many rolls to see distribution
function simulateRolls(notation: string, count: number = 1000) {
  const results: number[] = [];
  
  for (let i = 0; i < count; i++) {
    results.push(roll(notation).total);
  }
  
  const average = results.reduce((a, b) => a + b) / results.length;
  const min = Math.min(...results);
  const max = Math.max(...results);
  
  console.log(`${notation} over ${count} rolls:`);
  console.log(`  Average: ${average.toFixed(2)}`);
  console.log(`  Range: ${min}-${max}`);
}

// Compare different dice combinations
simulateRolls('1d20');    // Flat distribution
simulateRolls('3d6');     // Bell curve
simulateRolls('4d6L');    // Weighted toward higher values
```

## Error Handling

```typescript
// Always validate user input
function safeRoll(notation: string) {
  try {
    return roll(notation);
  } catch (error) {
    console.error(`Invalid notation "${notation}":`, error.message);
    return null;
  }
}

// Test with various inputs
console.log(safeRoll('2d6'));        // Valid
console.log(safeRoll('invalid'));    // Invalid
console.log(safeRoll('1d'));         // Invalid
console.log(safeRoll('d6'));         // Invalid (missing quantity)
```

## Next Steps

Once you're comfortable with basic rolling:

- Try [Advanced Modifiers](/examples/advanced-modifiers)
- Explore [Game System Integration](/examples/game-systems)
- Learn about [Custom Dice Faces](/examples/custom-faces)
