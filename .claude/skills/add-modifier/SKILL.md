---
name: add-modifier
description: Add a new modifier to @randsum/roller (co-located schema + behavior, registered in RANDSUM_MODIFIERS)
disable-model-invocation: true
---

# Add a Modifier to @randsum/roller

Each modifier is a single file under `packages/roller/src/modifiers/<name>.ts` that exports a `<name>Schema` and a `<name>Modifier`, registered in `RANDSUM_MODIFIERS` in `packages/roller/src/modifiers/definitions.ts`. See `docs/adr/ADR-007-modifier-co-location.md` for the architectural rationale and tokenize-isolation invariant.

## Precondition — ask if missing

Confirm all of the following before writing code. If any are missing, ask:

1. **Name** (camelCase export prefix, e.g. `plus`, `explodeSequence`)
2. **Notation pattern** — the regex / surface syntax (e.g. `+N`, `C{...}`, `!s{4,6,8}`)
3. **Semantics** — exactly what the modifier does to the dice pool or total
4. **Category** — one of `Clamp | Map | Filter | Substitute | Generate | Accumulate | Scale | Reinterpret | Dispatch | Order` (used for `docs[].category`)

## Classify

Apply the primitives-vs-sugar taxonomy (14 primitives / 6 sugar / 1 macro — see user memory `notation-primitives-vs-sugar.md` and the canonical table on https://notation.randsum.dev):

- **Primitive** — irreducible behavior. Gets its own `apply` function.
- **Sugar** — maps to an existing primitive with a priority override or trivial transform. Prefer composing an existing behavior factory (see `shared/scale.ts`, `shared/explosion.ts`) instead of duplicating logic. `minus` is sugar over `plus`; `multiplyTotal` is sugar over `multiply` at a later priority.
- **Macro** — conditional dispatch at runtime (only `wildDie` today). Do not add a new macro without a design discussion.

Pick a **priority** slot from the table in `packages/roller/src/modifiers/definitions.ts` (lower runs earlier). The bucket layout is roughly:

| Range | Phase                                                              |
| ----- | ------------------------------------------------------------------ |
| 10–30 | Value transforms (cap, replace)                                    |
| 40–60 | Pool transforms (reroll, explode family, unique, drop, keep)       |
| 80    | Reinterpret (count)                                                |
| 85–94 | Arithmetic on total (multiply, plus, minus, integerDivide, modulo) |
| 95    | Order (sort)                                                       |
| 100   | Post-arithmetic scale (multiplyTotal)                              |

Insert the new entry in priority order; the comment next to each line must match.

## Create the file

Path: `packages/roller/src/modifiers/<name>.ts`

Minimum shape — read `packages/roller/src/modifiers/plus.ts` (simple scale) or `packages/roller/src/modifiers/drop.ts` (pool filter with conditions) before writing. Skeleton:

```ts
import type { NotationSchema } from '../notation/schema'
import { defineNotationSchema } from '../notation/schema'
import type { NotationDoc } from '../docs/modifierDocs'
import type { ModifierDefinition } from './schema'

const pattern = /.../

export const <name>Schema: NotationSchema<TOptions> = defineNotationSchema<TOptions>({
  name: '<name>',
  priority: <n>,
  pattern,
  parse: notation => { /* return Pick<ModifierOptions, '<name>'> or {} */ },
  toNotation: options => { /* string | undefined */ },
  toDescription: options => { /* string[] */ },
  docs: [ /* one NotationDoc per surface form */ ] satisfies readonly NotationDoc[]
})

export const <name>Modifier: ModifierDefinition<TOptions> = {
  ...<name>Schema,
  apply: (rolls, options) => ({ rolls: /* transformed */ }),
  // validate?: (options, context) => { throw new ModifierError(...) }
}
```

## Tokenize-isolation invariant (ADR-007)

The `<name>Schema` export **must not reference** any behavior-only symbol at module init time. This includes:

- Do not import `apply` helpers into the schema definition's body.
- Do not compute static data for the schema from functions that live only on the modifier.
- `docs` entries are static data (plain strings / objects) and are allowed — they do not break tree-shaking.

Violation leak test: `bun run --filter @randsum/roller size` — if `dist/tokenize.js` grows beyond its size-limit budget, a behavior has leaked. Trace the import graph from `packages/roller/src/tokenize.ts`.

## Register in RANDSUM_MODIFIERS

Edit `packages/roller/src/modifiers/definitions.ts`:

1. Add `import { <name>Modifier } from './<name>'` in alphabetical order with the other imports.
2. Insert `<name>Modifier as ModifierDefinition, // <priority> - <Category>` in priority order. The priority comment must match both the schema's `priority` field and the category used in `docs[].category`.

If the new modifier introduces a new option key on `ModifierOptions`, update `packages/roller/src/notation/types.ts` — add the option type and wire it into `ModifierOptions`.

## Tests

Tests live under `packages/roller/__tests__/` — there is no per-modifier folder. Choose by scope:

- **Parse / round-trip** — add cases to `packages/roller/__tests__/notation/parseModifiers.allSchemas.test.ts`, `schemas.test.ts`, and `notationToOptions.test.ts`.
- **Runtime behavior** — add to `packages/roller/__tests__/roll/modifiers.extended.test.ts` (isolated behavior) and `modifiers.interaction.test.ts` (interactions with other modifiers).
- **Edge cases & validation errors** — `packages/roller/__tests__/roll/edgeCases.test.ts`.
- **Property-based** — if the modifier has a clean invariant (e.g. "result is in [min,max]"), add a `.property.test.ts` using `fast-check` alongside existing property tests.
- **Tokenize** — `packages/roller/__tests__/notation/tokenize.test.ts` if the modifier introduces a new token surface.

Minimum bar: notation → options, options → notation (round-trip), one behavior test with a seeded RNG (`createSeededRandom(42)` from `test-utils`), and a validation failure case if `validate` is defined.

## Docs

The notation spec site is versioned Markdown, not per-modifier pages:

- Edit the current spec version at `apps/rdn/src/content/specs/<version>.md` (today: `v0.9.0.md`).
- Add the modifier to the relevant taxonomy table, priority table, and syntax section.
- If the change is non-breaking but new surface area, bump to the next pre-release version by adding a new `vX.Y.Z.md` file. Otherwise edit in place.

Also update `llms.txt` at the repo root if the new modifier materially changes the public notation surface.

## Verification (in order)

Stop on any failure:

```bash
bun run --filter @randsum/roller typecheck
bun run --filter @randsum/roller lint
bun run --filter @randsum/roller test
bun run --filter @randsum/roller size       # tokenize-isolation gate
bun run --filter @randsum/games gen:check   # codegen drift sanity
```

Then the full monorepo gate before committing:

```bash
bun run check:all
```

## Common traps

- **`size` fails on `dist/tokenize.js`** — the schema is pulling in behavior. Move any behavior-only helper out of the schema definition and import it only from the modifier export.
- **`gen:check` drift after touching modifier types** — some game specs emit code referencing the modifier option shape. Run `bun run --filter @randsum/games gen` and commit the regenerated files.
- **Priority collision / wrong order** — the comment next to the entry in `definitions.ts` must agree with the schema's `priority` and the category. Mismatches break assumptions in execution-pipeline tests (`__tests__/spec/s06-execution-pipeline/`).
- **`exactOptionalPropertyTypes`** — when copying options into a result object, use conditional assignment (`if (x !== undefined) out.x = x`) rather than spreading `undefined`. See `drop.ts` for the pattern.
- **`noUncheckedIndexedAccess`** — regex match results may be undefined at each index; narrow with `if (match?.[1])`.
- **Sugar duplication** — before writing `apply`, check `shared/scale.ts` and `shared/explosion.ts` for a factory that already does what you need (`createScaleBehavior`, `createAccumulatingExplosionBehavior`).

## Commit

Conventional commit, scoped to `roller`:

```
feat(roller): add <name> modifier
```
