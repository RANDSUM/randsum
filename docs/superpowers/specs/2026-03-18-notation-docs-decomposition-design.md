# Notation Docs Decomposition Design

**Date:** 2026-03-18
**Branch:** `jarvis/site-cleanup`
**Scope:** `packages/roller`

## Problem

`MODIFIER_DOCS` is a 593-line hand-maintained static object in `src/docs/modifierDocs.ts`, completely disconnected from the `NotationSchema` definitions in `src/modifiers/<mod>.ts`. Documentation data and schema data can drift. Additionally, special dice types (percentile, Fate, geometric, draw, zero-bias, custom faces) have no doc entries at all.

## Design

Co-locate documentation data with the schemas that define each notation feature, then derive the public constants downstream. `NotationDoc` describes every shape in the notation system — core dice, special dice, and all modifiers.

### Type Changes

**Rename `ModifierDoc` to `NotationDoc`**, add `category` and `key` fields:

```typescript
interface NotationDoc {
  readonly key: string
  readonly category: string
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly displayOptional?: string
  readonly forms: readonly { readonly notation: string; readonly note: string }[]
  readonly comparisons?: readonly { readonly operator: string; readonly note: string }[]
  readonly examples: readonly { readonly notation: string; readonly description: string }[]
}
```

`key` is the stable record identifier (e.g., `'-'` for minus), separate from `displayBase` which is the display string (e.g., `'\u2212'`). Record keys use `key`, not `displayBase`.

**Deprecation bridge:** Export `type ModifierDoc = NotationDoc` for backwards compatibility until the next major version.

**Add optional `docs` field to `NotationSchema`:**

```typescript
interface NotationSchema<TOptions = unknown> {
  name: keyof ModifierOptions
  priority: number
  pattern: RegExp
  parse: (notation: string) => Partial<ModifierOptions>
  toNotation: (options: TOptions) => string | undefined
  toDescription: (options: TOptions) => string[]
  readonly docs?: readonly NotationDoc[]
}
```

Optional because `NotationSchema` may be used in standalone contexts. The derivation logic filters schemas without docs.

Each modifier schema declares an array because one schema can produce multiple doc entries (e.g., `drop` owns docs for `L`, `H`, `D{..}`).

**New `DiceSchema` type** (internal, not a public export):

```typescript
interface DiceSchema {
  readonly name: string
  readonly doc: NotationDoc
}
```

Singular `doc` — each dice type maps 1:1 to a doc entry. Defined alongside a `RANDSUM_DICE_SCHEMAS` array in `src/dice/index.ts`.

### Categories

**Dice categories:**
- `"Core"` — `NdS` (standard dice)
- `"Special"` — percentile, Fate/Fudge, zero-bias, geometric, draw, custom faces

**Modifier categories:**
- `"Pool"` — drop (L, H, D{..}), keep (K, KL, KM), reroll (R{..}, ro{..}), replace (V{..}), cap (C{..}), unique (U)
- `"Explode"` — explode (!), compound (!!), penetrate (!p), explode sequence (!s{..}), inflation (!i), reduction (!r)
- `"Arithmetic"` — plus (+), minus (-), multiply (*), multiplyTotal (**), integerDivide (//), modulo (%)
- `"Counting"` — count (#{..}), successes (S{..}), failures (F{..}), margin of success (ms{..})
- `"Order"` — sort
- `"Special"` — wild die (W)

### Derived Constants

**`NOTATION_DOCS`** — the unified export merging all dice and modifier docs:

```typescript
export const NOTATION_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries([
    ...RANDSUM_DICE_SCHEMAS.map(schema => [schema.doc.key, schema.doc]),
    ...RANDSUM_MODIFIERS.flatMap(mod =>
      (mod.docs ?? []).map(doc => [doc.key, doc])
    )
  ])
)
```

**`MODIFIER_DOCS`** — narrower re-export for backwards compatibility (excludes dice docs, excludes `xDN` which was previously present but now correctly lives in dice docs):

```typescript
export const MODIFIER_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(
    RANDSUM_MODIFIERS.flatMap(mod =>
      (mod.docs ?? []).map(doc => [doc.key, doc])
    )
  )
)
```

**`DICE_DOCS`** — dice-only docs:

```typescript
export const DICE_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(
    RANDSUM_DICE_SCHEMAS.map(schema => [schema.doc.key, schema.doc])
  )
)
```

All three are exported from `@randsum/roller/docs`.

### File Changes

**Modified files (all 19 modifier files in `src/modifiers/`):**
Each `src/modifiers/<mod>.ts` gains doc entries on its schema definition. The doc content is moved from the static `MODIFIER_DOCS` object.

Example (`src/modifiers/drop.ts`):
```typescript
export const dropSchema: NotationSchema<DropOptions> = defineNotationSchema({
  name: 'drop',
  priority: 20,
  pattern: /(...)/,
  parse: notation => { ... },
  toNotation: options => { ... },
  toDescription: options => { ... },
  docs: [
    {
      key: 'D{..}',
      category: 'Pool',
      title: 'Drop by Condition',
      displayBase: 'D{..}',
      // ... rest of doc entry
    },
    {
      key: 'L',
      category: 'Pool',
      title: 'Drop Lowest',
      displayBase: 'L',
      displayOptional: 'n',
      // ... rest of doc entry
    },
    {
      key: 'H',
      category: 'Pool',
      title: 'Drop Highest',
      displayBase: 'H',
      displayOptional: 'n',
      // ... rest of doc entry
    }
  ]
})
```

**New file:** `src/dice/index.ts`
- Defines `DiceSchema` type (internal, not exported from package)
- Defines `RANDSUM_DICE_SCHEMAS` array with 7 entries:
  - `core` (xDN) — category `"Core"`
  - `percentile` (d%) — category `"Special"`
  - `fate` (dF) — category `"Special"`
  - `zeroBias` (zN) — category `"Special"`
  - `geometric` (gN) — category `"Special"`
  - `draw` (DDN) — category `"Special"`
  - `customFaces` (d{...}) — category `"Special"`

**Modified:** `src/notation/schema.ts`
- Add `readonly docs?: readonly NotationDoc[]` to `NotationSchema` (optional)
- Update `defineNotationSchema` to accept docs

**Modified:** `src/docs/modifierDocs.ts`
- Rename `ModifierDoc` to `NotationDoc`
- Export `type ModifierDoc = NotationDoc` (deprecation bridge)
- Delete the static `MODIFIER_DOCS` object
- Replace with derived `NOTATION_DOCS`, `MODIFIER_DOCS`, and `DICE_DOCS` constants

**Modified:** `src/docs/index.ts`
- Re-export `NotationDoc`, `ModifierDoc` (deprecated alias), `NOTATION_DOCS`, `MODIFIER_DOCS`, `DICE_DOCS`

**Modified:** `__tests__/docs.test.ts`
- Update type references to `NotationDoc`
- Add `DICE_DOCS` and `NOTATION_DOCS` coverage
- Test derivation correctness (every modifier has docs, every dice type has a doc)
- Verify `NOTATION_DOCS` is the superset of `MODIFIER_DOCS` + `DICE_DOCS`

**Modified consumers (and their tests):**
- `apps/playground/` — `ModifierDoc` → `NotationDoc` (in components and `__tests__/`)
- `apps/cli/` — `ModifierDoc` → `NotationDoc`

**Modified:** `packages/roller/CLAUDE.md`
- Document `NOTATION_DOCS`, `DICE_DOCS`, `NotationDoc`, `category` field, `key` field
- Note `ModifierDoc` deprecation

**Deleted:**
- The 593-line hand-maintained `MODIFIER_DOCS` object body (content moves to 19 modifier files + 7 dice schemas)

### Bundle Size Impact

**Accepted tradeoff:** Adding `docs` to `NotationSchema` means docs data is part of the schema object. This will increase the `tokenize` subpath bundle since tokenize imports schemas. The `dist/tokenize.js` size-limit in `package.json` must be bumped to accommodate (estimate: +8-12 KB for ~29 doc entries of string literals).

This deliberately weakens the tokenize isolation invariant documented in the roller's CLAUDE.md. The invariant was designed to prevent *behavior* from leaking into the tokenize bundle; docs data is static display content, not behavior, so the invariant's intent is preserved even though the bundle grows. The CLAUDE.md isolation invariant language should be updated to reflect this: schemas may contain static display data (`docs`) alongside parsing logic.

The `dist/docs/index.js` size-limit (20 KB) may also need bumping since it now imports from both modifier schemas and dice schemas. Measure after implementation.

### Public API

| Export | Change |
|--------|--------|
| `NOTATION_DOCS` | New. Unified record of all dice + modifier docs. |
| `MODIFIER_DOCS` | Narrower: excludes `xDN` (moved to `DICE_DOCS`). Breaking for `MODIFIER_DOCS['xDN']` consumers. |
| `DICE_DOCS` | New. Dice-only docs. |
| `NotationDoc` | Replaces `ModifierDoc`. Adds `category` and `key` fields. |
| `ModifierDoc` | Deprecated type alias for `NotationDoc`. Removed in next major. |

### Breaking Changes

1. `MODIFIER_DOCS['xDN']` no longer exists — use `NOTATION_DOCS['xDN']` or `DICE_DOCS['xDN']`
2. `ModifierDoc` type is deprecated — use `NotationDoc`
3. `NotationDoc` has two new required fields: `category` and `key`

### Mapping: Schema → Doc Entries

| Schema | Doc Keys | Category |
|--------|----------|----------|
| `drop` | `L`, `H`, `D{..}` | Pool |
| `keep` | `K`, `KL`, `KM` | Pool |
| `reroll` | `R{..}`, `ro{..}` | Pool |
| `replace` | `V{..}` | Pool |
| `cap` | `C{..}` | Pool |
| `unique` | `U` | Pool |
| `sort` | `sort` | Order | **New doc entry** (no existing content to move — must be authored) |
| `explode` | `!` | Explode |
| `compound` | `!!` | Explode |
| `penetrate` | `!p` | Explode |
| `explodeSequence` | `!s{..}`, `!i`, `!r` | Explode |
| `plus` | `+` | Arithmetic |
| `minus` | `-` | Arithmetic |
| `multiply` | `*` | Arithmetic |
| `multiplyTotal` | `**` | Arithmetic |
| `integerDivide` | `//` | Arithmetic |
| `modulo` | `%` | Arithmetic |
| `count` | `#{..}`, `S{..}`, `F{..}`, `ms{..}` | Counting |
| `wildDie` | `W` | Special |

### Dice Schema Entries

| Name | Key | Display | Category |
|------|-----|---------|----------|
| `core` | `xDN` | `xDN` | Core |
| `percentile` | `d%` | `d%` | Special |
| `fate` | `dF` | `dF` | Special |
| `zeroBias` | `zN` | `zN` | Special |
| `geometric` | `gN` | `gN` | Special |
| `draw` | `DDN` | `DDN` | Special |
| `customFaces` | `d{...}` | `d{...}` | Special |

### Implementation Notes

- **`sort`** has no existing doc entry in `MODIFIER_DOCS`. A new doc entry must be authored (not relocated).
- **`explodeSequence`** intentionally owns 3 doc entries (`!s{..}`, `!i`, `!r`). Inflation and reduction are sugar for explode-sequence, all handled in `explodeSequence.ts`. This is co-location, not an oversight.
- **`fate`** covers both `dF` (Fate Core, -1/0/+1) and `dF.2` (Extended Fudge, -2 to +2) as multiple `forms` within a single `NotationDoc` entry — consistent with how other schemas handle variants.
- **`count`** owns 4 doc entries (`#{..}`, `S{..}`, `F{..}`, `ms{..}`), the most of any schema. `S{..}`, `F{..}`, and `ms{..}` are all sugar for the `#{..}` primitive.
- **`reroll`** owns 2 doc entries (`R{..}`, `ro{..}`). `ro{..}` is sugar for `R{..}` with max depth=1, both handled in `reroll.ts`.
- **Subpath export** `@randsum/roller/docs` already points to `src/docs/index.ts` — no `package.json` subpath changes needed.
