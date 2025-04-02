<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.>
  <h1>randsum</h1>
  <h3>A flexible, type-safe dice rolling ecosystem written in Typescript</h3>

[![License](https://img.shields.io/npm/l/randsum)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![CI Status](https://github.com/RANDSUM/randsum/workflows/CI/badge.svg)](https://github.com/RANDSUM/randsum/actions)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Built with Moon](https://img.shields.io/badge/Built%20with-Moon-blue?style=flat)](https://moonrepo.dev)

</div>

## 🚀 Quick Example

```typescript
import { D20, roll } from '@randsum/dice'

// Simple d20 roll
D20.roll() // Returns 1-20

// Complex dice notation
roll('4d6L') // Roll 4d6, drop lowest
```

Or directly from your terminal:

```bash
npx randsum 2d20    # Roll two twenty-sided dice
```

## 📦 Packages

This monorepo contains the following packages:

### [`@randsum/dice`](https://www.npmjs.com/package/@randsum/dice)

[![npm version](https://img.shields.io/npm/v/@randsum/dice)](https://www.npmjs.com/package/@randsum/dice)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/dice)](https://bundlephobia.com/package/@randsum/dice)

A Flexible, Type-safe, and Tree-shakeable dice rolling implementation. Where it all started.

```bash
npm install @randsum/dice
```

### [`@randsum/notation`](https://www.npmjs.com/package/@randsum/notation)

[![npm version](https://img.shields.io/npm/v/@randsum/notation)](https://www.npmjs.com/package/@randsum/notation)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/notation)](https://bundlephobia.com/package/@randsum/notation)

Dice notation parser and validator, for parsing[Randsum Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/notation/RANDSUM_DICE_NOTATION.md).

```bash
npm install @randsum/notation
```

### [`@randsum/5e`](https://www.npmjs.com/package/@randsum/5e)

[![npm version](https://img.shields.io/npm/v/@randsum/5e)](https://www.npmjs.com/package/@randsum/5e)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/5e)](https://bundlephobia.com/package/@randsum/5e)

A dice roller compatible with 5th Edition RPG Systems

```bash
npm install @randsum/5e
```

### [`@randsum/root-rpg`](https://www.npmjs.com/package/@randsum/root-rpg)

[![npm version](https://img.shields.io/npm/v/@randsum/root-rpg)](https://www.npmjs.com/package/@randsum/root-rpg)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/root-rpg)](https://bundlephobia.com/package/@randsum/root-rpg)

A dice roller for the [Root RPG](https://magpiegames.com/collections/root) system.

```bash
npm install @randsum/root-rpg
```

### [`@randsum/blades`](https://www.npmjs.com/package/@randsum/blades)

[![npm version](https://img.shields.io/npm/v/@randsum/blades)](https://www.npmjs.com/package/@randsum/blades)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/blades)](https://bundlephobia.com/package/@randsum/blades)

A dice roller for [Blades in the dark](https://bladesinthedark.com/greetings-scoundrel) (and forged in the dark) RPG systems.

```bash
npm install @randsum/blades
```

### [`@randsum/salvageunion`](https://www.npmjs.com/package/@randsum/salvageunion)

[![npm version](https://img.shields.io/npm/v/@randsum/salvageunion)](https://www.npmjs.com/package/@randsum/salvageunion)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@randsum/salvageunion)](https://bundlephobia.com/package/@randsum/salvageunion)

A dice roller for the [Salvage Union](https://leyline.press/collections/salvage-union?srsltid=AfmBOopmUVkzzc13P3pZl4Sjiinoyym9Fpa4-h-qCQOkGcBaGGQ7Z3yB) RPG system. Contains all official Salvage Union roll tables, and a contextual roll function for determining success.

```bash
npm install @randsum/salvageunion
```

### `@randsum/core`

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
- `:format` - Run Prettier checks
- `:tsCheck` - Run TypeScript checks
- `:publish` - Publish packages (CI only)
- `:lint:fix` - Run ESLint and fix issues
- `:format:fix` - Run Prettier and fix formatting issues
- `:ci` - Run all checks (build, test, lint, format, tsCheck)

Each package can be targeted directly with `moon [package]:task`, for example:

```bash
bun moon dice:test    # Run tests for @randsum/dice only
bun moon blades:build # Build @randsum/blades only
```

### Helper Scripts

This monorepo includes several helper scripts to streamline development:

```bash
# Create a new package
./scripts/create-package.sh new-package "Description of the new package"

# Update all packages to use standardized configuration
./scripts/update-packages.sh

# Release a new version of all packages
./scripts/release.sh [major|minor|patch]

# Clean all build artifacts
bun run clean
```

## Further Reading

- [Getting Started](https://github.com/RANDSUM/randsum/blob/main/GETTING_STARTED.md) - Installation and Documentation for using `randsum`

- [Randsum Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/notation/RANDSUM_DICE_NOTATION.md) - A guide for using [Dice Notation](https://en.wikipedia.org/wiki/Dice_notation) with `randsum`.

- [Contributing](https://github.com/RANDSUM/randsum/blob/main/CONTRIBUTING.md) - help make `randsum` better!

- [Moon Documentation](https://moonrepo.dev/docs) - Learn more about the build system powering this monorepo

- [Sophie's Dice Notation](https://sophiehoulden.com/dice/documentation/notation.html) - a great dice notation guide that helped me along the way

- [\_why's poignant guide to ruby](https://poignant.guide/) - \_why not?

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## Why did you make this?

Sometime around 2012, I decided I wanted to learn to program. I had installed ruby on the best laptop six-hundred dollars could buy, set to make a dice roller as an easy first project.

I spent an easy 30 minutes trying to figure out how to make `rand(n)` return `1...n` instead of `0...(n-1)`.

When I found the answer, I laughed and laughed. I've been chasing that high ever since.

---

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
