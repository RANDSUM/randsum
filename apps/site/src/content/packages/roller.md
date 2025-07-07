---
title: "@randsum/roller"
description: "Core dice rolling engine with advanced notation support"
version: "1.0.0"
npmPackage: "@randsum/roller"
githubPath: "packages/roller"
category: "core"
tags: ["dice", "rolling", "core", "notation"]
order: 1
status: "stable"
minNodeVersion: "16.0.0"
dependencies: []
license: "MIT"
author: "RANDSUM Team"
homepage: "https://randsum.github.io/randsum"
repository: "https://github.com/RANDSUM/randsum"
hasApiDocs: true
hasExamples: true
hasTutorials: true
---

# @randsum/roller

The core RANDSUM package providing advanced dice rolling capabilities with sophisticated notation support.

## Installation

```bash
npm install @randsum/roller
```

## Basic Usage

```typescript
import { roll, validateNotation } from '@randsum/roller';

// Simple roll
const result = roll('2d6+3');
console.log(result.total); // 5-15

// Validate notation before rolling
if (validateNotation('4d6L')) {
  const abilityScore = roll('4d6L');
  console.log(abilityScore.total);
}
```

## Advanced Features

### Drop Modifiers
```typescript
// Drop lowest
roll('4d6L');   // Roll 4d6, drop 1 lowest
roll('4d6L2');  // Roll 4d6, drop 2 lowest

// Drop highest  
roll('2d20H');  // Roll 2d20, drop 1 highest

// Drop both
roll('5d6LH');  // Roll 5d6, drop lowest and highest
```

### Reroll Modifiers
```typescript
// Reroll specific values
roll('4d6R{1}');     // Reroll any 1s
roll('4d6R{1,2}');   // Reroll 1s and 2s

// Reroll ranges
roll('4d6R{<3}');    // Reroll anything below 3
roll('4d6R{>4}');    // Reroll anything above 4
```

### Exploding Dice
```typescript
// Exploding dice - reroll and add on max value
roll('3d6!');   // Explode on 6s
roll('2d10!');  // Explode on 10s
```

### Unique Results
```typescript
// Ensure all dice show different values
roll('4d20U');  // All 4 dice must be different
roll('5d6U');   // All 5 dice must be different
```

### Capping Results
```typescript
// Cap maximum values
roll('4d20C{>18}');  // No results above 18

// Cap minimum values  
roll('4d20C{<3}');   // No results below 3

// Cap ranges
roll('4d6C{<2,>5}'); // Results must be 2-5
```

## API Reference

### `roll(notation: string): RollResult`

Executes a dice roll using RANDSUM notation.

**Parameters:**
- `notation` - Valid RANDSUM dice notation string

**Returns:** `RollResult` object with:
- `total: number` - Final calculated total
- `dice: number[]` - Individual die results
- `notation: string` - Original notation
- `breakdown: string` - Human-readable breakdown

### `validateNotation(notation: string): boolean`

Validates dice notation syntax without executing the roll.

**Parameters:**
- `notation` - Dice notation string to validate

**Returns:** `true` if valid, `false` otherwise

## Custom Dice Faces

Create dice with custom faces (symbols, text, etc.):

```typescript
// Coin flip
roll('2d{HT}');  // Heads/Tails

// Direction dice
roll('1d{NSEW}'); // North/South/East/West

// Combat symbols
roll('3d{⚔️🛡️🏹}'); // Sword/Shield/Bow
```

**Note:** Custom faces cannot be combined with other modifiers.

## Error Handling

```typescript
try {
  const result = roll('invalid');
} catch (error) {
  if (error instanceof NotationError) {
    console.error('Invalid notation:', error.message);
  }
}
```

## TypeScript Support

Full TypeScript definitions included:

```typescript
interface RollResult {
  total: number;
  dice: number[];
  notation: string;
  breakdown: string;
  modifiers?: ModifierResult[];
}
```
