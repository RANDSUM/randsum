# Notation Bug Fix + Typed Template Literals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the case-sensitivity bug in `isDiceNotation` for `!P` and `KL`, then implement strict TypeScript template literal types that validate dice notation at compile time.

**Architecture:** Bug fix is a one-line change in `buildNotationPattern()`. Template literals use a tiered union of modifier patterns — precise for 1-2 modifiers, catch-all for 3+. No branding; flat strings continue to work.

**Tech Stack:** TypeScript template literal types, `bun:test` for type-level tests

**Spec:** `docs/superpowers/specs/2026-03-23-typed-notation-template-literals-design.md`

---

## File Map

| File | Change |
|------|--------|
| `packages/roller/src/notation/parse/parseModifiers.ts` | Fix: add `'gi'` flag to `buildNotationPattern()` |
| `packages/roller/__tests__/notation/isDiceNotation.comprehensive.test.ts` | Fix: update `!P` test from known-bug to passing |
| `packages/roller/src/notation/templateLiterals.ts` | NEW: all modifier type definitions + `ValidModifierSuffix` |
| `packages/roller/src/notation/types.ts` | MODIFY: `DiceNotation` uses strict template literal union |
| `packages/roller/src/types/core.ts` | MODIFY: `PercentileDie` adds `Nd%` variants |
| `packages/roller/__tests__/types/notation.test-d.ts` | NEW: type-level tests with `@ts-expect-error` |

---

## Task 1: Fix case-insensitive flag loss in buildNotationPattern

**Files:**
- Modify: `packages/roller/src/notation/parse/parseModifiers.ts:133`
- Modify: `packages/roller/__tests__/notation/isDiceNotation.comprehensive.test.ts`

- [ ] **Step 1: Verify the bug exists**

Run: `cd packages/roller && bun -e "import { isDiceNotation } from './src/validate'; console.log('1d6!P:', isDiceNotation('1d6!P')); console.log('4d6KL:', isDiceNotation('4d6KL'))"`
Expected: Both return `false` (the bug)

- [ ] **Step 2: Fix `buildNotationPattern`**

In `packages/roller/src/notation/parse/parseModifiers.ts` line 133, change:

```typescript
return new RegExp(sources.join('|'), 'g')
```

to:

```typescript
return new RegExp(sources.join('|'), 'gi')
```

This adds the case-insensitive flag to the combined pattern, matching what the individual schema patterns expect.

- [ ] **Step 3: Update the comprehensive test**

In `packages/roller/__tests__/notation/isDiceNotation.comprehensive.test.ts`, find the `!P` test that documents the known bug and change it to expect `true`:

Find the test that says something like `isDiceNotation('1d6!P')` and update its expected value from `false` (known bug) to `true`.

- [ ] **Step 4: Verify fix**

Run: `bun test packages/roller/`
Expected: All 2229 tests pass, including the previously-failing `!P` case

- [ ] **Step 5: Commit**

```bash
git add packages/roller/src/notation/parse/parseModifiers.ts packages/roller/__tests__/notation/isDiceNotation.comprehensive.test.ts
git commit -m "fix(roller): restore case-insensitive flag in buildNotationPattern (!P, KL)"
```

---

## Task 2: Define modifier template literal types

**Files:**
- Create: `packages/roller/src/notation/templateLiterals.ts`

- [ ] **Step 1: Create the modifier type definitions**

Create `packages/roller/src/notation/templateLiterals.ts` with all modifier pattern types.

Each modifier type is a template literal union matching the valid notation patterns for that modifier:

```typescript
// Drop modifiers: L, L2, H, H3, D{...}
type DropMod =
  | 'L' | 'l' | 'H' | 'h'
  | `${'L' | 'l'}${number}`
  | `${'H' | 'h'}${number}`
  | `${'D' | 'd'}{${string}}`

// Keep modifiers: K, K2, KL, KL2, KM, KM2
type KeepMod =
  | 'K' | 'k'
  | `${'K' | 'k'}${number}`
  | 'KL' | 'Kl' | 'kL' | 'kl'
  | `${'K' | 'k'}${'L' | 'l'}${number}`
  | 'KM' | 'Km' | 'kM' | 'km'
  | `${'K' | 'k'}${'M' | 'm'}${number}`

// Explode family: !, !!, !p, !P, !i, !r, !s{...}, !{...}
type ExplodeMod =
  | '!' | '!!'
  | `!${number}` | `!!${number}`
  | '!p' | '!P' | '!i' | '!I' | '!r' | '!R'
  | `!{${string}}` | `!!{${string}}`
  | `!${'p' | 'P'}{${string}}`
  | `!${'s' | 'S'}{${string}}`

// Reroll: R{...}, ro{...}
type RerollMod =
  | `${'R' | 'r'}{${string}}`
  | `${'R' | 'r'}{${string}}${number}`
  | `${'R' | 'r'}${'o' | 'O'}{${string}}`

// Cap: C{...}
type CapMod = `${'C' | 'c'}{${string}}`

// Replace/Map: V{...}
type ReplaceMod = `${'V' | 'v'}{${string}}`

// Unique: U, U{...}
type UniqueMod = 'U' | 'u' | `${'U' | 'u'}{${string}}`

// Count: #{...}, S{...}, F{...}
type CountMod =
  | `#{${string}}`
  | `${'S' | 's'}{${string}}`
  | `${'F' | 'f'}{${string}}`

// Arithmetic: +N, -N, *N, **N, //N, %N, ms{N}
type ArithMod =
  | `+${number}` | `-${number}`
  | `*${number}` | `**${number}`
  | `//${number}` | `%${number}`
  | `${'m' | 'M'}${'s' | 'S'}{${number}}`

// Sort
type SortMod =
  | 'sa' | 'SA' | 'Sa' | 'sA'
  | 'sd' | 'SD' | 'Sd' | 'sD'

// Wild die
type WildMod = 'W' | 'w'

// Repeat (end-of-notation only)
type RepeatMod = `${'x' | 'X'}${number}`

// Label
type LabelMod = `[${string}]`

// The union of all single modifiers
type AnyMod = DropMod | KeepMod | ExplodeMod | RerollMod | CapMod | ReplaceMod
  | UniqueMod | CountMod | ArithMod | SortMod | WildMod | RepeatMod | LabelMod

// Tiered modifier suffixes:
// Tier 1: exactly one modifier
// Tier 2: exactly two modifiers (common: 4d6L+5, 1d6!R{<2})
// Tier 3: three or more (catch-all with trailing string)
type ModifierSuffix =
  | ''
  | AnyMod
  | `${AnyMod}${AnyMod}`
  | `${AnyMod}${AnyMod}${string}`

export type { AnyMod, ModifierSuffix }
```

- [ ] **Step 2: Verify the file compiles**

Run: `bun run --filter @randsum/roller typecheck`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add packages/roller/src/notation/templateLiterals.ts
git commit -m "feat(roller): define modifier template literal types for notation validation"
```

---

## Task 3: Update DiceNotation to use strict template literals

**Files:**
- Modify: `packages/roller/src/notation/types.ts`
- Modify: `packages/roller/src/types/core.ts`

- [ ] **Step 1: Update DiceNotation in types.ts**

Change `packages/roller/src/notation/types.ts` line 127 from:

```typescript
export type DiceNotation = `${number}${'d' | 'D'}${number}${string}`
```

to:

```typescript
import type { ModifierSuffix } from './templateLiterals'

export type DiceNotation =
  | `${number}${'d' | 'D'}${number}${ModifierSuffix}`
```

This is the core change. Now `'4d6L'` matches (via `DropMod` in `ModifierSuffix`) but `'4d6GARBAGE'` doesn't.

- [ ] **Step 2: Update PercentileDie to include quantity prefix**

In `packages/roller/src/types/core.ts`, update:

```typescript
export type PercentileDie = 'd%' | 'D%' | `${number}${'d' | 'D'}%`
```

- [ ] **Step 3: Run typecheck**

Run: `bun run --filter @randsum/roller typecheck`

If there are errors: some `as DiceNotation` casts in the codebase may now fail because the target strings don't match the stricter type. Fix each one — they're likely notation strings generated at runtime that need the cast, or they're genuinely invalid and should be fixed.

- [ ] **Step 4: Run full test suite**

Run: `bun test packages/roller/`
Expected: All 2229 tests pass (no runtime behavior change)

- [ ] **Step 5: Check downstream packages**

Run: `bun run typecheck` (full monorepo)
Expected: Games, Expo, dice-ui all pass. If any fail, it's because they use `as DiceNotation` casts on strings the stricter type rejects — update those casts.

- [ ] **Step 6: Commit**

```bash
git add packages/roller/src/notation/types.ts packages/roller/src/types/core.ts
git commit -m "feat(roller): strict DiceNotation template literal type"
```

---

## Task 4: Write type-level tests

**Files:**
- Create: `packages/roller/__tests__/types/notation.test-d.ts`

- [ ] **Step 1: Create type-level test file**

Create `packages/roller/__tests__/types/notation.test-d.ts`:

```typescript
// Type-level tests for DiceNotation template literal validation.
// Uses @ts-expect-error to assert invalid notations are rejected.
// Run with: bun run --filter @randsum/roller typecheck

import type { DiceNotation } from '../../src/notation/types'

// ===== VALID — these must NOT error =====

// Core
const _basic: DiceNotation = '4d6'
const _single: DiceNotation = '1d20'
const _upper: DiceNotation = '4D6'

// Drop/Keep
const _dropL: DiceNotation = '4d6L'
const _dropH: DiceNotation = '4d6H2'
const _keep: DiceNotation = '4d6K'
const _keepL: DiceNotation = '4d6KL2'
const _keepM: DiceNotation = '4d6KM'
const _dropCond: DiceNotation = '4d6D{>5}'

// Explode
const _explode: DiceNotation = '1d6!'
const _compound: DiceNotation = '1d6!!'
const _penetrate: DiceNotation = '1d6!p'
const _explodeCond: DiceNotation = '1d6!{>5}'

// Reroll
const _reroll: DiceNotation = '1d6R{<3}'
const _rerollOnce: DiceNotation = '1d6ro{1,2}'

// Cap, Replace, Unique
const _cap: DiceNotation = '1d20C{<1,>6}'
const _replace: DiceNotation = '1d6V{=1:6}'
const _unique: DiceNotation = '4d6U'

// Arithmetic
const _plus: DiceNotation = '1d20+5'
const _minus: DiceNotation = '1d20-3'
const _mult: DiceNotation = '4d6*2'
const _div: DiceNotation = '4d6//2'

// Sort, Wild, Repeat, Label
const _sort: DiceNotation = '4d6sa'
const _wild: DiceNotation = '5d6W'
const _repeat: DiceNotation = '4d6Lx6'
const _label: DiceNotation = '1d20+5[fire]'

// Count
const _count: DiceNotation = '4d6#{>=3}'
const _success: DiceNotation = '4d6S{3}'
const _failure: DiceNotation = '4d6F{1}'

// Combined (2 modifiers)
const _combo: DiceNotation = '4d6L+5'
const _combo2: DiceNotation = '4d6!R{<2}'

// Multi-pool (looks like NdS+NdS which matches NdS with ArithMod tail)
const _multi: DiceNotation = '1d20+1d6'

// ===== INVALID — these MUST error =====

// @ts-expect-error — not dice notation
const _garbage: DiceNotation = 'not-dice'

// @ts-expect-error — invalid modifier
const _badMod: DiceNotation = '4d6X'

// @ts-expect-error — empty string
const _empty: DiceNotation = ''

// @ts-expect-error — bare number string
const _num: DiceNotation = '42'

// @ts-expect-error — no sides
const _noSides: DiceNotation = '4d'
```

- [ ] **Step 2: Run typecheck to verify tests**

Run: `bun run --filter @randsum/roller typecheck`

Expected: 0 errors. The `@ts-expect-error` lines suppress expected type errors on invalid notations. If a valid notation FAILS typecheck, the template literal is too strict. If an invalid notation PASSES typecheck, a `@ts-expect-error` line will itself error ("Unused '@ts-expect-error' directive").

- [ ] **Step 3: Iterate on modifier types if needed**

If valid notations are rejected by the template literal, widen the relevant modifier type in `templateLiterals.ts`. If invalid notations are accepted, tighten it.

- [ ] **Step 4: Commit**

```bash
git add packages/roller/__tests__/types/notation.test-d.ts
git commit -m "test(roller): type-level tests for DiceNotation template literal validation"
```

---

## Task 5: Final verification

- [ ] **Step 1: Full monorepo typecheck**

Run: `bun run typecheck`
Expected: 0 errors across all packages

- [ ] **Step 2: Full test suite**

Run: `bun run test`
Expected: All tests pass (roller, games, expo)

- [ ] **Step 3: Verify DX**

Open any file that uses `roll()` and type an invalid notation — verify the editor shows a type error. Type a valid notation — verify it compiles.

- [ ] **Step 4: Push**

```bash
git push origin scram/expo-spike
```
