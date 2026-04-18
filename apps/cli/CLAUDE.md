# @randsum/cli - Dice Rolling CLI

## Overview

Simple terminal dice roller. Pass notation args, get results.

## Structure

- `src/index.ts` - Entry point, arg parsing
- `src/simple/run.ts` - Roll + format + print
- `src/shared/format.ts` - Shared formatters (compact, verbose, JSON)

## Commands

```bash
bun run dev                    # Run directly with bun
bun run dev -- 4d6L            # Test simple mode
bun run build                  # Build with bunup
bun run test                   # Run tests
```

## Dependencies

- `@randsum/roller` workspace:~ - Core dice engine (dev dependency, bundled into `dist/index.js` at build time via bunup — not a runtime dependency)

## Publishing

Always `bun publish`. Never `npm publish`. See root `CLAUDE.md` for why.
