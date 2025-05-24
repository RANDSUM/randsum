<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>Randsum</h1>
  <h3>An Ergonomic, flexible, and type-safe dice rolling ecosystem for NPM</h3>

[![License](https://img.shields.io/npm/l/randsum)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![CI Status](https://github.com/RANDSUM/randsum/workflows/CI/badge.svg)](https://github.com/RANDSUM/randsum/actions)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Built with Moon](https://img.shields.io/badge/Built%20with-Moon-blue?style=flat)](https://moonrepo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NPM Downloads](https://img.shields.io/npm/dm/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/RANDSUM/randsum/commits/main)
[![Types](https://img.shields.io/badge/Types-included-blue)](https://www.npmjs.com/package/@randsum/dice)

</div>

## 🚀 Quick Example

```typescript
import { D20, roll } from '@randsum/dice'

// Simple d20 roll
D20.roll() // Returns 1-20

// Complex dice notation
roll('4d6L') // Roll 4d6, drop lowest

// D&D 5e character ability score generation
const abilityScores = Array.from({ length: 6 }, () => roll('4d6L').sum)

// Advantage and disadvantage
roll('2d20H') // Roll with advantage (2d20, keep highest)
roll('2d20L') // Roll with disadvantage (2d20, keep lowest)
```

Or directly from your terminal:

```bash
npx randsum 2d20    # Roll two twenty-sided dice
npx randsum 4d6L    # Character stat roll (drop lowest)
npx randsum 2d20H   # Roll with advantage
```

## 📦 Packages

This monorepo contains the following packages and applications:

### [`@randsum/dice`](https://www.npmjs.com/package/@randsum/dice)

[![npm version](https://img.shields.io/npm/v/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/dice)](https://bundlephobia.com/package/@randsum/dice)
[![Types](https://img.shields.io/npm/types/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)
[![Downloads](https://img.shields.io/npm/dm/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)

A Flexible, Type-safe, and Tree-shakeable dice rolling implementation. Where it all started. Optimized for minimal bundle size.

```bash
npm install @randsum/dice
```

### [`@randsum/notation`](https://www.npmjs.com/package/@randsum/notation)

[![npm version](https://img.shields.io/npm/v/@randsum/notation)](https://www.npmjs.com/package/@randsum/notation)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/notation)](https://bundlephobia.com/package/@randsum/notation)
[![Types](https://img.shields.io/npm/types/@randsum/notation)](https://www.npmjs.com/package/@randsum/notation)
[![Downloads](https://img.shields.io/npm/dm/@randsum/notation)](https://www.npmjs.com/package/@randsum/notation)

Dice notation parser and validator, for parsing [Randsum Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/notation/RANDSUM_DICE_NOTATION.md).

```bash
npm install @randsum/notation
```

### [`@randsum/5e`](https://www.npmjs.com/package/@randsum/5e)

[![npm version](https://img.shields.io/npm/v/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/5e)](https://bundlephobia.com/package/@randsum/5e)
[![Types](https://img.shields.io/npm/types/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)
[![Downloads](https://img.shields.io/npm/dm/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)

A dice roller compatible with 5th Edition RPG Systems

```bash
npm install @randsum/5e
```

### [`@randsum/root-rpg`](https://www.npmjs.com/package/@randsum/root-rpg)

[![npm version](https://img.shields.io/npm/v/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/root-rpg)](https://bundlephobia.com/package/@randsum/root-rpg)
[![Types](https://img.shields.io/npm/types/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![Downloads](https://img.shields.io/npm/dm/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)

A dice roller for the [Root RPG](https://magpiegames.com/collections/root) system.

```bash
npm install @randsum/root-rpg
```

### [`@randsum/blades`](https://www.npmjs.com/package/@randsum/blades)

[![npm version](https://img.shields.io/npm/v/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/blades)](https://bundlephobia.com/package/@randsum/blades)
[![Types](https://img.shields.io/npm/types/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![Downloads](https://img.shields.io/npm/dm/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)

A dice roller for [Blades in the dark](https://bladesinthedark.com/greetings-scoundrel) (and forged in the dark) RPG systems.

```bash
npm install @randsum/blades
```

### [`@randsum/salvageunion`](https://www.npmjs.com/package/@randsum/salvageunion)

[![npm version](https://img.shields.io/npm/v/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/salvageunion)](https://bundlephobia.com/package/@randsum/salvageunion)
[![Types](https://img.shields.io/npm/types/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![Downloads](https://img.shields.io/npm/dm/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)

A dice roller for the [Salvage Union](https://leyline.press/collections/salvage-union?srsltid=AfmBOopmUVkzzc13P3pZl4Sjiinoyym9Fpa4-h-qCQOkGcBaGGQ7Z3yB) RPG system. Contains all official Salvage Union roll tables, and a contextual roll function for determining success.

```bash
npm install @randsum/salvageunion
```

### `@randsum/core`

[![npm version](https://img.shields.io/npm/v/@randsum/core)](https://www.npmjs.com/package/@randsum/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/core)](https://bundlephobia.com/package/@randsum/core)
[![Types](https://img.shields.io/npm/types/@randsum/core)](https://www.npmjs.com/package/@randsum/core)

Internal package containing shared utilities and types. Not intended for direct usage. All types are exported in each subsequent package for ease of use.

## 🛠️ Development

This is a monorepo powered by [Moon](https://moonrepo.dev) and [Bun](https://bun.sh). To get started:

```bash
# Clone the repository
git clone https://github.com/RANDSUM/randsum.git
cd randsum

# Install dependencies for all packages
bun install

# Build all packages
bun moon :build

# Run tests
bun moon :test

# Run type checks
bun moon :tsCheck

# Lint and format
bun moon :lint
bun moon :format
```

### Moon Tasks

Moon manages our task pipeline and dependencies. Common tasks include:

- `:build` - Build all packages
- `:test` - Run all tests
- `:lint` - Run ESLint checks
- `:tsCheck` - Run TypeScript checks
- `:publish` - Publish packages (CI only)
- `:lint:fix` - Run ESLint and fix issues
- `:ci` - Run all checks (build, test, lint, tsCheck)

Each package can be targeted directly with `moon [package]:task`, for example:

```bash
bun moon dice:test    # Run tests for @randsum/dice only
bun moon blades:build # Build @randsum/blades only
```

## Further Reading

- [Getting Started](https://github.com/RANDSUM/randsum/blob/main/GETTING_STARTED.md) - Installation and Documentation for using `randsum`

- [Randsum Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/notation/RANDSUM_DICE_NOTATION.md) - A guide for using [Dice Notation](https://en.wikipedia.org/wiki/Dice_notation) with `randsum`.

- [Sophie's Dice Notation](https://sophiehoulden.com/dice/documentation/notation.html) - a great dice notation guide that helped me along the way

- [\_why's poignant guide to ruby](https://poignant.guide/) - \_why not?

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

---

## Why did you make this?

Sometime around 2012, I decided I wanted to learn to program. I had installed ruby on the best laptop six-hundred dollars could buy, set to make a dice roller as an easy first project.

I spent an easy 30 minutes trying to figure out how to make `rand(n)` return `1...n` instead of `0...(n-1)`.

When I found the answer, I laughed and laughed. I've been chasing that high ever since.

---

## LLM Statement

I love this thing we call programming. It seems as if (biiiiig scare quotes) "AI" is going to be a part of it moving forward. You will find the extent of my comfort with these tools in this project, for it is the closest thing I have on this earth to a life's work, and programming is my craft. I care deeply about it, and there is no better way for me to understand LLM's and their place in my craft than to use them. There is no better place for me to use and understand them than here. We'll have to see the extent to which I come to regret/resent/respect this decision in the coming years together!

---

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
