# @randsum/cli - Dice Rolling CLI

## Overview

Published (`@randsum/cli`, v2.0.0, public) dice roller. Bin name `randsum`. Pass notation args
(or pipe via stdin), get formatted results. A plain string-formatter — **no Ink, no interactive
UI, no `@randsum/dice-ui` dependency** (per `docs/adr/ADR-019`).

The CLI version printed by `--version` is read from `package.json` at **runtime** (`import { version }
from '../package.json'`), not baked in as a build-time constant.

## Structure

- `src/index.ts` - Entry point: arg/flag parsing, stdin handling, help/version, `main()`
- `src/run.ts` - `runRolls()`: roll + format, returns `{ stdout, stderr, hadError }`
- `src/format.ts` - Output formatters (compact, verbose, JSON)

## Commands

```bash
bun run dev                    # Run from source (bun run src/index.ts)
bun run dev -- 4d6L            # Roll from CLI in dev
bun run build                  # bunup → dist/index.js (ESM), then chmod +x
bun run test                   # bun test
bun run typecheck              # tsc --noEmit
bun run lint                   # ESLint
bun run format                 # Prettier
bun run check                  # build + typecheck + format:check + lint + test
```

## Build / Dependencies

- `@randsum/roller` is a **dev dependency** (`workspace:~`), bundled into `dist/index.js` at build
  time via bunup (`noExternal: [/^@randsum\//]`, `format: ['esm']`, `target: 'node'`, `dts: false`).
- The published package therefore has **zero runtime dependencies**.
- `build` chmods `dist/index.js` so the `randsum` bin is executable.

## Publishing

Always `bun publish`. Never `npm publish`. `prepublishOnly` runs `bun run build`. See root
`CLAUDE.md` for why `bun publish` is required (resolves `workspace:~`).
