# Getting Started with Randsum

<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>Randsum: The Ultimate Dice Rolling Ecosystem</h1>
</div>

## Introduction

**Randsum** is a comprehensive, type-safe dice rolling ecosystem for JavaScript and TypeScript. Whether you're building a virtual tabletop application, a game, or just need reliable dice rolling functionality, Randsum provides everything you need with a focus on:

- 🎲 **Type safety** - Full TypeScript support with intelligent type inference
- 🚀 **Performance** - Optimized for speed and minimal bundle size
- 🧩 **Modularity** - Use only what you need with tree-shakeable packages
- 📚 **Extensibility** - Easy to extend for custom game systems
- 🔍 **Reliability** - Thoroughly tested and production-ready

## Installation

Randsum is organized as a collection of packages, each serving a specific purpose. Start with the core dice rolling package:

```bash
# Using npm
npm install @randsum/dice

# Using yarn
yarn add @randsum/dice

# Using bun
bun add @randsum/dice
```

For specific game systems or additional functionality, install the relevant packages:

```bash
# For dice notation parsing
npm install @randsum/notation

# For D&D 5th Edition
npm install @randsum/5e

# For Root RPG
npm install @randsum/root-rpg

# For Blades in the Dark
npm install @randsum/blades

# For Salvage Union
npm install @randsum/salvageunion
```

## Basic Usage

### Simple Dice Rolling

```typescript
import { D20, D6, roll } from '@randsum/dice';

// Roll a single die
const d20Result = D20.roll(); // Returns a number between 1 and 20

// Roll multiple dice
const fourD6 = D6.roll(4); // Roll 4d6, returns an array of results

// Get the sum
const sum = fourD6.sum; // Total of all dice

// Access individual results
const rolls = fourD6.rolls; // Array of individual die results
```

### Using Dice Notation

```typescript
import { roll } from '@randsum/dice';
import { validateNotation } from '@randsum/notation';

// Roll using standard dice notation
const result = roll('2d20+5');
console.log(result.sum); // Total of 2d20 plus 5
console.log(result.rolls); // Array of the two d20 results

// Validate notation before rolling
const validation = validateNotation('4d6L');
if (validation.valid) {
  console.log(validation.description); // ["Roll 4 six-sided dice", "Drop lowest roll"]
  const rollResult = roll('4d6L');
  console.log(rollResult.sum);
}
```

### Advanced Features

```typescript
import { roll } from '@randsum/dice';

// Drop lowest die (common for D&D character creation)
const statRoll = roll('4d6L');

// Advantage (roll 2d20, take highest)
const advantageRoll = roll('2d20H');

// Disadvantage (roll 2d20, take lowest)
const disadvantageRoll = roll('2d20L');

// Exploding dice (roll again on maximum value)
const explodingDice = roll('3d6!');

// Reroll dice below a threshold
const rerollLowDice = roll('4d6R{<3}');

// Combine modifiers
const complexRoll = roll('4d6L!R{<2}+2');
```

## Game System Specific Packages

### D&D 5th Edition

```typescript
import { rollAbilityCheck, rollSavingThrow, rollAttack } from '@randsum/5e';

// Roll an ability check with advantage
const result = rollAbilityCheck({
  abilityScore: 16, // +3 modifier
  proficiencyBonus: 2,
  isProficient: true,
  hasAdvantage: true
});

// Roll a saving throw
const saveResult = rollSavingThrow({
  abilityScore: 14, // +2 modifier
  proficiencyBonus: 2,
  isProficient: false,
  hasDisadvantage: true
});

// Roll an attack
const attackResult = rollAttack({
  attackBonus: 5,
  hasAdvantage: false,
  damageFormula: '1d8+3'
});
```

### Blades in the Dark

```typescript
import { rollAction } from '@randsum/blades';

// Roll an action with 2 dice
const result = rollAction(2);
console.log(result.outcome); // 'critical', 'success', 'partial', or 'failure'
console.log(result.highest); // Highest die result
```

### Root RPG

```typescript
import { rollAction } from '@randsum/root-rpg';

// Roll an action with 2 dice
const result = rollAction(2);
console.log(result.outcome); // 'critical', 'success', 'partial', or 'failure'
console.log(result.highest); // Highest die result
```

## Advanced Topics

### Custom Random Number Generation

```typescript
import { setRandomFunction, D20 } from '@randsum/dice';

// Use your own random number generator
setRandomFunction(() => {
  // Return a number between 0 (inclusive) and 1 (exclusive)
  return Math.random(); // Default implementation
});

// Now all dice rolls will use your custom RNG
const result = D20.roll();
```

### Creating Custom Dice

```typescript
import { Die, CustomDie } from '@randsum/dice';

// Create a custom numeric die
const D7 = new Die(7);

// Create a die with custom faces
const FudgeDie = new CustomDie(['+', '+', '0', '0', '-', '-']);
const result = FudgeDie.roll();
```

### Working with Roll Results

```typescript
import { roll } from '@randsum/dice';

const result = roll('4d6L');

// Access roll information
console.log(result.sum); // Total after modifiers
console.log(result.rolls); // Array of individual die results
console.log(result.droppedRolls); // Array of dropped dice (if any)
console.log(result.notation); // Original notation used
console.log(result.sides); // Number of sides on the dice
console.log(result.quantity); // Number of dice rolled
```

## Best Practices

### Bundle Size Optimization

For web applications where bundle size is critical:

```typescript
// Import only what you need
import { D20 } from '@randsum/dice';

// Instead of
// import { D4, D6, D8, D10, D12, D20, D100 } from '@randsum/dice';
```

### Type Safety

Leverage TypeScript for better development experience:

```typescript
import { type DiceNotation } from '@randsum/notation';

// Type-safe dice notation
function rollDamage(weapon: 'dagger' | 'longsword'): number {
  const notation: DiceNotation = weapon === 'dagger' ? '1d4+2' : '1d8+2';
  return roll(notation).sum;
}
```

## Further Reading

- [Randsum Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/notation/RANDSUM_DICE_NOTATION.md) - Complete dice notation reference

- [API Documentation](https://github.com/RANDSUM/randsum) - Full API documentation

## Community and Support

- [GitHub Issues](https://github.com/RANDSUM/randsum/issues) - Report bugs or request features
- [GitHub Discussions](https://github.com/RANDSUM/randsum/discussions) - Ask questions and share ideas
- [Contributing](https://github.com/RANDSUM/randsum/blob/main/CONTRIBUTING.md) - Help improve Randsum

---

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
