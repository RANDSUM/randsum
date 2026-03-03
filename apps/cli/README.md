# @randsum/cli

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
-j, --json            Output results as JSON
-s, --seed <number>   Set random seed for reproducible rolls
-V, --version         Show version
-h, --help            Show help
```

## Dice Notation

Uses [RANDSUM Dice Notation](https://github.com/RANDSUM/randsum/blob/main/packages/roller/RANDSUM_DICE_NOTATION.md) — supports drop/keep (`L`/`H`), reroll (`R{}`), exploding (`!`), unique (`U`), cap (`C{}`), and arithmetic (`+`/`-`).

## License

MIT
