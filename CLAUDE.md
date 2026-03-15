# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Bun workspace monorepo for a dice rolling ecosystem targeting tabletop RPGs. All packages are TypeScript, published to npm under `@randsum`.

**Core**: `@randsum/roller` — zero-dependency dice engine. Every other package depends on it via `workspace:~`.

**Game packages** live in `games/` — each wraps roller with game-specific interpretation:
`blades` (Blades in the Dark), `daggerheart`, `fifth` (D&D 5e), `root-rpg`, `salvageunion`, `pbta` (Powered by the Apocalypse)

**Display & UI Utilities**: `@randsum/display-utils` — browser-targeted utilities for step visualization, modifier docs, and StackBlitz integration (published to npm, consumed by CLI and component-library)

**Tools**: `@randsum/discord-bot` (private), `@randsum/site` (Astro docs site, private), `@randsum/component-library` (React UI components, published to npm)

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
bun run --filter @randsum/games build    # Build one package

# Single test file
bun test packages/roller/__tests__/roll/roll.test.ts

# Other
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
- Discriminated unions use `kind` or `type` as the discriminant field (e.g., `CollectedResults` with `kind: 'union' | 'numeric' | 'opaque' | 'result-mapping'`)
- Literal types for API inputs: `roll()` accepts plain numbers and notation strings, not branded/opaque types
- Error hierarchy: `ValidationError` (roller, numeric range) vs `SchemaError` (games, game-specific). Both extend `Error` — catch them distinctly
- Re-export conventions: game subpaths re-export `GameRollResult`, `RollRecord`, and `SchemaError`. Internal types stay internal. Use `export type` for type-only re-exports

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
- Bundle size limits enforced: roller 10KB, notation 8KB, display-utils 20KB, game packages 8KB, salvageunion 300KB

## Versioning

When a core package (`@randsum/roller`, or in future `@randsum/notation`) receives a minor version bump, dependent packages (game packages, component-library) should also receive a corresponding minor version bump to keep the ecosystem in sync. This applies to minor and major releases — patch bumps in core do not require dependents to bump.

## Key Patterns

### Code-Generated Game Packages

Game packages are generated from `.randsum.json` specs via the codegen pipeline in `packages/games/codegen.ts`. Each spec defines dice pools, modifiers, outcome tables, and input validation. The generated TypeScript calls `roll()` from `@randsum/roller` directly.

### Error Handling

`roll()` throws on invalid input. Wrap calls in try/catch: `try { roll(...) } catch (e) { ... }`

### Modifier Registry

The `RANDSUM_MODIFIERS` array in `packages/roller/src/lib/modifiers/definitions/index.ts` is the single source of truth for which modifiers exist and their execution order. Each modifier combines a `NotationSchema` (from `@randsum/notation`) with a `ModifierBehavior` (from `@randsum/roller`). See `packages/roller/RANDSUM_DICE_NOTATION.md` for the full priority table and syntax reference.

### `roll()` Argument Types

```typescript
roll(20)                    // Number: 1d20
roll("4d6L")                // Notation string
roll({ sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } })  // Options object
roll("1d20+5", "2d6")       // Multiple arguments combined
roll("d%")                  // Percentile: 1d100
roll("4dF")                 // Fate Core: 4 Fate dice (-4 to +4)
roll("dF.2")                // Extended Fudge die (-2 to +2)
roll("5d6W")                // D6 System wild die
roll("g6")                  // Geometric die (roll until 1)
roll("3DD6")                // Draw die (no replacement)
roll("4d6Lx6")              // Repeat operator (6 ability scores)
roll("2d6+3[fire]")         // Annotation/label
roll("4d6//2")              // Integer division
roll("5d10F{3}")            // Count failures <= 3
```

## Git Hooks (Lefthook)

**pre-commit** (parallel): ESLint --fix, Prettier, typecheck
**pre-push**: all tests, unused exports check, security audit, skill verification, bundle size check

If hooks fail, run `bun run fix:all`.

## Development Guidelines

Per-package `CLAUDE.md` files exist in each `packages/*/`, `games/*/`, and `apps/*/` directory for detailed guidance on each component.

## Debugging & Troubleshooting

**Test failures**: Isolate with `bun test packages/roller/__tests__/roll/roll.test.ts`. Use `--bail` to stop on the first failure: `bun test --bail`. Filter by package: `bun run --filter @randsum/roller test`.

**ESLint failures**: Common violations: `no-let` (use `const`), `consistent-type-imports` (use `import type`), `prefer-readonly`, and the AST selector banning `as unknown as T`. Auto-fix with `bun run fix:all` or target lint only: `bun run lint -- --fix`.

**Type errors**: Run `bun run typecheck`. Common strict-mode issues:
- `isolatedDeclarations` — exported functions need explicit return types
- `exactOptionalPropertyTypes` — optional properties cannot be assigned `undefined` explicitly unless the type includes `| undefined`
- `noUncheckedIndexedAccess` — array/object index access returns `T | undefined`, requires narrowing

**Bundle size failures**: Each publishable package defines `size-limit` in its own `package.json`. Check with `bun run size` or per-package: `bun run --filter @randsum/roller size`. Common cause: accidentally importing a heavy dependency into a game package (limit: 8KB, salvageunion: 300KB).

**Codegen issues**: Game packages are generated from `.randsum.json` specs. Generated files live at `packages/games/src/*.generated.ts`. Regenerate with `bun run --filter @randsum/games gen`. Verify generated output matches specs: `bun run --filter @randsum/games gen:check`.

**Hook failures**: Pre-commit runs install, lint --fix, format, and typecheck in parallel. Pre-push runs build (priority 1), then test (priority 2), then `bun audit --level=high`. Recovery: `bun run fix:all`, then retry. See `lefthook.yml` for full config.

## Dice Notation Reference

Full spec: `packages/roller/RANDSUM_DICE_NOTATION.md`

Key syntax: `NdS` (basic), `+X`/`-X` (arithmetic), `L`/`H` (drop lowest/highest), `R{<3}` (reroll), `!` (explode), `U` (unique), `C{<1,>6}` (cap), `d%` (percentile), `dF`/`dF.2` (Fate/Fudge), `W` (wild die), `F{N}` (count failures), `//N` (integer divide), `%N` (modulo), `gN` (geometric die), `DDN` (draw die), `xN` (repeat), `[text]` (annotation)
