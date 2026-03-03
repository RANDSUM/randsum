# @randsum/cli - Dice Rolling CLI & TUI

## Overview

Dual-mode terminal app. Pass notation args for instant results, or run bare for interactive TUI.

## Modes

- `randsum 4d6L` - Simple mode: roll, print, exit
- `randsum` - TUI mode: interactive Ink app
- `randsum -i` - TUI mode: explicit flag

## Structure

- `src/index.ts` - Entry point, arg parsing, mode branching
- `src/simple/run.ts` - Simple mode: roll + format + print
- `src/shared/format.ts` - Shared formatters (compact, verbose, JSON)
- `src/tui/App.tsx` - Root Ink component
- `src/tui/components/` - RollHistory, DiceToolbar, NotationInput
- `src/tui/hooks/` - useRollHistory

## Commands

```bash
bun run dev                    # Run directly with bun
bun run dev -- 4d6L            # Test simple mode
bun run dev -- -i              # Test TUI mode
bun run build                  # Build with bunup
bun run test                   # Run tests
```

## Dependencies

- `@randsum/roller` - Core dice engine
- `ink` - React for CLI (TUI framework)
- `ink-text-input` - Text input component for Ink
- `react` - React (required by Ink)
