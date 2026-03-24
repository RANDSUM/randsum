# Implementation Spec: Unify Notation Docs

**Sprint:** scram/unify-notation-docs
**Status:** approved (G2 spec-as-docs pass)
**Date:** 2026-03-24
**ADR references:** ADR-007 (modifier co-location)

---

## Phase 1: Co-locate Modifier Docs onto NotationSchema

### Overview

Move each modifier's `NotationDoc` entries from the centralized `modifierDocEntries.ts` file into the `*Schema` export of the co-located modifier file (`src/modifiers/<mod>.ts`). Derive `MODIFIER_DOC_ENTRIES` in `modifierDocs.ts` from `RANDSUM_MODIFIERS` by flat-mapping each modifier's `schema.docs`. Delete `modifierDocEntries.ts`. Strip `displayOptional` from `NotationDoc` and all entries. Rewrite `modifierDocSync.test.ts` as a structural bidirectional assertion.

This mirrors the `RANDSUM_DICE_SCHEMAS` pattern: dice types carry their `NotationDoc` inline on their schema object. After this phase, adding a modifier is a single-file operation.

---

### 1.1 Type Changes

#### `packages/roller/src/docs/modifierDocs.ts` — `NotationDoc` interface

Remove the `displayOptional` field. The updated interface is:

```typescript
export interface NotationDoc {
  readonly key: string
  readonly category: ModifierCategory
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly color: string
  readonly colorLight: string
  readonly forms: readonly {
    readonly notation: string
    readonly note: string
  }[]
  readonly comparisons?: readonly {
    readonly operator: string
    readonly note: string
  }[]
  readonly examples: readonly {
    readonly description: string
    readonly notation: string
    readonly options?: RollOptions<string | number>
  }[]
}
```

`displayOptional` is removed entirely — not made optional, not deprecated. It has zero consumers outside `modifierDocEntries.ts` itself. Removing it is a breaking change to the `NotationDoc` type only; no public API behavior changes.

#### `packages/roller/src/notation/schema.ts` — `NotationSchema` interface

Add a `docs` field as an optional `readonly NotationDoc[]`. The field is optional because `NotationSchema` is generic and some internal usage (e.g., tests constructing minimal schemas) should not be forced to supply docs. In practice, every modifier registered in `RANDSUM_MODIFIERS` must have non-empty `docs` — this is enforced by the updated sync test, not by the TypeScript type.

```typescript
export interface NotationSchema<TOptions = unknown> {
  name: keyof ModifierOptions
  priority: number
  pattern: RegExp
  parse: (notation: string) => Partial<ModifierOptions>
  toNotation: (options: TOptions) => string | undefined
  toDescription: (options: TOptions) => string[]
  /**
   * Static documentation entries for this modifier.
   * One modifier may produce multiple entries (e.g., drop produces 'L', 'H', 'D{..}').
   * Required for any modifier registered in RANDSUM_MODIFIERS.
   * Must not reference any behavior-only symbols (safe for tokenize bundle).
   */
  docs?: readonly NotationDoc[]
}
```

`NotationDoc` is imported from `'../docs/modifierDocs'`. This import direction (schema.ts importing from modifierDocs.ts) is the same direction already used by `src/dice/index.ts`. The tokenize isolation invariant is preserved because `docs` contains only static data — no functions, no behavior symbols. The `size-limit` gate on `dist/tokenize.js` is the enforcement check.

---

### 1.2 Modifier File Pattern

Each modifier file in `src/modifiers/<mod>.ts` must export its `*Schema` with a populated `docs` array. The `docs` array contains one or more `NotationDoc` objects — the same objects that were previously in `modifierDocEntries.ts`.

**Target structure for `drop.ts` (example — modifier with multiple doc entries):**

```typescript
import type { NotationDoc } from '../docs/modifierDocs'

// ... existing imports unchanged ...

export const dropSchema: NotationSchema<DropOptions> = defineNotationSchema<DropOptions>({
  name: 'drop',
  priority: 65,
  pattern: /* unchanged */,
  parse: /* unchanged */,
  toNotation: /* unchanged */,
  toDescription: /* unchanged */,

  docs: [
    {
      key: 'L',
      category: 'Filter',
      color: '#fb7185',
      colorLight: '#e11d48',
      title: 'Drop Lowest',
      description: 'Remove the lowest-valued dice from the pool before summing.',
      displayBase: 'L',
      forms: [{ notation: 'L(n)', note: 'Drop n lowest (default: 1)' }],
      examples: [
        {
          description: 'Roll 4d6, drop lowest (ability scores)',
          notation: '4d6L',
          options: { sides: 6, quantity: 4, modifiers: { drop: { lowest: 1 } } }
        },
        {
          description: 'Roll 5d6, drop 2 lowest',
          notation: '5d6L2',
          options: { sides: 6, quantity: 5, modifiers: { drop: { lowest: 2 } } }
        }
      ]
    },
    {
      key: 'H',
      category: 'Filter',
      color: '#fb7185',
      colorLight: '#e11d48',
      title: 'Drop Highest',
      description: 'Remove the highest-valued dice from the pool before summing.',
      displayBase: 'H',
      forms: [{ notation: 'H(n)', note: 'Drop n highest (default: 1)' }],
      examples: [
        {
          description: 'Roll 2d20, drop highest (disadvantage)',
          notation: '2d20H',
          options: { sides: 20, quantity: 2, modifiers: { drop: { highest: 1 } } }
        },
        {
          description: 'Roll 4d6, drop highest',
          notation: '4d6H',
          options: { sides: 6, quantity: 4, modifiers: { drop: { highest: 1 } } }
        }
      ]
    },
    {
      key: 'D{..}',
      category: 'Filter',
      color: '#e11d48',
      colorLight: '#9f1239',
      title: 'Drop by Condition',
      description:
        'Drop any dice matching a condition \u2014 more flexible than L/H for arbitrary thresholds.',
      displayBase: 'D{..}',
      forms: [{ notation: 'D{...}', note: 'Comma-separate multiple conditions' }],
      comparisons: [
        { operator: 'n', note: 'drop dice showing exactly n' },
        { operator: '>n', note: 'drop dice showing more than n' },
        { operator: '>=n', note: 'drop dice showing n or more' },
        { operator: '<n', note: 'drop dice showing less than n' },
        { operator: '<=n', note: 'drop dice showing n or less' }
      ],
      examples: [
        {
          description: 'Drop all 1s',
          notation: '4d6D{1}',
          options: { sides: 6, quantity: 4, modifiers: { drop: { exact: [1] } } }
        },
        {
          description: 'Drop all 5s and above',
          notation: '4d6D{>=5}',
          options: { sides: 6, quantity: 4, modifiers: { drop: { greaterThanOrEqual: 5 } } }
        },
        { description: 'Drop any result of 2 or lower', notation: '4d6D{<=2}' },
        { description: 'Drop multiple', notation: '4d6D{1,6}' }
      ]
    }
  ]
})
```

`dropModifier` is unchanged — it spreads `dropSchema` and adds `apply` and `validate`. No changes to the behavior half.

---

### 1.3 Modifier-to-Doc-Entry Mapping

The mapping of modifier names to doc entry keys is as follows. Every modifier in `RANDSUM_MODIFIERS` contributes exactly one `docs` array. Some arrays have multiple entries (multiple notation surfaces for the same modifier).

| Modifier name | `schema.docs[].key` values |
|---|---|
| `cap` | `'C{..}'` |
| `replace` | `'V{..}'` |
| `reroll` | `'R{..}'`, `'ro{..}'` |
| `explode` | `'!'` |
| `compound` | `'!!'` |
| `penetrate` | `'!p'` |
| `explodeSequence` | `'!s{..}'` |
| `wildDie` | `'W'` |
| `unique` | `'U'` |
| `drop` | `'L'`, `'H'`, `'D{..}'` |
| `keep` | `'K'`, `'KL'`, `'KM'` |
| `count` | `'#{..}'`, `'S{..}'`, `'F{..}'`, `'ms{..}'` |
| `multiply` | `'*'` |
| `plus` | `'+'` |
| `minus` | `'-'` |
| `integerDivide` | `'//'` |
| `modulo` | `'%'` |
| `sort` | `'sort'` |
| `multiplyTotal` | `'**'` |

Total: 19 modifier names → 28 doc entries. This is the same count as the current `MODIFIER_DOC_ENTRIES` array (845 lines, 28 entries).

**Key finding on `count`:** The `count` modifier currently has four entries in `modifierDocEntries.ts`: `'#{..}'`, `'S{..}'` (Count Successes), `'F{..}'` (Count Failures), and `'ms{..}'` (Margin of Success). All four belong on `countSchema.docs`.

**Key finding on `reroll`:** The `reroll` modifier has two entries: `'R{..}'` (Reroll) and `'ro{..}'` (Reroll Once, sugar for `max: 1`). Both belong on `rerollSchema.docs`.

---

### 1.4 Derivation in `modifierDocs.ts`

Replace the `MODIFIER_DOC_ENTRIES` import and the `modifierEntries` derivation with a flat-map over `RANDSUM_MODIFIERS`:

```typescript
import { RANDSUM_MODIFIERS } from '../modifiers/definitions'
import { RANDSUM_DICE_SCHEMAS } from '../dice/index'
import type { ModifierCategory } from '../notation/tokenize'
import type { RollOptions } from '../notation/types'

export type { ModifierCategory }

export interface NotationDoc { /* ... as specified in 1.1 ... */ }

export type ModifierDoc = NotationDoc

const diceEntries: readonly [string, NotationDoc][] = RANDSUM_DICE_SCHEMAS.map(schema => [
  schema.doc.key,
  schema.doc
])

const modifierEntries: readonly [string, NotationDoc][] = RANDSUM_MODIFIERS.flatMap(mod =>
  mod.docs ?? []
).map(doc => [doc.key, doc] as [string, NotationDoc])

export const NOTATION_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries([...diceEntries, ...modifierEntries])
)

export const MODIFIER_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(modifierEntries)
)

export const DICE_DOCS: Readonly<Record<string, NotationDoc>> = Object.freeze(
  Object.fromEntries(diceEntries)
)
```

The `RANDSUM_MODIFIERS` import comes from `'../modifiers/definitions'`. This file already imports all 19 modifier definitions.

**`ModifierDefinition` is a flat intersection type** — `NotationSchema<TOptions> & ModifierBehavior<TOptions>` — not a wrapper with a `.schema` property. The `docs` field lives directly on the modifier object (inherited from `NotationSchema`), accessed as `mod.docs`, not `mod.schema.docs`. The `??` operator gracefully handles any modifier that hasn't yet had its docs populated (produces no entries for that modifier). This is a developer ergonomic safety valve only — the sync test enforces that all registered modifiers have non-empty docs.

**Public API invariant:** The final contents of `NOTATION_DOCS`, `MODIFIER_DOCS`, and `DICE_DOCS` must be identical to the current contents — same keys, same values, same shapes. The `rosettaStone.test.ts` test suite is the regression guard.

---

### 1.5 Deletion

Delete `packages/roller/src/docs/modifierDocEntries.ts` entirely. It must not be re-exported, re-imported, or referenced anywhere after this change.

Verify with `bun run knip` that no dangling imports remain.

---

### 1.6 Sync Test Rewrite

Replace `packages/roller/__tests__/docs/modifierDocSync.test.ts` with a structural bidirectional assertion. The old test:
- Imported `MODIFIER_DOC_ENTRIES` directly (now deleted)
- Spot-checked 22 specific keys by string equality
- Asserted `'docs' in mod` is `false` for every modifier

The new test must:

```typescript
import { describe, expect, test } from 'bun:test'
import { RANDSUM_MODIFIERS } from '../../src/modifiers/definitions'
import { MODIFIER_DOCS } from '../../src/docs/modifierDocs'

describe('modifier doc sync', () => {
  test('every modifier in RANDSUM_MODIFIERS has a non-empty docs array', () => {
    for (const mod of RANDSUM_MODIFIERS) {
      expect(mod.docs).toBeDefined()
      expect(mod.docs!.length).toBeGreaterThan(0)
    }
  })

  test('every key in MODIFIER_DOCS is owned by exactly one modifier in RANDSUM_MODIFIERS', () => {
    const allDocKeys = new Set(
      RANDSUM_MODIFIERS.flatMap(mod => (mod.docs ?? []).map(doc => doc.key))
    )
    for (const key of Object.keys(MODIFIER_DOCS)) {
      expect(allDocKeys.has(key)).toBe(true)
    }
  })

  test('MODIFIER_DOCS contains exactly the keys declared in RANDSUM_MODIFIERS docs', () => {
    const allDocKeys = RANDSUM_MODIFIERS.flatMap(mod =>
      (mod.docs ?? []).map(doc => doc.key)
    )
    expect(Object.keys(MODIFIER_DOCS).sort()).toEqual(allDocKeys.sort())
  })

  test('total doc entry count matches expected (28)', () => {
    expect(Object.keys(MODIFIER_DOCS).length).toBe(28)
  })
})
```

The count test (`28`) is a tripwire: if a modifier is added or a doc entry is added/removed, the test fails with a clear message. The developer must update the count intentionally. This is preferable to an unchecked count drift.

**What this eliminates:** The old test's `expect('docs' in mod).toBe(false)` assertion must be removed. The new assertion is the inverse: `expect('docs' in mod).toBe(true)` is enforced implicitly by `expect(mod.docs!.length).toBeGreaterThan(0)`.

---

### 1.7 `displayOptional` Removal

`displayOptional` appears in 15 entries across `modifierDocEntries.ts`. All 15 must have the field removed when migrating their entry to the co-located modifier file. The entries with `displayOptional` defined are:

- `compound` — `'!!'` entry: `displayOptional: 'n'`
- `penetrate` — `'!p'` entry: `displayOptional: 'n'`
- `unique` — `'U'` entry: `displayOptional: '{..}'`
- `drop` — `'L'` entry: `displayOptional: 'n'`
- `drop` — `'H'` entry: `displayOptional: 'n'`
- `keep` — `'K'` entry: `displayOptional: 'n'`
- `keep` — `'KL'` entry: `displayOptional: 'n'`
- `keep` — `'KM'` entry: `displayOptional: 'n'`
- `multiply` — `'*'` entry: `displayOptional: 'n'`
- `plus` — `'+'` entry: `displayOptional: 'n'`
- `minus` — `'-'` entry: `displayOptional: 'n'`
- `integerDivide` — `'//'` entry: `displayOptional: 'n'`
- `modulo` — `'%'` entry: `displayOptional: 'n'`
- `sort` — `'sort'` entry: `displayOptional: '/sd'`
- `multiplyTotal` — `'**'` entry: `displayOptional: 'n'`

Do not move `displayOptional` values into `forms[].note` or anywhere else — simply drop the field. The `NotationDoc` interface no longer declares it, so TypeScript will reject any entry that retains it.

---

### 1.8 Tokenize Isolation Verification

After the migration, run:

```bash
bun run --filter @randsum/roller size
```

The `dist/tokenize.js` bundle size must not increase meaningfully from its pre-migration baseline. The `docs` arrays are static data (string literals and plain objects with no function references), so ESM tree-shaking correctly eliminates them from the tokenize bundle when only `<mod>Schema` notation methods are imported.

If the tokenize bundle grows unexpectedly, trace the import graph from `src/tokenize.ts`. The most likely cause is an accidental import in a modifier file that creates a module-level side effect or references a behavior symbol.

---

### 1.9 `ModifierDefinition` Access Pattern

`ModifierDefinition` is defined as `NotationSchema<TOptions> & ModifierBehavior<TOptions>` — a flat intersection, not a wrapper object. There is no `.schema` sub-property. All `NotationSchema` fields (`name`, `priority`, `pattern`, `parse`, `toNotation`, `toDescription`, and the new `docs`) are top-level properties on every `ModifierDefinition` instance.

The derivation in `modifierDocs.ts` uses `mod.docs`, not `mod.schema.docs`. The sync test accesses `mod.docs`, not `mod.schema.docs`. The drop example in section 1.2 adds `docs` at the top level of `defineNotationSchema({...})`, not nested.

---

### 1.10 Roller `CLAUDE.md` Update

In `packages/roller/CLAUDE.md`, update the "Modifier System" section's "To add a modifier" instructions to include:

> 4. Add a `docs: readonly NotationDoc[]` array to the `<mod>Schema` export — one entry per notation surface (e.g., drop has three: L, H, D{..}).

Also update the `NotationDoc` shape in the `/docs` subpath documentation section to remove `displayOptional` from the interface example.

---

## Phase 2: Generate Conformance JSON with gen:check

### Overview

Promote the 48 conformance vectors in `apps/rdn/public/conformance/v0.9.0.json` from a hand-authored JSON file to a generated artifact. Create a TypeScript source file (`apps/rdn/src/conformance/vectors.ts`) that defines the vectors as a typed array. Write a gen script that serializes the array to JSON with stable key ordering. Add `conformance:gen` and `conformance:check` scripts to `apps/rdn/package.json`. Wire `conformance:check` into lefthook pre-push at priority 2.

---

### 2.1 `ConformanceVector` Interface

Create `apps/rdn/src/conformance/types.ts`:

```typescript
/**
 * A single conformance test vector from the RANDSUM Dice Notation Specification.
 * Vectors are defined in vectors.ts and serialized to public/conformance/v<version>.json.
 *
 * Required fields are present on every vector.
 * Optional fields are present only when relevant to the vector's category.
 */
export interface ConformanceVector {
  /** Stable integer identifier. Must be unique across all vectors in a version. */
  readonly id: number
  /** The dice notation string under test. */
  readonly notation: string
  /**
   * Grouping category. Values in current v0.9.0 corpus:
   * 'dice_expressions' | 'stage1_modifiers' | 'stage2_modifiers' |
   * 'stage3_modifiers' | 'stage4_modifiers' | 'arithmetic_modifiers' |
   * 'error_cases'
   */
  readonly category: string
  /** Spec section reference (e.g. '4.1', '6.5.4'). */
  readonly section: string
  /** Minimum conformance level required to support this vector. */
  readonly conformanceLevel: number
  /**
   * The deterministic seed rolls injected into the roller for this vector.
   * Absent on error_cases vectors.
   */
  readonly seedRolls?: readonly number[]
  /** Expected dice pool after all modifiers. Absent on error_cases vectors. */
  readonly expectedPool?: readonly number[]
  /** Expected total after all arithmetic. Absent on error_cases vectors. */
  readonly expectedTotal?: number
  /**
   * Extra rolls consumed during reroll resolution.
   * Present only when the roller must draw additional values beyond seedRolls.
   */
  readonly rerollRolls?: readonly number[]
  /** Extra rolls consumed during explode resolution. */
  readonly explodeRolls?: readonly number[]
  /** Extra rolls consumed during compound-explode resolution. */
  readonly compoundRolls?: readonly number[]
  /** Extra rolls consumed during penetrate resolution. */
  readonly penetrateRolls?: readonly number[]
  /**
   * Extra rolls for explode-sequence resolution (sequence die rolls).
   * Only present on explodeSequence vectors.
   */
  readonly sequenceRolls?: readonly number[]
  /**
   * Expected error type string for error_cases vectors.
   * E.g. 'ValidationError', 'SchemaError'.
   */
  readonly expectedError?: string
  /** Human-readable explanation for the expectedError. */
  readonly errorDescription?: string
  /** Freeform note for unusual vector behavior. */
  readonly note?: string
}

/** Top-level shape of the conformance JSON file. */
export interface ConformanceFile {
  readonly specVersion: string
  readonly generatedFrom: string
  readonly conformanceLevels: {
    readonly level1_core: readonly number[]
    readonly level2_vtt: readonly number[]
    readonly level3_extended: readonly number[]
    readonly level4_full: readonly number[]
    readonly errorCases: readonly number[]
  }
  readonly vectors: readonly ConformanceVector[]
}
```

---

### 2.2 `vectors.ts` Source File

Create `apps/rdn/src/conformance/vectors.ts`. This file:

- Imports `ConformanceVector` and `ConformanceFile` from `'./types'`
- Exports a `const CONFORMANCE_FILE: ConformanceFile` that is the TypeScript representation of the current `v0.9.0.json`
- Transcribes all 48 vectors exactly — no values changed, no fields added or removed
- The `generatedFrom` field value changes to reflect the new source: `'apps/rdn/src/conformance/vectors.ts'`

**File structure:**

```typescript
import type { ConformanceFile } from './types'

export const CONFORMANCE_FILE: ConformanceFile = {
  specVersion: '0.9.0',
  generatedFrom: 'apps/rdn/src/conformance/vectors.ts',
  conformanceLevels: {
    level1_core: [1, 2, 3, 10, 11, 14, 15, 16, 19, 20, 26, 27],
    level2_vtt: [1, 2, 3, 7, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 25, 26, 27, 35, 40, 43, 45],
    level3_extended: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23,
      25, 26, 27, 31, 34, 35, 36, 37, 40, 41, 43, 44, 45
    ],
    level4_full: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23,
      25, 26, 27, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 43, 44, 45
    ],
    errorCases: [28, 29, 30, 46, 47, 48]
  },
  vectors: [
    // ... all 48 vectors transcribed exactly from v0.9.0.json ...
  ]
} as const
```

**Transcription rule:** Copy each vector object from `v0.9.0.json` into the TypeScript array, preserving all field values. Do not add, remove, or reorder fields within individual vector objects. Do not reorder vectors. The gen script will enforce stable key ordering during serialization — the TypeScript source does not need to manually order fields.

---

### 2.3 Gen Script

Create `apps/rdn/conformance-gen.ts` as a Bun script (not a Node script — use `Bun.write`):

```typescript
import { CONFORMANCE_FILE } from './src/conformance/vectors'

const STABLE_KEY_ORDER = [
  'id',
  'notation',
  'category',
  'seedRolls',
  'rerollRolls',
  'explodeRolls',
  'compoundRolls',
  'penetrateRolls',
  'sequenceRolls',
  'expectedPool',
  'expectedTotal',
  'section',
  'conformanceLevel',
  'expectedError',
  'errorDescription',
  'note'
] as const

function stableVector(v: object): object {
  return Object.fromEntries(
    STABLE_KEY_ORDER
      .filter(k => k in v)
      .map(k => [k, (v as Record<string, unknown>)[k]])
  )
}

const output = {
  specVersion: CONFORMANCE_FILE.specVersion,
  generatedFrom: CONFORMANCE_FILE.generatedFrom,
  conformanceLevels: CONFORMANCE_FILE.conformanceLevels,
  vectors: CONFORMANCE_FILE.vectors.map(stableVector)
}

const outPath = new URL('./public/conformance/v0.9.0.json', import.meta.url)
await Bun.write(outPath, JSON.stringify(output, null, 2) + '\n')
console.log(`Written: ${outPath.pathname}`)
```

**Stable key ordering rule:** The JSON output must serialize each vector's keys in the order defined by `STABLE_KEY_ORDER`. Keys absent from a vector are omitted (not written as `null`). This ensures the generated JSON is byte-for-byte reproducible across runs and machines.

**Top-level key order:** The four top-level keys must always appear in this order: `specVersion`, `generatedFrom`, `conformanceLevels`, `vectors`. This matches the current file.

**Trailing newline:** The output file must end with a single `\n`. `JSON.stringify(output, null, 2) + '\n'` produces this.

---

### 2.4 `package.json` Scripts

Add to `apps/rdn/package.json` scripts:

```json
{
  "scripts": {
    "conformance:gen": "bun conformance-gen.ts",
    "conformance:check": "bun conformance-gen.ts && git diff --exit-code public/conformance/v0.9.0.json"
  }
}
```

`conformance:check` regenerates the JSON and then uses `git diff --exit-code` to assert that the working tree copy of `v0.9.0.json` is byte-for-byte identical to the freshly generated output. A non-zero exit code means the file is out of sync with `vectors.ts`. This mirrors the pattern used by `bun run --filter @randsum/games gen:check`.

---

### 2.5 Lefthook Integration

Add a `conformance-check` command to the `pre-push` block in `lefthook.yml` at priority 2:

```yaml
pre-push:
  output:
    - summary
    - failure
  commands:
    build:
      run: bun run build > /dev/null 2>&1
      priority: 1
    codegen-check:
      run: bun run --filter @randsum/games gen:check > /dev/null 2>&1
      priority: 2
    conformance-check:
      run: bun run --filter @randsum/rdn conformance:check > /dev/null 2>&1
      priority: 2
    test:
      run: bun run test 2>&1 | tail -5
      priority: 2
    audit:
      run: bun audit --level=high > /dev/null 2>&1
      priority: 2
    knip:
      run: bun run knip > /dev/null 2>&1
      priority: 2
```

Priority 2 commands run in parallel after the priority 1 build completes. `conformance-check` runs alongside `codegen-check`, `test`, `audit`, and `knip`.

---

### 2.6 Workspace Dependency Constraint

`apps/rdn/package.json` currently has no workspace dependencies — only `astro` as a runtime dep. The `conformance-gen.ts` script imports only from `./src/conformance/vectors`, which is a local file within the app. No workspace package import is required for Phase 2. The `ConformanceVector` type does not depend on `@randsum/roller` types.

This constraint is preserved. The gen script has no imports outside the `apps/rdn/` directory.

---

### 2.7 Byte-for-Byte Identity Requirement

After implementing Phase 2, running `bun run conformance:gen` must produce a `v0.9.0.json` that is byte-for-byte identical to the file that existed before the migration. The developer must verify this before committing:

```bash
# Before starting: copy the original
cp apps/rdn/public/conformance/v0.9.0.json /tmp/conformance-original.json

# After implementing:
bun run --filter @randsum/rdn conformance:gen

# Verify identity
diff /tmp/conformance-original.json apps/rdn/public/conformance/v0.9.0.json
```

If `diff` reports no output, the migration is complete. Any difference indicates either a key ordering mismatch, a value transcription error, or a missing/extra field. The developer must resolve all differences before merging.

**Known identity risk: `generatedFrom` field.** The current JSON file has `"generatedFrom": "Appendix G of the RANDSUM Dice Notation Specification v0.9.0"`. The TypeScript source sets `generatedFrom: 'apps/rdn/src/conformance/vectors.ts'`. These values differ. The `conformance:check` gate in CI will fail until the committed `v0.9.0.json` is regenerated from the new source. The dev must run `conformance:gen` once and commit both the updated JSON and the new TypeScript source together. The `git diff --exit-code` check in `conformance:check` will then pass.

---

### 2.8 File Summary

**New files:**
- `apps/rdn/src/conformance/types.ts` — `ConformanceVector` and `ConformanceFile` interfaces
- `apps/rdn/src/conformance/vectors.ts` — `CONFORMANCE_FILE` typed constant (48 vectors)
- `apps/rdn/conformance-gen.ts` — Bun script: serializes `CONFORMANCE_FILE` to `public/conformance/v0.9.0.json`

**Modified files:**
- `apps/rdn/package.json` — add `conformance:gen` and `conformance:check` scripts
- `lefthook.yml` — add `conformance-check` command at priority 2

**Generated output (committed):**
- `apps/rdn/public/conformance/v0.9.0.json` — regenerated from TypeScript source; `generatedFrom` value updated

---

## Acceptance Criteria Checklist

### Phase 1

- [ ] `NotationDoc` interface no longer has `displayOptional` field
- [ ] `NotationSchema` has `docs?: readonly NotationDoc[]` field
- [ ] All 19 modifier files in `src/modifiers/` export `*Schema` with a populated `docs` array
- [ ] `drop.ts` `docs` has exactly 3 entries: keys `'L'`, `'H'`, `'D{..}'`
- [ ] `keep.ts` `docs` has exactly 3 entries: keys `'K'`, `'KL'`, `'KM'`
- [ ] `reroll.ts` `docs` has exactly 2 entries: keys `'R{..}'`, `'ro{..}'`
- [ ] `count.ts` `docs` has exactly 4 entries: keys `'#{..}'`, `'S{..}'`, `'F{..}'`, `'ms{..}'`
- [ ] All remaining 15 modifiers have exactly 1 entry each in `docs`
- [ ] `modifierDocEntries.ts` is deleted
- [ ] `modifierDocs.ts` derives `modifierEntries` via `RANDSUM_MODIFIERS.flatMap(mod => mod.docs ?? [])`
- [ ] `NOTATION_DOCS`, `MODIFIER_DOCS`, `DICE_DOCS` contents identical to pre-migration (same keys, same values)
- [ ] `modifierDocSync.test.ts` uses structural bidirectional assertions (no direct import of deleted file)
- [ ] `modifierDocSync.test.ts` asserts every modifier has non-empty `docs`
- [ ] `modifierDocSync.test.ts` asserts every `MODIFIER_DOCS` key has an owning modifier
- [ ] `modifierDocSync.test.ts` count tripwire asserts `Object.keys(MODIFIER_DOCS).length === 28`
- [ ] `rosettaStone.test.ts` continues passing without modification
- [ ] `bun run --filter @randsum/roller size` passes (`dist/tokenize.js` size unchanged)
- [ ] `bun run knip` passes (no dangling imports referencing deleted file)
- [ ] Roller `CLAUDE.md` updated: co-location pattern documented, `displayOptional` removed from interface example

### Phase 2

- [ ] `apps/rdn/src/conformance/types.ts` exists with `ConformanceVector` and `ConformanceFile` interfaces
- [ ] `apps/rdn/src/conformance/vectors.ts` exports `CONFORMANCE_FILE: ConformanceFile` with 48 vectors
- [ ] `apps/rdn/conformance-gen.ts` serializes with stable key ordering and trailing newline
- [ ] `apps/rdn/package.json` has `conformance:gen` and `conformance:check` scripts
- [ ] `lefthook.yml` has `conformance-check` at priority 2
- [ ] Running `bun run --filter @randsum/rdn conformance:gen` produces a valid JSON file
- [ ] Running `bun run --filter @randsum/rdn conformance:check` exits 0 on a clean tree
- [ ] No workspace package imports in `apps/rdn/conformance-gen.ts`
