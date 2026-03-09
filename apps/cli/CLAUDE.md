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
- `src/tui/components/HeroBanner.tsx` - ASCII art banner
- `src/tui/components/NotationHighlight.tsx` - Syntax-highlighted notation display
- `src/tui/components/NotationDescriptionRow.tsx` - Human-readable notation description
- `src/tui/components/NotationReference.tsx` - Modifier reference panel
- `src/tui/components/RollResultPanel.tsx` - Roll result display
- `src/tui/components/Spinner.tsx` - Loading spinner
- `src/tui/hooks/` - useCursorPosition, useTerminalWidth
- `src/tui/helpers/` - modifierGrid, modifierDocs, tokenColors, gradientColor, openInStackblitz

## Commands

```bash
bun run dev                    # Run directly with bun
bun run dev -- 4d6L            # Test simple mode
bun run dev -- -i              # Test TUI mode
bun run build                  # Build with bunup
bun run test                   # Run tests
```

## Dependencies

- `@randsum/roller` ^3.0.0 - Core dice engine
- `@randsum/notation` ^3.0.0 - Notation parsing and tokenization
- `ink` - React for CLI (TUI framework)
- `ink-text-input` - Text input component for Ink
- `react` - React (required by Ink)

## Dependency Note

`@randsum/roller` and `@randsum/notation` are intentionally listed as versioned npm dependencies rather than `workspace:~`.
This is because the CLI is built as a standalone binary that consumers install globally via npm/bun.
The workspace protocol resolves only at build time within the monorepo — the published artifact must
reference a real npm version. When upgrading roller, bump this version manually alongside the release.
