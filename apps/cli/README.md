<div align="center">
  <img width="150" height="150" src="https://raw.githubusercontent.com/RANDSUM/randsum/refs/heads/main/icon.webp" alt="Randsum Logo">
  <h1>@randsum/cli</h1>
  <h3>TypeScript-First Dice Notation Ecosystem</h3>
  <p>Throw Dice, Not Exceptions.</p>
</div>

Dice rolling CLI and interactive TUI powered by [RANDSUM](https://github.com/RANDSUM/randsum).

## Install

```bash
npm install -g @randsum/cli
# or
bunx randsum
# or
npx randsum
```

## Usage

### Quick Roll

```bash
randsum 4d6L          # Roll 4d6, drop lowest
randsum 2d20H         # Disadvantage (drop highest)
randsum 1d20+5        # Attack roll with modifier
randsum 3d6!          # Exploding dice
```

### Interactive TUI

```bash
randsum               # Launch interactive mode
randsum -i            # Explicit interactive flag
```

### Options

```
-i, --interactive     Launch interactive TUI mode
-v, --verbose         Show detailed roll breakdown
--json                Output results as JSON
-r, --repeat N        Roll N times (default: 1)
-s, --seed <number>   Set random seed for reproducible rolls
-V, --version         Show version
-h, --help            Show help
```

## Dice Notation

Uses [RANDSUM Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/roller/RANDSUM_DICE_NOTATION.md) — supports drop/keep (`L`/`H`), reroll (`R{}`), exploding (`!`), unique (`U`), cap (`C{}`), and arithmetic (`+`/`-`).

## License

MIT
