---
title: "@randsum/blades"
description: "Blades in the Dark dice mechanics implementation"
version: "1.0.0"
npmPackage: "@randsum/blades"
githubPath: "packages/blades"
category: "game-system"
tags: ["blades", "fitd", "pbta", "game-system"]
order: 2
status: "stable"
minNodeVersion: "16.0.0"
dependencies: ["@randsum/roller"]
peerDependencies: ["@randsum/roller"]
license: "MIT"
author: "RANDSUM Team"
homepage: "https://randsum.github.io/randsum"
repository: "https://github.com/RANDSUM/randsum"
hasApiDocs: true
hasExamples: true
hasTutorials: false
---

# @randsum/blades

Implementation of Blades in the Dark dice mechanics for the Forged in the Dark family of games.

## Installation

```bash
npm install @randsum/blades
```

## Basic Usage

```typescript
import { bladesRoll, fortuneRoll, resistanceRoll } from '@randsum/blades';

// Action roll with 3 dice
const action = bladesRoll(3);
console.log(action.result); // "critical", "success", "partial", or "failure"
console.log(action.dice);   // [4, 6, 2] - individual die results

// Fortune roll (GM rolls)
const fortune = fortuneRoll(2);

// Resistance roll
const resistance = resistanceRoll(4);
console.log(resistance.stress); // Stress taken (1-6)
```

## Action Rolls

Action rolls are the core mechanic in Blades in the Dark:

```typescript
// Zero dice (desperate situation)
const desperate = bladesRoll(0);
// Automatically rolls 2d6, takes lowest

// One die (risky situation)  
const risky = bladesRoll(1);

// Multiple dice (controlled situation)
const controlled = bladesRoll(4);
```

### Results

Action rolls return detailed results:

```typescript
const result = bladesRoll(3);

console.log(result.result);     // "critical" | "success" | "partial" | "failure"
console.log(result.dice);       // Individual die results
console.log(result.highest);    // Highest die rolled
console.log(result.criticals);  // Number of 6s rolled
console.log(result.successes);  // Number of 4+ rolled
```

## Fortune Rolls

Fortune rolls determine how well NPCs or situations develop:

```typescript
// Simple fortune roll
const fortune = fortuneRoll(2);

// With custom difficulty
const hardFortune = fortuneRoll(1, { difficulty: 'extreme' });
```

## Resistance Rolls

Resistance rolls determine stress cost when resisting consequences:

```typescript
const resistance = resistanceRoll(3); // 3 = attribute rating

console.log(resistance.stress);    // 1-6 stress taken
console.log(resistance.dice);      // Die results
console.log(resistance.highest);   // Highest die (determines stress)
```

## Push Yourself

Handle "push yourself" mechanics:

```typescript
import { pushYourself } from '@randsum/blades';

// Add +1d to a roll
const pushed = bladesRoll(2, { push: true });
// Equivalent to bladesRoll(3) but tracks the push
```

## Devil's Bargain

Track devil's bargains:

```typescript
const bargain = bladesRoll(2, { devilsBargain: true });
// Adds +1d and tracks the bargain was taken
```

## Teamwork Actions

Support for teamwork mechanics:

```typescript
import { teamworkRoll, leadGroupAction } from '@randsum/blades';

// Setup action (gives +1d to teammate)
const setup = teamworkRoll('setup', 2);

// Group action (leader rolls for everyone)
const group = leadGroupAction([3, 2, 4, 1]); // Each member's dice
```

## Advanced Features

### Custom Outcomes

Define custom outcome interpretations:

```typescript
const custom = bladesRoll(3, {
  outcomes: {
    critical: 'Exceptional result!',
    success: 'You do it well',
    partial: 'You do it, but...',
    failure: 'Things go badly'
  }
});
```

### Trauma Tracking

Built-in trauma tracking for characters:

```typescript
import { Character } from '@randsum/blades';

const character = new Character();
character.addStress(3);
character.addTrauma('reckless');

const roll = character.actionRoll('prowl', 2);
```

## TypeScript Support

```typescript
interface BladesResult {
  result: 'critical' | 'success' | 'partial' | 'failure';
  dice: number[];
  highest: number;
  criticals: number;
  successes: number;
  stress?: number;
}
```

## Integration with Core

Works seamlessly with `@randsum/roller`:

```typescript
import { roll } from '@randsum/roller';
import { interpretBlades } from '@randsum/blades';

// Manual roll interpretation
const diceResult = roll('3d6');
const bladesResult = interpretBlades(diceResult.dice);
```
