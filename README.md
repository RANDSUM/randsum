<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo. A Dotted D6 rolled a 6 with the dots arranged to look like an R.">
  <h1>Randsum</h1>
  <h3>A Zero Dependency, Typescript-First, Bun-Native Dice Notation and Rolling Engine</h3>
  <p>Throw Dice, Not Exceptions.</p>

[![License](https://img.shields.io/npm/l/randsum)](https://github.com/RANDSUM/randsum/blob/main/LICENSE)
[![CI Status](https://github.com/RANDSUM/randsum/workflows/CI/badge.svg)](https://github.com/RANDSUM/randsum/actions)
[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![NPM Downloads](https://img.shields.io/npm/dm/@randsum/roller)](https://www.npmjs.com/package/@randsum/roller)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/RANDSUM/randsum/commits/main)
[![Types](https://img.shields.io/badge/Types-included-blue)](https://www.npmjs.com/package/@randsum/roller)

</div>

## 📦 Monorepo Structure

This repository contains multiple packages and applications for dice rolling and tabletop RPG mechanics:

### Core Packages (published to npm)

- **[@randsum/roller](packages/roller)** - Zero-dependency dice rolling engine with built-in notation parsing and validation
- **[@randsum/games](packages/games)** - TTRPG game packages with subpath exports per system:
  - `@randsum/games/blades` - Blades in the Dark
  - `@randsum/games/daggerheart` - Daggerheart
  - `@randsum/games/fifth` - D&D 5th Edition
  - `@randsum/games/pbta` - Powered by the Apocalypse
  - `@randsum/games/root-rpg` - Root RPG
  - `@randsum/games/salvageunion` - Salvage Union
- **[@randsum/cli](apps/cli)** - CLI and interactive TUI for rolling dice from the terminal

### Applications (private)

- **[@randsum/discord-bot](apps/discord-bot)** - Discord bot for dice rolling
- **[@randsum/site](apps/site)** - Documentation and marketing website built with Astro
- **[@randsum/playground](apps/playground)** - Interactive dice notation playground

## 🚀 Quick Example

```typescript
import { roll } from "@randsum/roller"

// Argument types: number, notation string, or options object
roll(20) // Number: 1d20 (returns 1-20)
roll("1d20") // Notation: same as above
roll({ sides: 20, quantity: 1 }) // Object: same as above

// Complex dice notation
roll("4d6L") // Roll 4d6, drop lowest

// Options object (equivalent to 4d6L)
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })

// Advantage and disadvantage
roll("2d20L") // Roll with advantage (2d20, drop lowest)
roll("2d20H") // Roll with disadvantage (2d20, drop highest)

// Multiple arguments: combine rolls
roll("1d20+5", "2d6+3") // Attack roll + damage roll

roll("4d6L!R{<3}") // Roll 4d6, drop lowest, reroll below 3
```

Or directly from your terminal:

```bash
npx @randsum/cli 2d20    # Roll two twenty-sided dice
npx @randsum/cli 4d6L    # Character stat roll (drop lowest)
npx @randsum/cli 2d20L   # Roll with advantage (drop lowest)
npx @randsum/cli         # Interactive TUI mode
```

## 🛠️ Development

This monorepo uses [Bun](https://bun.sh) for package management, building, and task execution.

### Getting Started

```bash
# Clone the repository
git clone https://github.com/RANDSUM/randsum.git
cd randsum

# Install dependencies for all packages
bun install

# Build all packages (roller is built first, then others)
bun run build

# Run tests
bun run test

# Run type checks
bun run typecheck

# Lint and format
bun run lint
bun run format
```

### Monorepo Workflow

Bun's workspace features handle tasks across all packages with automatic dependency management:

**Global Tasks** (run across all packages):

- `bun run build` - Build all packages in dependency order (roller first, then others)
- `bun run test` - Run all tests
- `bun run lint` - Run ESLint checks across the monorepo
- `bun run typecheck` - Run TypeScript checks for all packages
- `bun run check:all` - Run all package-level checks (build, typecheck, lint, format, test)
- `bun run fix:all` - Run ESLint with auto-fix and format code
- `bun run format` - Format code using Prettier

**Package-Specific Tasks**:

```bash
bun run --filter @randsum/roller test      # Run tests for @randsum/roller only
bun run --filter @randsum/games build      # Build @randsum/games only
```

**Site-Specific Tasks**:

```bash
bun run site:build    # Build the documentation site
bun run site:dev      # Start the documentation site dev server
```

Bun automatically handles inter-package dependencies through workspace linking, ensuring packages are built in the correct order.

## 📚 Documentation

### Key Resources

- [RANDSUM Dice Notation Specification](https://notation.randsum.dev) - Formal spec for RANDSUM Dice Notation (taxonomy, pipeline, conformance, syntax)
- [Sophie's Dice Notation](https://sophiehoulden.com/dice/documentation/notation.html) - a great dice notation guide that helped me along the way
- [\_why's poignant guide to ruby](https://poignant.guide/) - \_why not?

### Website Deployment

The documentation site (`@randsum/site`) is deployed to **Netlify**, configured via `apps/site/netlify.toml` and deployed automatically on push to main.

---

## Why did you make this?

Sometime around 2012, I decided I wanted to learn to program. I had installed ruby on the best laptop six-hundred dollars could buy, set to make a dice roller as an easy first project.

I spent an easy 30 minutes trying to figure out how to make `rand(n)` return `1...n` instead of `0...(n-1)`.

When I found the answer, I laughed and laughed. I've been chasing that high ever since.

---

## LLM Statement

Though this project predates the existence of Large learning machines by a clean decade, since their popularization I have used LLM (so-called "AI") tools while making this library. I've used a collection of different tools or models - I prefer the Claude collection of models, though I've played with a lot of it. I spent a lot of time with Augment, then Cursor, now I dance between Claude and Cursor and staring in the mirror wondering what happened.

Is the use of this profane? Is my work perma-tainted? I don't know. The type-ahead (powered by LLM's) suggests I say "I am not ashamed", and so I remain comforted that it is not yet able to accurately imitate my mind.

You will find the extent of my comfort with these tools in this project, for it is the closest thing I have on this earth to a life's work, with programming ("what the machines do for me") is the closest thing I have to a craft. One grandfather was an engineer, the other a bricklayer. In my career thus far, I have been blessed to be some combination of both.

> You can be grateful for the efficiency and still mourn what it cost. You can use the tools every day and still feel the weight of what they’ve changed about your craft, your career, your sense of what it means to be good at this.The code was never the point, maybe. But for a lot of us, it felt like it was. And that feeling doesn’t just disappear because the tools got better.

- Dave Kiss, [Stop Calling it Vibe Coding](https://davekiss.com/blog/agentic-coding/)

---

<div align="center">
Made with 👹 by <a href="https://github.com/RANDSUM">RANDSUM</a>
</div>
