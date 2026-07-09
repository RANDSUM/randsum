# @randsum/games - TTRPG Game Packages

## Overview

Wraps `@randsum/roller` with game-specific dice mechanics for tabletop RPGs. Each game is defined as a declarative `.randsum.json` spec and code-generated into TypeScript. ESM-only; the only dependency is `@randsum/roller`. Games never depend on each other. Consumer API uses subpath exports:

```typescript
import { roll } from "@randsum/games/blades"
import { roll } from "@randsum/games/salvageunion"
```

Seven games ship: `blades`, `daggerheart`, `fate`, `fifth`, `pbta`, `root-rpg`, `salvageunion` (each a subpath export). A `./schema` subpath exposes the codegen toolkit. `AVAILABLE_GAMES` / `GameShortcode` (from `src/availableGames.generated.ts`) are the public source of truth for the game list.

Each game's `roll()` returns a `GameRollResult<TResult, TDetails, TRollRecord>` with typed `result`, `total`, and `rolls`.

Every enum-like `result` string is `snake_case` across all games (e.g. `strong_hit`, `weak_hit`, `miss`, `critical_hope`, `legendary`). This is a stable, machine-friendly contract — switch on these values in code, and derive any human-readable label (e.g. `"Strong Hit"`) at the display layer. Free-text strings pulled from data tables (e.g. Salvage Union's `remoteTableLookup` result text) are data, not enums, and are left verbatim.

## Directory Structure

```
packages/games/
  *.randsum.json          # Game specs (one per game, at package root)
  randsum.json            # Meta-schema for spec validation
  codegen.ts              # Codegen entry point
  src/
    *.generated.ts        # Generated game modules (DO NOT EDIT)
    index.ts              # Root export (re-exports AVAILABLE_GAMES, GameRollResult, SchemaError)
    availableGames.generated.ts  # Generated AVAILABLE_GAMES constant (do not edit)
    types.ts              # GameRollResult generic type
    schema.ts             # ./schema subpath: validateSpec, resolveExternalRefs, generateCode, specToFilename, lookupByRange, SchemaError + spec types
    lib/
      codegen/            # Code generation pipeline (body/details/modifiers/outcome emitters)
      codegen.ts          # generateCode() function
      normalizer.ts       # Spec normalization to IR
      normalizedTypes.ts  # NormalizedRollDefinition IR types
      types.ts            # Internal spec types (RandSumSpec)
      errors.ts           # SchemaError class
      lookupByRange.ts    # Range-based table lookup helper
      validator.ts        # Spec validation via ajv
      refResolver.ts      # $ref resolution within specs
      externalRefResolver.ts  # Remote URL resolution
  __tests__/
    <shortcode>.test.ts           # Unit tests per game
    <shortcode>.property.test.ts  # Property-based tests per game
    build-smoke.test.ts           # Build output verification
  __fixtures__/
    salvageunion-tables.json      # Checked-in remote table snapshot (codegen reads this by default)
```

## .randsum.json Spec Format

Each spec declares a four-stage pipeline: Dice -> Modify -> Resolve -> Outcome.

Key sections:

- **`pools`** - Named dice pool definitions (`{ sides: N }`)
- **`tables`** - Lookup tables with range/exact/poolCondition entries
- **`outcomes`** - Result resolution via `tableLookup` or inline ranges
- **`roll.inputs`** - Typed user inputs (integer, string) with validation
- **`roll.dice`** - Pool ref + quantity (can reference inputs)
- **`roll.modify`** - Modifier chain (keepHighest, keepLowest, etc.)
- **`roll.resolve`** - Resolution strategy (`"sum"` or `remoteTableLookup`)
- **`roll.outcome`** - Outcome ref for result classification
- **`roll.when`** - Conditional overrides based on input values

Specs reference internal sections via `{ "$ref": "#/tables/coreMechanic" }` and inputs via `{ "$input": "rating" }`.

Meta-schema: `randsum.json` at package root. Declared `$id`: `https://randsum.dev/schemas/v1/randsum.json`.

## Codegen Pipeline

Generated files live at `src/<shortcode>.generated.ts`. They are checked into git.

```bash
bun run --filter @randsum/games gen          # Regenerate all from specs
bun run --filter @randsum/games gen:check    # Verify generated files are up to date
```

The codegen script (`codegen.ts` at package root):

1. Reads all `*.randsum.json` files from the package root
2. Resolves external `$ref`s via `resolveExternalRefs`
3. Reads remote table data (e.g. Salvage Union tables) from the checked-in `__fixtures__/<shortcode>-tables.json` snapshot — **codegen is hermetic by default and never hits the network**
4. Validates each resolved spec against the meta-schema via `validateSpec`
5. Calls `generateCode()` from `src/lib` to produce TypeScript
6. Formats with Biome (via `formatGeneratedCode` in `src/lib`, which shells out to the workspace Biome binary using the repo's `biome.json`) and writes to `src/<shortcode>.generated.ts`, then regenerates `src/availableGames.generated.ts`

Build output: `dist/<shortcode>.generated.js` + `.d.ts` per game. With `--check` (`gen:check`), the script writes nothing and fails if any generated file is stale.

Remote fixtures are refreshed only on demand: `bun run --filter @randsum/games gen -- --refresh-remote` refetches from the source URL and rewrites the `__fixtures__/<shortcode>-tables.json` snapshot. Plain `gen` and `gen:check` are offline and deterministic — running `gen` twice in a row leaves the tree clean.

Generated files import from `@randsum/roller/roll` and `@randsum/roller/validate`. Each exports a typed `roll()` function, a game-specific result type (e.g. `BladesRollResult`), the `SchemaError` value, and re-exports the types `GameRollResult`, `RollRecord`, `SchemaErrorCode`. The salvageunion module additionally exports the `ROLL_TABLE_ENTRIES` and `VALID_TABLE_NAMES` values.

## Adding a New Game

Read [`docs/randsum-json-schema.md`](./docs/randsum-json-schema.md) first — it is the narrative guide to the `.randsum.json` spec format with real examples from every in-tree game.

1. Create `<shortcode>.randsum.json` at the package root
2. Run `bun run --filter @randsum/games gen` to generate `src/<shortcode>.generated.ts` and refresh `src/availableGames.generated.ts` (which drives the `AVAILABLE_GAMES` public export)
3. Add a subpath export in `package.json` under `"exports"` (follow existing pattern). The `exports` field is hand-maintained — bunup's `exports: true` auto-writer is intentionally disabled because its common-prefix inference breaks when entries are added. `__tests__/exports-sync.test.ts` guards against drift.
4. Add a size-limit entry in `package.json` (15 KB for most games; 16 KB for daggerheart and pbta; 33 KB for salvageunion)
5. Write `__tests__/<shortcode>.test.ts` and `__tests__/<shortcode>.property.test.ts`
6. Run `bun run --filter @randsum/games check` to verify everything passes

To change the codegen pipeline itself (new resolve strategy, new pool shape, new condition type), see `docs/codegen-extension.md`.

## Testing Patterns

- **Unit tests** (`<shortcode>.test.ts`): Test each input combination, verify result types, check dice pool sizes, validate edge cases (e.g., zero-dice desperate rolls)
- **Property tests** (`<shortcode>.property.test.ts`): Use `fast-check` with `fc.property()` to verify invariants across random inputs (result always valid, pool size matches input, totals within bounds)
- Import from subpath: `import { roll } from '@randsum/games/<shortcode>'`
- Build must run before tests: `bun run --filter @randsum/games test` handles this

## Commands

```bash
bun run --filter @randsum/games gen          # Run codegen
bun run --filter @randsum/games gen:check    # Check codegen freshness
bun run --filter @randsum/games build        # Build all entries (bunup)
bun run --filter @randsum/games test         # Build + test
bun run --filter @randsum/games typecheck    # TypeScript check
bun run --filter @randsum/games size         # Bundle size check
bun run --filter @randsum/games check        # Full check (build + typecheck + format + lint + test)
```

## Key Constraints

- All game logic lives in the `.randsum.json` spec. Never hand-write game logic in generated `.ts` files.
- Generated files are checked in but must not be manually edited. Always regenerate via codegen.
- Games depend only on `@randsum/roller`. Games never depend on each other.
- Bundle size limit: 15 KB per game (16 KB for daggerheart and pbta; 33 KB for salvageunion due to baked-in tables).
- Remote data (e.g., Salvage Union tables) is read from the checked-in `__fixtures__/` snapshot at codegen time and baked into generated code. Codegen is hermetic (no network) unless `--refresh-remote` is passed; zero runtime network calls either way.

For the formal modifier taxonomy and classification system, see https://notation.randsum.dev.

## Publishing

Always `bun publish`. Never `npm publish`. See root `CLAUDE.md` for why.

See the root `CLAUDE.md` for monorepo-wide conventions (TypeScript style, testing framework, build output).
