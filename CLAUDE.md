# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Bun workspace monorepo for a dice rolling ecosystem targeting tabletop RPGs. All packages are TypeScript, published to npm under `@randsum`.

**Core**: `@randsum/roller` — zero-dependency dice engine. Every other package depends on it via `workspace:~`.

**Game packages** (each wraps roller with game-specific interpretation):
`blades` (Blades in the Dark), `daggerheart`, `fifth` (D&D 5e), `root-rpg`, `salvageunion`, `pbta` (Powered by the Apocalypse)

**Tools**: `@randsum/discord-bot` (private), `@randsum/site` (Astro docs site, private), `@randsum/component-library` (React UI components, private)

Game packages never depend on each other — only on `@randsum/roller`.

## Commands

```bash
bun install                              # Install all dependencies
bun run build                            # Build all packages (bunup: ESM+CJS+DTS)
bun run test                             # Run all tests (bun:test, recursive)
bun run lint                             # ESLint all packages
bun run format                           # Prettier all packages
bun run typecheck                        # TypeScript strict check
bun run check:all                        # Full CI pipeline (lint, format, typecheck, test, build, size, site)
bun run fix:all                          # Auto-fix lint + format issues

# Single package
bun run --filter @randsum/roller test    # Test one package
bun run --filter @randsum/fifth build    # Build one package

# Single test file
bun test packages/roller/__tests__/roll/roll.test.ts

# Other
bun run create:game <name>               # Scaffold new game package
bun run size                             # Bundle size checks (size-limit)
bun run bench                            # Performance benchmarks (mitata)
bun run site:dev                         # Astro dev server (localhost:4321)
bun run help                             # Quick command reference
```

## TypeScript Conventions

- Strict mode with `isolatedDeclarations`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`
- `const` only — `let` is banned by ESLint
- `import type { X }` enforced (`consistent-type-imports`)
- Explicit return types on exported functions
- PascalCase for types/interfaces/enums, UPPER_CASE for enum members
- No `any` — use `unknown` with type guards
- No `as unknown as T` — banned by ESLint AST selector
- `prefer-readonly` enabled
- No semicolons, single quotes, no trailing commas (Prettier)

## Testing

- Framework: `bun:test` (`import { describe, expect, test } from 'bun:test'`)
- Tests live in `__tests__/` directories
- Property-based tests use `fast-check` with `.property.test.ts` suffix
- Stress tests use 9999 iterations for boundary validation
- Seeded random available: `createSeededRandom(42)` from test-utils
- Coverage target: 80% project, 70% patch (Codecov)

## Package Build Output

All packages use `bunup` producing identical structure:
- `dist/index.js` (ESM), `dist/index.cjs` (CJS)
- `dist/index.d.ts`, `dist/index.d.cts` (type declarations)
- Bundle size limits enforced: roller 10KB, game packages 8KB, salvageunion 170KB

## Key Patterns

### `createGameRoll` Factory

Game packages use this factory from roller to create standardized roll functions:

```typescript
createGameRoll<TInput, TResult>({
  validate: (input) => { ... },
  toRollOptions: (input) => { ... },
  interpretResult: (input, total, rolls, fullResult) => TResult
})
```

Returns `GameRollResult<TResult, TDetails, RollRecord>`.

### Never-Throw Errors

`roll()` never throws. Errors are returned in the result: `if (result.error) { ... }`

### Modifier Registry

Modifiers (cap, drop, keep, reroll, explode, etc.) are self-registering definitions in `packages/roller/src/lib/modifiers/definitions/`. Each has a priority determining execution order (10=cap through 100=multiplyTotal).

### `roll()` Argument Types

```typescript
roll(20)                    // Number: 1d20
roll("4d6L")                // Notation string
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })  // Options object
roll("1d20", "2d6", "+5")   // Multiple arguments combined
```

## Git Hooks (Lefthook)

**pre-commit** (parallel): ESLint --fix, Prettier, typecheck
**pre-push**: all tests, unused exports check, security audit

If hooks fail, run `bun run fix:all`.

## Development Guidelines

Detailed guides in the [CLAUDE/](CLAUDE/) directory:
- [Scripts Reference](CLAUDE/scripts.md)
- [Game Package Patterns](CLAUDE/game-packages.md)
- [Modifier System](CLAUDE/modifiers.md)
- [Testing Patterns](CLAUDE/testing.md)

Per-package `CLAUDE.md` files exist in each `packages/*/` and `apps/*/` directory.

## Dice Notation Reference

Full spec: `packages/roller/RANDSUM_DICE_NOTATION.md`

Key syntax: `NdS` (basic), `+X`/`-X` (arithmetic), `L`/`H` (drop lowest/highest), `R{<3}` (reroll), `!` (explode), `U` (unique), `C{<1,>6}` (cap)
