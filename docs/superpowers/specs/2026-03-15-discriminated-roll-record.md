---
title: "Discriminated RollRecord Union"
status: draft
created: 2026-03-15
---

## Goal

Refactor `RollRecord<T>` from a single interface with an optional `customResults` field into a discriminated union keyed on `kind: 'numeric' | 'custom'`. This ensures TypeScript enforces that consumers cannot access numeric fields (`total`, `rolls`, `appliedTotal`) on custom-face dice results, and vice versa. It also enables validation-time rejection of modifiers on string-face dice, since modifiers like drop, keep, reroll, and explode operate on numeric values and are meaningless for faces like `"fire"` or `"Salvage"`.

## Design

### Discriminated Union

```typescript
// Shared base — fields common to every roll record
interface RollRecordBase<T = string> {
  kind: 'numeric' | 'custom'
  argument: RollParams<T>['argument']
  notation: RollParams<T>['notation']
  description: RollParams<T>['description']
  parameters: RollParams<T>
  initialRolls: number[]
  modifierLogs: NumericRollBonus['logs']
  label?: string
}

// Standard numeric dice (d20, dF, zN, d{2,3,5,7}, etc.)
interface NumericRollRecord<T = string> extends RollRecordBase<T> {
  kind: 'numeric'
  rolls: number[]
  total: number
  appliedTotal: number
}

// Custom face dice (d{fire,ice,lightning}, d{hit,miss})
interface CustomFaceRollRecord<T = string> extends RollRecordBase<T> {
  kind: 'custom'
  results: T[]  // the actual face values
}

type RollRecord<T = string> = NumericRollRecord<T> | CustomFaceRollRecord<T>
```

### Rationale

- **`kind` discriminant** follows the project convention of using `kind` for discriminated unions (see `CollectedResults` in the games codegen IR).
- **`NumericRollRecord` keeps all existing numeric fields** (`rolls`, `total`, `appliedTotal`) so downstream consumers of numeric dice need minimal changes — they just narrow on `kind: 'numeric'`.
- **`CustomFaceRollRecord` replaces `customResults`** with `results` — a cleaner name now that the variant is self-describing. The `results` array contains the actual face values (e.g., `["fire", "ice"]`), not numeric indices.
- **`initialRolls` remains `number[]` on both variants** because the engine always generates numeric indices internally. The difference is whether those indices are exposed as-is (numeric) or mapped to face values (custom). This preserves the ability to inspect raw rolls for debugging.
- **`modifierLogs` remains on both variants** but will always be empty `[]` for custom-face dice, since modifiers are rejected at validation time. Keeping it on the base avoids a third variant and lets generic code iterate logs without narrowing.

### `RollerRollResult` Changes

```typescript
export interface RollerRollResult<T = string> extends RollResult<T[], RollRecord<T>> {
  /** Combined total of all rolls. Undefined when any roll uses custom faces. */
  total?: number
}
```

When all records are `NumericRollRecord`, `total` is the sum of `appliedTotal` values. When any record is `CustomFaceRollRecord`, `total` is `undefined` — there is no meaningful numeric aggregate. Consumers who need the total must narrow first.

## Validation Rules

1. **String-face dice must have empty modifiers.** If `RollParams.faces` is present (non-undefined), the `modifiers` object must be empty (all fields undefined). If any modifier is specified, throw a `ValidationError` with a clear message: `"Modifiers cannot be applied to custom-face dice (d{...}). Remove modifiers or use numeric sides."`

2. **Validation happens in `parseArguments`**, before the pipeline runs. This is consistent with existing validation (e.g., invalid notation, zero sides) that throws `ValidationError` early.

3. **Mixed rolls (numeric + custom in one `roll()` call):** Each argument produces its own `RollRecord` variant independently. `RollerRollResult.total` becomes `undefined` when any record is `CustomFaceRollRecord`, because summing numeric totals with custom-face results is nonsensical.

4. **Notation validation:** `validateNotation()` should reject modifier suffixes on custom-face notation. `d{fire,ice}L` is invalid — drop-lowest is meaningless for string faces.

## Migration Steps

### Step 1: Update `RollRecord` type

**File:** `packages/roller/src/types/results.ts`

- Extract `RollRecordBase<T>` with shared fields and `kind` discriminant
- Define `NumericRollRecord<T>` with `kind: 'numeric'`, `rolls`, `total`, `appliedTotal`
- Define `CustomFaceRollRecord<T>` with `kind: 'custom'`, `results`
- Redefine `RollRecord<T>` as the union type
- Export all three types (base is useful for generic constraints)
- Update `RollerRollResult.total` to `total?: number`

### Step 2: Update pipeline `build()` to return correct variant

**File:** `packages/roller/src/roll/pipeline.ts`

- In `RollPipeline.build()`, check `this.params.faces`:
  - If `faces` is present: return `CustomFaceRollRecord` with `kind: 'custom'` and `results: initialRolls.map(i => faces[i - 1])`
  - If `faces` is absent: return `NumericRollRecord` with `kind: 'numeric'` and existing `rolls`, `total`, `appliedTotal`
- The return type remains `RollRecord<T>` (the union) — callers narrow via `kind`

### Step 3: Add validation — reject modifiers on string-face dice

**File:** `packages/roller/src/roll/parseArguments.ts`

- After resolving `RollParams`, check: if `params.faces !== undefined` and any modifier key is set, throw `ValidationError`
- Also update `validateNotation()` to reject modifier suffixes on `d{...}` patterns

### Step 4: Update `RollerRollResult.total`

**File:** `packages/roller/src/roll/index.ts`

- In the function that assembles `RollerRollResult`, compute `total` only when all records have `kind: 'numeric'`
- If any record has `kind: 'custom'`, set `total` to `undefined`
- Update the `values` mapping to handle both variants (numeric: die value, custom: face value)

### Step 5: Update `display-utils`

**File:** `packages/display-utils/src/`

- Add `kind` narrowing before accessing `rolls`, `total`, `customResults`
- Replace all references to `customResults` with narrowed `results` access
- Handle display of custom-face results (show face values, not numeric totals)

### Step 6: Update `cli`

**File:** `apps/cli/src/`

- Add `kind` narrowing in roll result display
- Custom-face results show face values instead of numeric totals

### Step 7: Update `component-library`

**File:** `packages/component-library/src/`

- Add `kind` narrowing in React components that display roll results
- Render custom-face results as face value badges/chips instead of numbers

### Step 8: Update `games`

**File:** `packages/games/src/`

- All current game packages use numeric dice exclusively
- Add explicit narrowing to `NumericRollRecord` in generated code (type safety for game consumers)
- Codegen template should assert `kind: 'numeric'` when building `GameRollResult`

### Step 9: Update tests

**Files:** `packages/roller/__tests__/`, `packages/display-utils/__tests__/`, etc.

- Existing custom-face tests: assert `kind: 'custom'` on results, access `results` instead of `customResults`
- Existing numeric tests: assert `kind: 'numeric'` on results (optional but good for documentation)
- Add new tests:
  - `ValidationError` thrown when modifiers used with custom-face dice
  - `RollerRollResult.total` is `undefined` when custom-face dice are present
  - Mixed rolls (numeric + custom) produce correct variant per record
  - Notation validation rejects `d{fire,ice}L`

### Step 10: Update documentation

**Files:** `CLAUDE.md`, `packages/roller/CLAUDE.md`, `packages/roller/RANDSUM_DICE_NOTATION.md`, site docs

- Document the discriminated union pattern
- Update type examples to show `kind` narrowing
- Note that `customResults` no longer exists — replaced by `CustomFaceRollRecord.results`

## Breaking Changes

| Change | Migration |
|--------|-----------|
| `RollRecord.customResults` removed | Check `record.kind === 'custom'` then access `record.results` |
| `RollRecord.total` / `RollRecord.rolls` / `RollRecord.appliedTotal` removed from union | Check `record.kind === 'numeric'` before accessing |
| `RollerRollResult.total` becomes `total?: number` | Check for `undefined` before using total |
| Modifiers on custom-face dice throw `ValidationError` | Remove modifiers from custom-face notation/options |
| Notation `d{face,...}` rejects modifier suffixes | Separate custom-face dice from modifier notation |

These are all compile-time breaking changes — TypeScript will catch every callsite that needs updating. No silent runtime behavior changes.

## Future: Custom Face Dice in Game Packages

The discriminated union unlocks custom-face dice for game packages. See the companion issue for design considerations around expressing custom faces in `.randsum.json` specs and codegen impact. Key open questions:

- Schema representation: face arrays vs. weighted maps
- Codegen: generating `roll("d{...}")` notation from specs
- `GameRollResult` handling of `CustomFaceRollRecord`
- Games like Salvage Union that currently use numeric dice + `lookupByRange` could migrate to custom faces

This is a separate body of work that depends on this discriminated union being in place.

## Estimated Impact

### Core type changes
- `packages/roller/src/types/results.ts` — union type definition

### Pipeline
- `packages/roller/src/roll/pipeline.ts` — `build()` returns correct variant
- `packages/roller/src/roll/index.ts` — `total` becomes optional

### Validation
- `packages/roller/src/roll/parseArguments.ts` — reject modifiers on custom faces
- `packages/roller/src/lib/notation/` — reject modifier suffixes on `d{...}` notation

### Consumers (need `kind` narrowing)
- `packages/display-utils/src/` — display logic
- `apps/cli/src/` — CLI output
- `packages/component-library/src/` — React components
- `packages/games/src/` — generated game code (all numeric, narrow explicitly)

### Tests (~10 files)
- `packages/roller/__tests__/roll/` — custom face and mixed roll tests
- `packages/roller/__tests__/validation/` — new modifier rejection tests
- `packages/display-utils/__tests__/` — display with custom faces
- Game package tests — type narrowing assertions

### Documentation
- `CLAUDE.md` (root and per-package)
- `RANDSUM_DICE_NOTATION.md`
- Site docs (Astro)
- Skills / LLM context files
