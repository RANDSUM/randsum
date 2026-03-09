# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-03-09

### Breaking Changes

#### @randsum/roller

- **Error handling changed from result objects to thrown exceptions.** `roll()` now throws a `RandsumError` on invalid input instead of returning `result.error`. Code checking `if (result.error)` will silently pass on 3.0 since the field no longer exists. Wrap `roll()` calls in try/catch instead. See the [migration guide](apps/site/src/content/docs/guides/migrating-from-v2.mdx) for details.
- `analyze()` removed from public API (was previously exported; still available internally but not part of the public surface)
- `@randsum/notation` is now a peer dependency — if you import notation utilities directly from `@randsum/roller`, they still work (re-exported for backward compatibility), but you may want to depend on `@randsum/notation` directly for a zero-dependency footprint

#### All game packages

- Minimum `@randsum/roller` peer version is now `^3.0.0`

### New in @randsum/roller

- **`PRESETS`** — Pre-built notation strings and options for common scenarios (`dnd-ability-score`, `dnd-advantage`, `dnd-disadvantage`, `bounded-ability-score`, `balanced-hero-roll`, `fate-dice`)
- **`resolvePreset(name)`** — Resolve a named preset to `DiceNotation | RollOptions`
- **`resolvePresetParam(name, args)`** — Resolve a parameterized preset (e.g. `shadowrun-pool` with `{ dice: 8 }`)
- **`DiceBuilder` / `d()`** — Fluent builder API for constructing `RollOptions` without deep object literals (`d(6).quantity(4).drop(1).plus(2).toRoll()`)
- **`formatResult(result)`** — Format a `RollerRollResult` into a structured human-readable object
- **`isFormattedError(result)`** — Type guard for formatted error results
- **`normalize(options)`** — Normalize `RollOptions` to a canonical form
- **`equate(a, b)`** — Deep-compare two `RollOptions` objects

### New package: @randsum/notation

Extracted from `@randsum/roller` as a standalone zero-dependency package.

- `isDiceNotation(value)` — type guard
- `validateNotation(notation)` — structured validation with error details
- `suggestNotationFix(notation)` — correction suggestions for invalid input
- `notationToOptions(notation)` — parse notation to `ParsedNotationOptions`
- `optionsToNotation(options)` — convert options to notation string
- `optionsToDescription(options)` — human-readable description
- `tokenize(notation)` — parse notation into typed `Token[]` for UI display
- All shared types: `DiceNotation`, `RollOptions`, `ModifierOptions`, and more

`@randsum/roller` re-exports everything from `@randsum/notation` — existing import paths do not change.

### New: @randsum/cli

Interactive terminal dice roller.

- `randsum 4d6L` — instant roll and exit
- `randsum` — interactive TUI with live notation input, modifier reference, and roll history
- Flags: `-v/--verbose`, `--json`, `-r/--repeat N`, `-s/--seed N`, `-i/--interactive`

## [2.0.0] - 2025-07-01

### New

#### Game packages

The game package ecosystem was introduced in this release:

- `@randsum/blades` — Blades in the Dark action rolls
- `@randsum/daggerheart` — Daggerheart hope/fear dice
- `@randsum/fifth` — D&D 5th Edition rolls
- `@randsum/pbta` — Powered by the Apocalypse mechanics
- `@randsum/root-rpg` — Root RPG action rolls
- `@randsum/salvageunion` — Salvage Union table rolls

#### @randsum/roller

- `createGameRoll` factory — standardized wrapper for game-specific roll functions
- `createMultiRollGameRoll` factory — for game packages that roll multiple dice pools (e.g. Daggerheart)
- `GameRollResult<TResult, TDetails, TRecord>` — standardized result type for all game packages

## [1.0.0] - 2025-02-01

The first stable release of the RANDSUM dice rolling ecosystem.

### Packages

#### @randsum/roller

The core dice rolling engine with comprehensive notation support.

- `roll()` function supporting numbers, notation strings, and options objects
- Full dice notation parsing with modifiers (drop, keep, reroll, explode, etc.)
- `notation()` and `validateNotation()` for notation validation
- `analyze()` for probability analysis
- Custom error classes with detailed error codes
- Dual ESM/CJS exports with full TypeScript definitions

#### @randsum/blades

Blades in the Dark dice mechanics.

- `rollBlades()` for pool-based d6 rolling
- Returns outcomes: critical, success, partial, or failure

#### @randsum/daggerheart

Daggerheart RPG system support.

- `rollDaggerheart()` for Hope/Fear dual-d12 mechanics
- Advantage/disadvantage support

#### @randsum/fifth

D&D 5th Edition mechanics.

- `actionRoll()` for d20 + modifier rolls
- Advantage/disadvantage support

#### @randsum/pbta

Powered by the Apocalypse mechanics.

- `rollPbtA()` for 2d6 + stat modifier rolls
- Standard PbtA outcome thresholds

#### @randsum/root-rpg

Root RPG system implementation.

- `rollRootRpg()` for Root-specific dice mechanics

#### @randsum/salvageunion

Salvage Union mechanics.

- `rollTable()` for table-based dice lookups
- Pre-configured Salvage Union reference tables

