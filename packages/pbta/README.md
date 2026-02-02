<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/pbta</h1>
  <h3>Powered by the Apocalypse dice rolling for Randsum</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/pbta)](https://www.npmjs.com/package/@randsum/pbta)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/pbta)](https://bundlephobia.com/package/@randsum/pbta)
[![Types](https://img.shields.io/npm/types/@randsum/pbta)](https://www.npmjs.com/package/@randsum/pbta)
[![License](https://img.shields.io/npm/l/@randsum/pbta)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/pbta)](https://www.npmjs.com/package/@randsum/pbta)

</div>

A type-safe implementation of [Powered by the Apocalypse](https://apocalypse-world.com/) dice rolling mechanics that supports:

- 🎲 Standard 2d6 + stat rolls
- 🎯 Automatic outcome determination (strong hit, weak hit, miss)
- ⚡ Advantage/disadvantage mechanics
- 🔒 Full TypeScript support
- 🪶 Tree-shakeable implementation

Works with any PbtA game including Dungeon World, Monster of the Week, Apocalypse World, Masks, and more.

## Installation

```bash
npm install @randsum/pbta
# or
yarn add @randsum/pbta
# or
bun add @randsum/pbta
```

## Usage

```typescript
import { roll } from "@randsum/pbta"

// Basic roll
const result = roll({ stat: 2 })
// result.result: 'strong_hit' | 'weak_hit' | 'miss'

// With bonuses
const result = roll({
  stat: 1,
  forward: 1, // One-time bonus
  ongoing: 0 // Persistent bonus
})

// With advantage (roll 3d6, keep 2 highest)
const result = roll({
  stat: 2,
  advantage: true
})

// With disadvantage (roll 3d6, keep 2 lowest)
const result = roll({
  stat: 2,
  disadvantage: true
})
```

## API Reference

### `roll`

Makes a PbtA roll following standard mechanics.

```typescript
function roll(arg: PbtARollArgument): GameRollResult<PbtAOutcome, PbtARollDetails, RollRecord>
```

**Parameters:**

- `stat`: Stat modifier (typically -3 to +4)
- `forward?`: One-time bonus
- `ongoing?`: Persistent bonus
- `advantage?`: Roll with advantage (3d6, keep 2 highest)
- `disadvantage?`: Roll with disadvantage (3d6, keep 2 lowest)

**Returns:**

- `result`: 'strong_hit' | 'weak_hit' | 'miss'
- `total`: Final roll total
- `details`: Additional roll information
- `rolls`: Full roll records with modifier history

## Outcomes

- **Strong Hit (10+)**: Complete success, you do what you set out to do
- **Weak Hit (7-9)**: Partial success, you do it but with a cost or complication
- **Miss (6-)**: Failure, things go wrong

## Related Packages

- [@randsum/roller](https://github.com/RANDSUM/randsum/tree/main/packages/roller): Core dice rolling implementation

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
