<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/main/randsum/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>Randsum</h1>
  <h3>An ergonomic, flexible, and type-safe dice rolling ecosystem for NPM</h3>

[![License](https://img.shields.io/npm/l/randsum)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![CI Status](https://github.com/RANDSUM/randsum/workflows/CI/badge.svg)](https://github.com/RANDSUM/randsum/actions)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Built with Moon](https://img.shields.io/badge/Built%20with-Moon-blue?style=flat)](https://moonrepo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NPM Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/RANDSUM/randsum/commits/main)
[![Types](https://img.shields.io/badge/Types-included-blue)](https://www.npmjs.com/package/@randsum/roller)

</div>

## 🚀 Quick Example

```typescript
import { D20, roll } from "@randsum/roller"

// Simple d20 roll
D20.roll() // Returns 1-20

// Complex dice notation
roll("4d6L") // Roll 4d6, drop lowest

// Advantage and disadvantage
roll("2d20H") // Roll with advantage (2d20, keep highest)
roll("2d20L") // Roll with disadvantage (2d20, keep lowest)

roll("4d6L!R{<3}") // Roll 4d6, drop lowest, reroll below 3
```

Or directly from your terminal:

```bash
npx randsum 2d20    # Roll two twenty-sided dice
npx randsum 4d6L    # Character stat roll (drop lowest)
npx randsum 2d20H   # Roll with advantage
```

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
bun moon roller:test    # Run tests for @randsum/roller only
bun moon blades:build   # Build @randsum/blades only
```

## Further Reading

- [Getting Started](https://github.com/RANDSUM/randsum/blob/main/GETTING_STARTED.md) - Installation and Documentation for using `randsum`

- [Randsum Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/roller/RANDSUM_DICE_NOTATION.md) - A guide for using [Dice Notation](https://en.wikipedia.org/wiki/Dice_notation) with `randsum`.

- [Sophie's Dice Notation](https://sophiehoulden.com/dice/documentation/notation.html) - a great dice notation guide that helped me along the way

- [\_why's poignant guide to ruby](https://poignant.guide/) - \_why not?

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

## Why did you make this?

Sometime around 2012, I decided I wanted to learn to program. I had installed ruby on the best laptop six-hundred dollars could buy, set to make a dice roller as an easy first project.

I spent an easy 30 minutes trying to figure out how to make `rand(n)` return `1...n` instead of `0...(n-1)`.

When I found the answer, I laughed and laughed. I've been chasing that high ever since.

---

## LLM Statement

I love this thing we call programming. It seems as if (biiiiig scare quotes) "AI" might be a part of it moving forward. You will find the extent of my comfort with these tools in this project, for it is the closest thing I have on this earth to a life's work. I care deeply about it, and there is no better way for me to understand this weird new tool and their place in my craft than to use them here. Is this profane? I don't know. We'll have to see the extent to which I come to regret/resent/respect this decision in the coming years together.

Check the git history of this paragraph for a makeshift changelog of my evolving feelings on the subject.

---

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
