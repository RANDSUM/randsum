---
name: add-modifier
description: Add a new modifier to @randsum/roller (schema in notation/definitions, behavior in modifiers, docs in docs/modifierDocData.ts)
disable-model-invocation: true
---

# Add a Modifier to @randsum/roller

A modifier is split across two files on purpose:

- `packages/roller/src/notation/definitions/<name>.ts` exports `<name>Schema` (pattern, parse, format, description, priority). It is added to `MODIFIER_SCHEMAS` in `packages/roller/src/notation/definitions/index.ts`.
- `packages/roller/src/modifiers/<name>.ts` exports `<name>Modifier`, which spreads `<name>Schema` and adds the dice-pool behavior. It is added to `MODIFIERS_BY_NAME` in `packages/roller/src/modifiers/definitions.ts`.

The tokenize path parses with the schemas, so it must never pull in behavior code. See `docs/adr/ADR-007-modifier-co-location.md` (status: amended, audit-1011) and the "Modifier system" section of `packages/roller/AGENTS.md`.

## Precondition — ask if missing

Confirm all of the following before writing code. If any are missing, ask:

1. **Name** — camelCase; it becomes the key on `ModifierOptions` and the export prefix (e.g. `plus`, `explodeSequence`)
2. **Notation pattern** — the regex / surface syntax (e.g. `+N`, `C{...}`, `!s{4,6,8}`)
3. **Semantics** — exactly what the modifier does to the dice pool or total
4. **Category** — a `ModifierCategory` from `packages/roller/src/notation/schema.ts`: `Clamp | Map | Filter | Substitute | Generate | Accumulate | Scale | Reinterpret | Dispatch | Order`

## Classify

Use the spec's derivation status (Primitive / Alias / Macro — https://randsum.dev/spec/, source `apps/site/src/content/specs/v0.9.0.md`):

- **Primitive** — irreducible behavior. Gets its own `apply`.
- **Alias** — same behavior as an existing primitive at a different priority or with a trivial transform. Reuse an existing behavior factory instead of duplicating logic: `createScaleBehavior` (`modifiers/shared/scale.ts`) or `createAccumulatingExplosionBehavior` (`modifiers/shared/explosion.ts`). `minus` and `multiplyTotal` are both `createScaleBehavior` with a different operation.
- **Macro** — conditional dispatch at runtime (only `wildDie` today). Do not add a new macro without a design discussion.

## Pick a priority

Execution order is each schema's `priority` field (lower runs earlier). `MODIFIER_SCHEMAS` sorts by it, and the lexer's token specs, notation rendering and `RANDSUM_MODIFIERS` all derive their order from that one list — there is no hand-ordered list to edit. Current slots (`grep -n 'priority:' packages/roller/src/notation/definitions/*.ts` to re-check):

| Priority | Modifiers                                                                    |
| -------- | ---------------------------------------------------------------------------- |
| 10–30    | cap (10), replace (30)                                                       |
| 40–66    | reroll (40), explode (50), compound (51), penetrate (52), explodeSequence (53), wildDie (55), unique (60), drop (65), keep (66) |
| 80       | count                                                                        |
| 85–94    | multiply (85), plus (90), minus (91), integerDivide (93), modulo (94)        |
| 95       | sort                                                                         |
| 100      | multiplyTotal                                                                |

Choose an unused value in the right phase.

## 1. Add the option

Add `<name>?: <TOptions>` to `ModifierOptions` in `packages/roller/src/notation/types.ts` (and any new options type next to it). A schema's `name` is typed `keyof ModifierOptions`, so nothing below typechecks until this exists.

## 2. Create the schema

Path: `packages/roller/src/notation/definitions/<name>.ts`. Read `notation/definitions/plus.ts` (built on the shared `createArithmeticNotation`) or `notation/definitions/drop.ts` (conditions, multiple surfaces) first. Skeleton:

```ts
import type { <TOptions> } from '../types'
import { type NotationSchema, defineNotationSchema } from '../schema'

export const <name>Schema: NotationSchema<<TOptions>> = defineNotationSchema<<TOptions>>({
  name: '<name>',
  priority: <n>,
  tokenKey: '<token key>', // stable lexer token key, e.g. 'C{..}', 'drop', '+'
  category: '<Category>',
  pattern: /.../, // no 'g' flag
  parse: notation => {
    /* return { <name>: options } or {} */
  },
  toNotation: options => {
    /* string | undefined */
  },
  toDescription: options => {
    /* string[] */
  }
})
```

Then add `<name>: <name>Schema` to the record in `packages/roller/src/notation/definitions/index.ts`. The record is `satisfies Record<keyof ModifierOptions, NotationSchema>`, so a missing entry is a type error.

## 3. Create the behavior

Path: `packages/roller/src/modifiers/<name>.ts`. Read `modifiers/plus.ts` (scale factory) or `modifiers/drop.ts` (custom `apply`) first. Skeleton:

```ts
import type { <TOptions> } from '../notation/types'
import { <name>Schema } from '../notation/definitions/<name>'
import type { ModifierDefinition } from './schema'

export const <name>Modifier: ModifierDefinition<<TOptions>> = {
  ...<name>Schema,
  apply: (rolls, options, ctx) => ({ rolls: /* transformed, never mutate input */ })
  // validate?: (options, rollContext) => { throw new ModifierError(...) }
  // requiresRollFn / requiresParameters / requiresRandomFn / mutatesRolls: see modifiers/schema.ts
}
```

Then edit `packages/roller/src/modifiers/definitions.ts`: add `import { <name>Modifier } from './<name>'` alphabetically and `<name>: <name>Modifier` to `MODIFIERS_BY_NAME`. It is typed `Record<keyof ModifierOptions, ModifierDefinition>`, so a missing entry is a type error. `RANDSUM_MODIFIERS` is derived from it — do not edit it.

## 4. Add the docs

Static docs are pure data in `packages/roller/src/docs/modifierDocData.ts`, never on the schema. Add a `<name>Docs: readonly NotationDoc[]` group (one entry per notation surface; the first entry's `category` must equal the schema's) and insert it in `MODIFIER_DOCS_BY_NAME` at its priority position. Then update the hard-coded counts in `packages/roller/__tests__/docs/modifierDocSync.test.ts` (modifier count and doc entry count); that test also checks the order and categories.

## Tokenize-isolation invariant (ADR-007)

`notation/definitions/<name>.ts` must not import anything from `src/modifiers/**` or the roll pipeline, and must not carry a `docs` array. Enforcement:

- Biome GritQL rule `biome-plugins/no-tokenize-modifier-import.grit` (runs in `bun run lint`) rejects importing a `*Modifier` symbol into tokenize-reachable files.
- `bun run --filter @randsum/roller size` — if `dist/tokenize.js` exceeds its budget in `packages/roller/package.json`, behavior or doc data has leaked. Trace the import graph from `packages/roller/src/tokenize.ts`.

## Tests

Tests live under `packages/roller/__tests__/` — there is no per-modifier folder. Choose by scope:

- **Parse / round-trip** — `__tests__/notation/parseModifiers.allSchemas.test.ts`, `schemas.test.ts`, `notationToOptions.test.ts`.
- **Runtime behavior** — `__tests__/roll/modifiers.extended.test.ts` (isolated) and `modifiers.interaction.test.ts` (with other modifiers).
- **Edge cases & validation errors** — `__tests__/roll/edgeCases.test.ts`.
- **Property-based** — if there is a clean invariant (e.g. "result is in [min,max]"), add a `.property.test.ts` using `fast-check`.
- **Tokenize** — `__tests__/notation/tokenize.test.ts` for a new token surface.
- **Execution order** — `__tests__/spec/s06-execution-pipeline/`.

Minimum bar: notation → options, options → notation (round-trip), one behavior test with a seeded RNG (`createSeededRandom(42)` from `packages/roller/test-utils/src/seededRandom.ts`), and a validation failure case if `validate` is defined.

## Spec and public docs

- Document the notation in the spec at `apps/site/src/content/specs/v0.9.0.md` (served at https://randsum.dev/spec/): taxonomy table, priority table, syntax section. Add a new `vX.Y.Z.md` only for a version bump; otherwise edit in place.
- Update `llms.txt` at the repo root if the public notation surface materially changes.

## Verification (in order)

Stop on any failure:

```bash
bun run --filter @randsum/roller typecheck
bun run lint                                # Biome, whole repo
bun run --filter @randsum/roller test
bun run --filter @randsum/roller size       # tokenize-isolation gate
bun run --filter @randsum/games gen:check   # codegen drift sanity
```

Then the full monorepo gate before committing:

```bash
bun run check
```

## Common traps

- **`size` fails on `dist/tokenize.js`** — the schema is pulling in behavior or docs. Keep behavior in `modifiers/<name>.ts` and docs in `packages/roller/src/docs/modifierDocData.ts`.
- **`modifierDocSync.test.ts` fails** — the docs group is missing, out of priority order, its first entry's category differs from the schema's, or the hard-coded counts were not bumped.
- **`gen:check` drift after touching modifier types** — run `bun run --filter @randsum/games gen` and commit the regenerated files.
- **`exactOptionalPropertyTypes`** — when copying options into a result object, assign conditionally (`if (x !== undefined) out.x = x`) rather than spreading `undefined`. See `notation/definitions/drop.ts`.
- **`noUncheckedIndexedAccess`** — regex match groups may be undefined; narrow with `if (match?.[1])`.

## Commit

Conventional commit, scoped to `roller`:

```
feat(roller): add <name> modifier
```
