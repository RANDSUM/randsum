<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/randsum/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>@randsum/roller</h1>
  <h3>Advanced Dice Rolling for JavaScript & TypeScript</h3>

[![npm version](https://img.shields.io/npm/v/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/roller)](https://bundlephobia.com/package/@randsum/roller)
[![Types](https://img.shields.io/npm/types/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![License](https://img.shields.io/npm/l/@randsum/roller)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)

</div>

A flexible, type-safe dice rolling implementation for tabletop RPGs, game development, and probability simulations that supports:

- 🎲 Standard dice notation (`4d6`, `2d20H`, etc.)
- 🎯 Complex modifiers (drop lowest, reroll, exploding dice)
- 🔒 Full TypeScript support with intelligent type inference
- 🎮 Perfect for games, RPGs, and simulations
- 🪶 Tree-shakeable implementation for minimal bundle size
- 📦 Optimized for performance and reliability
- 🧩 Extensible architecture for custom game systems
- 🌐 Works in Node.js, browsers, and React Native

## Installation

```bash
npm install @randsum/roller
# or
yarn add @randsum/roller
# or
bun add @randsum/roller
```

## CLI Usage

Roll dice directly from your terminal:

```bash
npx randsum 2d20    # Roll two twenty-sided dice
npx randsum 4d6L    # Roll 4d6, drop lowest
npx randsum 3d8+2   # Roll three d8s and add 2
```

Example output:

```text
🎲 Roll Result:
───────────────
Total: 24
Rolls: [14, 10]
Description: Roll 2d20
```
