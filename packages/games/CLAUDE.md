# @randsum/games - TTRPG Game Packages

## Overview

Wraps `@randsum/roller` with game-specific dice mechanics for tabletop RPGs. Each game is defined as a declarative `.randsum.json` spec and code-generated into TypeScript. Consumer API uses subpath exports:

```typescript
import { roll } from "@randsum/games/blades"
import { roll } from "@randsum/games/salvageunion"
```

Each game's `roll()` returns a `GameRollResult<TResult, TDetails, TRollRecord>` with typed `result`, `total`, and `rolls`.

## Directory Structure

```
packages/games/
  *.randsum.json          # Game specs (one per game, at package root)
  randsum.json            # Meta-schema for spec validation
  codegen.ts              # Codegen entry point
  build.ts                # Custom build script (bunup)
  src/
    *.generated.ts        # Generated game modules (DO NOT EDIT)
    index.ts              # Root export (AVAILABLE_GAMES, GameRollResult, SchemaError)
    types.ts              # GameRollResult generic type
    schema.ts             # Schema validation/loading exports
    lib/
      codegen/            # Code generation pipeline
      codegen.ts          # generateCode() function
      pipeline.ts         # Runtime roll pipeline
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
    salvageunion-tables.json      # Cached remote table data
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
2. Validates each against the meta-schema
3. Fetches remote data if needed (e.g., Salvage Union tables), caches to `__fixtures__/`
4. Calls `generateCode()` from `src/lib` to produce TypeScript
5. Formats with Prettier and writes to `src/<shortcode>.generated.ts`

Generated files import from `@randsum/roller/roll` and `@randsum/roller/validate`. They export a typed `roll()` function and re-export `GameRollResult`, `RollRecord`, `SchemaError`.

## Adding a New Game

1. Create `<shortcode>.randsum.json` at the package root
2. Run `bun run --filter @randsum/games gen` to generate `src/<shortcode>.generated.ts`
3. Add a subpath export in `package.json` under `"exports"` (follow existing pattern)
4. Add the shortcode to `AVAILABLE_GAMES` in `src/index.ts`
5. Add a size-limit entry in `package.json` (15 KB limit for most games, 35 KB for salvageunion)
6. Write `__tests__/<shortcode>.test.ts` and `__tests__/<shortcode>.property.test.ts`
7. Run `bun run --filter @randsum/games check` to verify everything passes

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
- Bundle size limit: 15 KB per game (35 KB for salvageunion due to baked-in tables).
- Remote data (e.g., Salvage Union tables) is fetched at codegen time and baked into generated code. Zero runtime network calls.

For the formal modifier taxonomy and classification system, see https://notation.randsum.dev.

See the root `CLAUDE.md` for monorepo-wide conventions (TypeScript style, testing framework, build output).
