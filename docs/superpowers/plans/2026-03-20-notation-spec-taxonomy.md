# RANDSUM Dice Notation Spec & Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the formal RANDSUM_DICE_NOTATION_SPEC.md document at repo root with faceted classification, update the notation doc to reference it, implement Conditional Explode, and update all internal references.

**Architecture:** Three workstreams: (1) Write the spec document as the canonical taxonomy reference, (2) implement Conditional Explode in the roller engine, (3) update all internal docs to reference the spec as source of truth. The spec is a NEW file at repo root; the existing RANDSUM_DICE_NOTATION.md in packages/roller/ remains as the notation syntax guide but references the spec for classification.

**Tech Stack:** Markdown (spec), TypeScript (Conditional Explode), bun:test (tests)

---

## File Map

### New Files
- `RANDSUM_DICE_NOTATION_SPEC.md` -- the formal spec (repo root, prominent location)
- `packages/roller/src/modifiers/shared/conditionMatch.ts` -- shared condition-matching for explosion family
- `packages/roller/__tests__/lib/modifiers/conditionMatch.test.ts` -- tests for shared condition matcher
- `packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts` -- tests for conditional explode
- `packages/roller/__tests__/lib/modifiers/conditionalCompound.test.ts` -- tests for conditional compound
- `packages/roller/__tests__/lib/modifiers/conditionalPenetrate.test.ts` -- tests for conditional penetrate

### Modified Files
- `packages/roller/src/modifiers/explode.ts` -- extend to accept condition expression
- `packages/roller/src/modifiers/compound.ts` -- extend to accept condition expression
- `packages/roller/src/modifiers/penetrate.ts` -- extend to accept condition expression
- `packages/roller/src/modifiers/shared/explosion.ts` -- accept condition predicate in explosion strategies
- `packages/roller/src/modifiers/schema.ts` -- add ExplodeOptions type to ModifierOptionTypes
- `packages/roller/src/notation/types.ts` -- add ExplodeOptions type, update ModifierOptions.explode
- `packages/roller/RANDSUM_DICE_NOTATION.md` -- add Conditional Explode syntax, add spec reference
- `CLAUDE.md` -- update notation reference to mention spec
- `CONTRIBUTING.md` -- update doc references
- `README.md` -- update doc references
- `packages/roller/CLAUDE.md` -- update notation reference
- `packages/roller/README.md` -- update notation reference
- `packages/games/CLAUDE.md` -- update notation reference

---

## Task 1: Write the Formal Spec Document

**Files:**
- Create: `RANDSUM_DICE_NOTATION_SPEC.md` (repo root)

This is the largest task -- the full spec document based on the approved design. It contains all sections from the approved table of contents.

- [ ] **Step 1: Write the spec document**

Create `RANDSUM_DICE_NOTATION_SPEC.md` at the repo root. The document must contain ALL of the following sections, in this order. Each section is described below with its content requirements.

**Section 1: Introduction**
- Purpose: formal specification for the Randsum Dice Notation (RDN)
- Scope: dice types, modifiers, execution pipeline, notation syntax
- RFC 2119 conventions (MUST/SHALL/MAY/SHOULD)
- Version: 1.0

**Section 2: Glossary**
Formal definitions for these normative terms:
- Die expression, Roll, Pool, Total, Modifier, Primitive, Alias, Macro, Stage, Verb, Channel, Priority, Condition Expression, Die type, Condition, Presentation Directive, Parser Directive, Notation Metadata

**Section 3: Classification System**
- 3.1 Faceted Classification Overview -- explain the four facets and why
- 3.2 Derivation Status -- Primitive/Alias/Macro definitions, tests for each, closed set
- 3.3 Pipeline Stage -- three stages with contracts, priority ranges, boundary signals
  - Stage 1 Deterministic Shaping: priority 10-39, requiresRollFn=false
  - Stage 2 Stochastic Dynamics: priority 40-69, requiresRollFn=true
  - Stage 3 Total Derivation: priority 80-127, mutatesRolls=false
- 3.4 Operational Verb -- 8 verbs table: Clamp, Map, Filter, Substitute, Generate, Accumulate, Scale, Reinterpret
- 3.5 Output Channel -- Pool/Total, derived from Stage
- 3.6 Facet Interaction Constraints -- the three constraints (Channel from Stage, Macros have no Verb, Aliases inherit)
- 3.7 Valid Facet Combinations table

**Section 4: Dice Expressions**
- 4.1 Standard Dice (NdS) -- primitive, uniform, numeric range
- 4.2 Custom Faces (d{...}) -- primitive, uniform, explicit faces
- 4.3 Geometric Dice (gN) -- primitive, open-ended
- 4.4 Draw Dice (DDN) -- primitive, sampling without replacement
- 4.5 Dice Aliases:
  - 4.5.1 Percentile (d%) -> Standard 1d100
  - 4.5.2 Fate/Fudge (dF) -> Standard + Replace
  - 4.5.3 Zero-Bias (zN) -> Custom Faces d{0..N-1}
- Dice type classification table with Generation Model and Face Type axes

**Section 5: Condition Expressions**
- 5.1 Operator Syntax -- >, <, >=, <=, =, bare integer; ABNF grammar
- 5.2 Condition Lists -- comma separation
- 5.3 Modifier-Specific Semantics -- bare integer ambiguity table (Cap = max cap, others = exact match)

**Section 6: Execution Pipeline (normative)**
- 6.1 Three-Stage Model
- 6.2 Two-Channel Architecture (Pool vs Total, mutual exclusion invariant)
- 6.3 Priority Ordering (normative, exact values)
- 6.4 Stage 1 -- Deterministic Pool Shaping
  - 6.4.1 Contract
  - 6.4.2 Cap [Clamp] -- full faceted record, notation, semantics
  - 6.4.3 Drop [Filter] -- full faceted record
  - 6.4.4 Replace [Map] -- full faceted record
- 6.5 Stage 2 -- Stochastic Pool Dynamics
  - 6.5.1 Contract
  - 6.5.2 Reroll [Substitute]
  - 6.5.3 Unique [Substitute]
  - 6.5.4 Explode [Generate] -- including Conditional Explode (!{condition})
  - 6.5.5 Explode Sequence [Generate]
  - 6.5.6 Compound [Accumulate] -- including Conditional (!!{condition})
  - 6.5.7 Penetrate [Accumulate] -- including Conditional (!p{condition})
  - 6.5.8 Wild Die [Macro -> Dispatch]
- 6.6 Stage 3 -- Total Derivation
  - 6.6.1 Contract
  - 6.6.2 Count [Reinterpret] -- priority 80, note about interaction with Scale
  - 6.6.3 Multiply [Scale] -- priority 85
  - 6.6.4 Plus [Scale] -- priority 90
  - 6.6.5 Integer Divide [Scale] -- priority 93
  - 6.6.6 Modulo [Scale] -- priority 94
- 6.7 Modifier Aliases (normative desugaring rules)
  - 6.7.1 Keep -> Drop (inverse)
  - 6.7.2 Keep Middle -> Drop + Drop
  - 6.7.3 Reroll Once -> Reroll (max=1)
  - 6.7.4 Minus -> Plus (negated)
  - 6.7.5 Margin of Success -> Minus -> Plus (transitive)
  - 6.7.6 Multiply Total -> Multiply (post-arithmetic priority 100)
  - 6.7.7 Count Successes -> Count (>=)
  - 6.7.8 Count Failures -> Count (<=)
  - 6.7.9 Inflation -> Explode Sequence (ascending)
  - 6.7.10 Reduction -> Explode Sequence (descending)
- 6.8 Non-Modifier Notation Features
  - 6.8.1 Sort -- Presentation Directive, priority 92, display-only
  - 6.8.2 Annotations -- Notation Metadata, no priority
  - 6.8.3 Repeat -- Parser Directive, pre-pipeline expansion
- 6.9 Modifier Composition Rules
  - Count + Scale interaction (Count at 80 runs first, Scale operates on count)
  - Explosion + Filter interaction
  - Cap + Drop ordering rationale

**Section 7: Operational Groups (informative)**
Player-facing view of the same modifiers:
- 7.1 Value Transformers (Cap, Replace)
- 7.2 Pool Shapers (Drop, Keep, Keep Middle, Reroll, Reroll Once, Unique)
- 7.3 Explosion Variants (Explode, Compound, Penetrate, Explode Sequence, Inflation, Reduction, Wild Die)
- 7.4 Arithmetic (Plus, Minus, Margin of Success, Multiply, Multiply Total, Integer Divide, Modulo)
- 7.5 Counting (Count, Count Successes, Count Failures)
- 7.6 Display (Sort)

**Section 8: Notation Syntax**
- 8.1 Character Set and Case Insensitivity
- 8.2 Base Syntax (NdS)
- 8.3 Modifier Suffix Chaining
- 8.4 Annotations ([text])
- 8.5 Multi-Roll Expressions
- 8.6 Repeat Operator (xN)

**Section 9: Safety and Limits**
- 9.1 Iteration Caps (explosion depth, geometric cap 1000, reroll max)
- 9.2 Pool Size Limits
- 9.3 Error Conditions

**Section 10: Conformance Levels**
- 10.1 Level 1 -- Core Dice (NdS, d%, +N, -N)
- 10.2 Level 2 -- Pool Operations (+ Cap, Drop, Keep, Replace, Reroll, Reroll Once, Multiply, Multiply Total, Sort, Repeat, Condition Expression)
- 10.3 Level 3 -- Advanced Mechanics (+ Custom Faces, Fate, Zero-Bias, Explode, Conditional Explode, Compound, Penetrate, Count, Count Successes/Failures, Unique, Integer Divide, Modulo, Margin of Success)
- 10.4 Level 4 -- Full Specification (+ Geometric, Draw, Explode Sequence, Inflation, Reduction, Wild Die)
- 10.5 Partial Conformance Claims

**Appendix A: Priority Table**
Full table of all modifiers by priority number.

**Appendix B: Alias Desugaring Table**
Every alias with its desugaring rule and terminal primitive.

**Appendix C: Full Faceted Records**
Every modifier and dice type with all facet values in the box format from the brainstorming session.

**Appendix D: Four-Gate Test for Extensions**
Mechanical, Game-Agnostic Describable, Precedented, Composable.

Each modifier entry in sections 6.4-6.6 MUST include:
- Faceted record header: `Status | Stage | Verb | Channel | Priority`
- Notation syntax table
- Options type name
- Effect description
- Pool size impact
- Cross-references to aliases and operational group

- [ ] **Step 2: Verify spec accuracy against code**

Cross-check every priority number, option type, and pattern against the actual modifier source files in `packages/roller/src/modifiers/`. The priorities from the code are:
```
cap: 10, drop: 20, keep: 21, replace: 30, reroll: 40,
explode: 50, compound: 51, penetrate: 52, explodeSequence: 53,
wildDie: 55, unique: 60, count: 80, multiply: 85, plus: 90,
minus: 91, sort: 92, integerDivide: 93, modulo: 94, multiplyTotal: 100
```

- [ ] **Step 3: Commit**

```bash
git add RANDSUM_DICE_NOTATION_SPEC.md
git commit -m "docs: add formal RANDSUM Dice Notation Specification v1.0

Introduces faceted classification (Status, Stage, Verb, Channel),
8 operational verbs, 4 conformance levels, and complete taxonomy
of 13 modifier primitives, 10 aliases, and 1 macro."
```

---

## Task 2: Define ExplodeOptions Type

**Files:**
- Modify: `packages/roller/src/notation/types.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { createSeededRandom } from '../../test-utils/src/seededRandom'

describe('Conditional Explode', () => {
  test('explode with condition object triggers on matching values', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 10, quantity: 5, modifiers: { explode: { greaterThanOrEqual: 8 } } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBeGreaterThanOrEqual(5)
  })

  test('bare boolean true still triggers on max only', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 6, quantity: 3, modifiers: { explode: true } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBeGreaterThanOrEqual(3)
  })

  test('explode with exact condition', () => {
    const seeded = createSeededRandom(42)
    const result = roll(
      { sides: 10, quantity: 5, modifiers: { explode: { exact: [9, 10] } } },
      { randomFn: seeded }
    )
    expect(result.rolls[0]!.rolls.length).toBeGreaterThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts`
Expected: FAIL -- TypeScript error because `explode` does not accept ComparisonOptions yet.

- [ ] **Step 3: Add ExplodeOptions type to notation types**

In `packages/roller/src/notation/types.ts`, find the `ModifierOptions` interface and change:
```typescript
// FROM:
explode?: boolean

// TO:
explode?: boolean | ComparisonOptions
```

Also update `compound` and `penetrate` similarly:
```typescript
// FROM:
compound?: boolean | number
penetrate?: boolean | number

// TO:
compound?: boolean | number | ComparisonOptions
penetrate?: boolean | number | ComparisonOptions
```

Where `ComparisonOptions` is already imported/defined in the same file (the shared condition type used by cap, drop, reroll, count).

Verify that `ComparisonOptions` is already imported or available. If not, add the import.

- [ ] **Step 4: Update ModifierOptionTypes in schema.ts**

In `packages/roller/src/modifiers/schema.ts`, update:
```typescript
explode: boolean | ComparisonOptions
compound: boolean | number | ComparisonOptions
penetrate: boolean | number | ComparisonOptions
```

- [ ] **Step 5: Run typecheck**

Run: `bun run --filter @randsum/roller typecheck`
Expected: PASS (types are widened, not narrowed)

- [ ] **Step 6: Commit**

```bash
git add packages/roller/src/notation/types.ts packages/roller/src/modifiers/schema.ts
git commit -m "feat: add ExplodeOptions type for conditional explosion

Widen explode/compound/penetrate option types to accept
ComparisonOptions for configurable trigger conditions."
```

---

## Task 3: Implement Shared Condition Matcher

**Files:**
- Create: `packages/roller/src/modifiers/shared/conditionMatch.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/roller/__tests__/lib/modifiers/conditionMatch.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { matchesCondition } from '../../../src/modifiers/shared/conditionMatch'

describe('matchesCondition', () => {
  test('greaterThanOrEqual', () => {
    expect(matchesCondition(8, { greaterThanOrEqual: 8 })).toBe(true)
    expect(matchesCondition(7, { greaterThanOrEqual: 8 })).toBe(false)
    expect(matchesCondition(9, { greaterThanOrEqual: 8 })).toBe(true)
  })

  test('greaterThan', () => {
    expect(matchesCondition(9, { greaterThan: 8 })).toBe(true)
    expect(matchesCondition(8, { greaterThan: 8 })).toBe(false)
  })

  test('lessThanOrEqual', () => {
    expect(matchesCondition(3, { lessThanOrEqual: 3 })).toBe(true)
    expect(matchesCondition(4, { lessThanOrEqual: 3 })).toBe(false)
  })

  test('lessThan', () => {
    expect(matchesCondition(2, { lessThan: 3 })).toBe(true)
    expect(matchesCondition(3, { lessThan: 3 })).toBe(false)
  })

  test('exact values', () => {
    expect(matchesCondition(5, { exact: [5, 10] })).toBe(true)
    expect(matchesCondition(6, { exact: [5, 10] })).toBe(false)
    expect(matchesCondition(10, { exact: [5, 10] })).toBe(true)
  })

  test('multiple conditions OR together', () => {
    expect(matchesCondition(9, { greaterThanOrEqual: 8, exact: [3] })).toBe(true)
    expect(matchesCondition(3, { greaterThanOrEqual: 8, exact: [3] })).toBe(true)
    expect(matchesCondition(5, { greaterThanOrEqual: 8, exact: [3] })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionMatch.test.ts`
Expected: FAIL -- module not found.

- [ ] **Step 3: Implement conditionMatch.ts**

Create `packages/roller/src/modifiers/shared/conditionMatch.ts`:

```typescript
import type { ComparisonOptions } from '../../notation/types'

/**
 * Test whether a die value matches a ComparisonOptions condition.
 *
 * Used by the explosion family to support configurable triggers
 * (!{>=8}, !!{=10}, !p{>5}) using the same Condition Expression
 * grammar as Cap, Drop, Reroll, and Count.
 *
 * Multiple conditions are OR'd: a value matches if ANY condition holds.
 */
export function matchesCondition(value: number, condition: ComparisonOptions): boolean {
  if (condition.greaterThanOrEqual !== undefined && value >= condition.greaterThanOrEqual) return true
  if (condition.greaterThan !== undefined && value > condition.greaterThan) return true
  if (condition.lessThanOrEqual !== undefined && value <= condition.lessThanOrEqual) return true
  if (condition.lessThan !== undefined && value < condition.lessThan) return true
  if (condition.exact?.includes(value)) return true
  return false
}

/**
 * Build a trigger predicate from explode options.
 *
 * - `true` -> trigger on max value (backward compat)
 * - `ComparisonOptions` -> trigger on condition match
 *
 * Returns a function (value, sides) => boolean.
 */
export function buildExplosionTrigger(
  options: boolean | ComparisonOptions
): (value: number, sides: number) => boolean {
  if (options === true) {
    return (value, sides) => value === sides
  }
  return (value, _sides) => matchesCondition(value, options)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionMatch.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/roller/src/modifiers/shared/conditionMatch.ts packages/roller/__tests__/lib/modifiers/conditionMatch.test.ts
git commit -m "feat: add shared condition matcher for explosion family

Extracts matchesCondition() and buildExplosionTrigger() for use
by explode, compound, and penetrate conditional triggers."
```

---

## Task 4: Implement Conditional Explode

**Files:**
- Modify: `packages/roller/src/modifiers/explode.ts`
- Test: `packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts`

- [ ] **Step 1: Write targeted test for conditional explode parsing**

Add to `packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { explodeSchema } from '../../../src/modifiers/explode'

describe('Conditional Explode notation', () => {
  test('parses !{>=8}', () => {
    const result = explodeSchema.parse('3d10!{>=8}')
    expect(result).toEqual({ explode: { greaterThanOrEqual: 8 } })
  })

  test('parses !{=10}', () => {
    const result = explodeSchema.parse('5d10!{=10}')
    expect(result).toEqual({ explode: { exact: [10] } })
  })

  test('parses bare ! as boolean true', () => {
    const result = explodeSchema.parse('3d6!')
    expect(result).toEqual({ explode: true })
  })

  test('toNotation for condition', () => {
    const notation = explodeSchema.toNotation({ greaterThanOrEqual: 8 })
    expect(notation).toBe('!{>=8}')
  })

  test('toNotation for true', () => {
    const notation = explodeSchema.toNotation(true)
    expect(notation).toBe('!')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts`
Expected: FAIL -- explodeSchema does not handle condition objects.

- [ ] **Step 3: Update explode.ts to support conditional triggers**

Modify `packages/roller/src/modifiers/explode.ts`:

1. Update the pattern to also match `!{condition}`:
   - Pattern matches both bare `!` and `!{condition}`
   - Use: `/(?<!!)!(?!!|[pPsSiIrR])(\{(?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*\})?/`

2. Update parse to return ComparisonOptions when `{condition}` is present:
   - Import `parseComparisonNotation` from `'../notation/comparison'`
   - If match has capture group starting with `{`, strip braces, parse as comparison
   - Otherwise return `{ explode: true }` (backward compat)

3. Update toNotation to handle ComparisonOptions:
   - `true` -> `'!'`
   - `ComparisonOptions` -> `'!{>=N}'` etc.
   - Build parts array from comparison fields

4. Update the apply function to use buildExplosionTrigger:
   - Import `buildExplosionTrigger` from `'./shared/conditionMatch'`
   - Replace `roll === parameters.sides` with `trigger(roll, parameters.sides)`

5. Update the type annotation: `NotationSchema<boolean>` -> `NotationSchema<boolean | ComparisonOptions>`

6. Update toDescription to handle conditions.

7. Update docs array to include conditional forms.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts`
Expected: PASS

- [ ] **Step 5: Run full modifier test suite**

Run: `bun test packages/roller/__tests__/lib/modifiers/`
Expected: All PASS (backward compat: bare `!` still works)

- [ ] **Step 6: Commit**

```bash
git add packages/roller/src/modifiers/explode.ts packages/roller/__tests__/lib/modifiers/conditionalExplode.test.ts
git commit -m "feat: implement conditional explode (!{condition})

Explode now accepts ComparisonOptions for configurable triggers.
Bare ! remains sugar for 'trigger on max'. Uses shared Condition
Expression grammar from Cap, Drop, Reroll, Count."
```

---

## Task 5: Implement Conditional Compound and Penetrate

**Files:**
- Modify: `packages/roller/src/modifiers/compound.ts`
- Modify: `packages/roller/src/modifiers/penetrate.ts`
- Modify: `packages/roller/src/modifiers/shared/explosion.ts`
- Test: `packages/roller/__tests__/lib/modifiers/conditionalCompound.test.ts`
- Test: `packages/roller/__tests__/lib/modifiers/conditionalPenetrate.test.ts`

- [ ] **Step 1: Write failing tests for conditional compound**

Create `packages/roller/__tests__/lib/modifiers/conditionalCompound.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { compoundSchema } from '../../../src/modifiers/compound'

describe('Conditional Compound notation', () => {
  test('parses !!{>=8}', () => {
    const result = compoundSchema.parse('5d10!!{>=8}')
    expect(result).toEqual({ compound: { greaterThanOrEqual: 8 } })
  })

  test('parses bare !! as boolean true', () => {
    const result = compoundSchema.parse('3d6!!')
    expect(result).toEqual({ compound: true })
  })

  test('parses !!5 as number depth', () => {
    const result = compoundSchema.parse('1d8!!5')
    expect(result).toEqual({ compound: 5 })
  })
})
```

- [ ] **Step 2: Write failing tests for conditional penetrate**

Create `packages/roller/__tests__/lib/modifiers/conditionalPenetrate.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { penetrateSchema } from '../../../src/modifiers/penetrate'

describe('Conditional Penetrate notation', () => {
  test('parses !p{>=8}', () => {
    const result = penetrateSchema.parse('5d10!p{>=8}')
    expect(result).toEqual({ penetrate: { greaterThanOrEqual: 8 } })
  })

  test('parses bare !p as boolean true', () => {
    const result = penetrateSchema.parse('1d6!p')
    expect(result).toEqual({ penetrate: true })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionalCompound.test.ts packages/roller/__tests__/lib/modifiers/conditionalPenetrate.test.ts`
Expected: FAIL

- [ ] **Step 4: Update explosion.ts to accept condition predicate**

Modify `packages/roller/src/modifiers/shared/explosion.ts`:

1. Update `createAccumulatingExplosionBehavior` to handle ComparisonOptions:
   - Import `buildExplosionTrigger` from `./conditionMatch`
   - Import `ComparisonOptions` type
   - When options is an object (ComparisonOptions): use `buildExplosionTrigger(options)` for trigger, default depth
   - When options is boolean/number: existing behavior (trigger on max)

2. Update `applyAccumulatingExplosion` to accept an optional trigger predicate:
   - Add optional `trigger` parameter
   - Use `trigger` instead of `strategy.shouldContinue` when provided
   - Pass `trigger` through the recursion

- [ ] **Step 5: Update compound.ts pattern and parse**

Same approach as explode.ts:
- Update pattern to match `!!{condition}` alongside bare `!!` and `!!N`
- Pattern: `/!!(\d+|\{(?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*\})?/`
- Parse logic: no group -> true, starts with `{` -> ComparisonOptions, digits -> number
- Update type to `NotationSchema<boolean | number | ComparisonOptions>`
- Update toNotation and toDescription

- [ ] **Step 6: Update penetrate.ts pattern and parse**

Same approach:
- Pattern: `/!p(\d+|\{(?:>=|<=|>|<|=)?\d+(?:,(?:>=|<=|>|<|=)?\d+)*\})?/i`
- Same parse/toNotation/toDescription updates

- [ ] **Step 7: Run tests to verify they pass**

Run: `bun test packages/roller/__tests__/lib/modifiers/conditionalCompound.test.ts packages/roller/__tests__/lib/modifiers/conditionalPenetrate.test.ts`
Expected: PASS

- [ ] **Step 8: Run full test suite**

Run: `bun run --filter @randsum/roller test`
Expected: All PASS

- [ ] **Step 9: Commit**

```bash
git add packages/roller/src/modifiers/compound.ts packages/roller/src/modifiers/penetrate.ts packages/roller/src/modifiers/shared/explosion.ts packages/roller/__tests__/lib/modifiers/conditionalCompound.test.ts packages/roller/__tests__/lib/modifiers/conditionalPenetrate.test.ts
git commit -m "feat: implement conditional compound and penetrate

Extend !! and !p to accept Condition Expressions for configurable
triggers. !!{>=10} for WoD compound, !p{>=8} for custom penetrate.
Shared explosion behavior updated to accept trigger predicate."
```

---

## Task 6: Update Existing Notation Doc

**Files:**
- Modify: `packages/roller/RANDSUM_DICE_NOTATION.md`

- [ ] **Step 1: Add Conditional Explode syntax documentation**

In the Explode section of `packages/roller/RANDSUM_DICE_NOTATION.md`, add the conditional forms after the existing `!` documentation. Include notation table, TypeScript examples, and use cases (World of Darkness 8-again/10-again, custom thresholds). Also add conditional forms for Compound and Penetrate sections.

- [ ] **Step 2: Add spec reference at top of file**

At the very top of `RANDSUM_DICE_NOTATION.md`, below the `# Randsum Dice Notation` heading, add a callout pointing to the formal spec:

```markdown
> **Formal Specification:** For the complete taxonomy, classification system,
> conformance levels, and execution pipeline specification, see
> [RANDSUM_DICE_NOTATION_SPEC.md](../../RANDSUM_DICE_NOTATION_SPEC.md) at the
> repository root. This document is the notation syntax guide; the spec is the
> authoritative reference for implementers.
```

- [ ] **Step 3: Update the Taxonomy section**

The existing Taxonomy section should reference the spec for the full faceted classification. Keep the summary tables but add cross-reference.

- [ ] **Step 4: Commit**

```bash
git add packages/roller/RANDSUM_DICE_NOTATION.md
git commit -m "docs: add conditional explode syntax, reference formal spec

Document !{condition}, !!{condition}, !p{condition} syntax.
Add reference to RANDSUM_DICE_NOTATION_SPEC.md as the formal
classification and taxonomy authority."
```

---

## Task 7: Update Internal Doc References

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CONTRIBUTING.md`
- Modify: `README.md`
- Modify: `packages/roller/CLAUDE.md`
- Modify: `packages/roller/README.md`
- Modify: `packages/games/CLAUDE.md`

- [ ] **Step 1: Update root CLAUDE.md**

In the "Key Patterns" and "Dice Notation Reference" sections, add reference to `RANDSUM_DICE_NOTATION_SPEC.md` as the formal specification. Keep existing reference to `packages/roller/RANDSUM_DICE_NOTATION.md` as the syntax guide.

- [ ] **Step 2: Update CONTRIBUTING.md**

Add the spec as the primary reference, keep syntax guide as secondary.

- [ ] **Step 3: Update README.md**

Add link to the spec alongside existing notation doc link.

- [ ] **Step 4: Update packages/roller/CLAUDE.md**

Add note that the formal specification lives at repo root.

- [ ] **Step 5: Update packages/roller/README.md**

Add spec reference alongside existing notation doc link.

- [ ] **Step 6: Update packages/games/CLAUDE.md**

Add reference to the spec for understanding modifier taxonomy.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md CONTRIBUTING.md README.md packages/roller/CLAUDE.md packages/roller/README.md packages/games/CLAUDE.md
git commit -m "docs: update all references to point to formal spec

All CLAUDE.md, README.md, and CONTRIBUTING.md files now reference
RANDSUM_DICE_NOTATION_SPEC.md as the formal specification and
RANDSUM_DICE_NOTATION.md as the syntax guide."
```

---

## Task 8: Run Full Validation

- [ ] **Step 1: Run full test suite**

Run: `bun run --filter @randsum/roller test`
Expected: All PASS

- [ ] **Step 2: Run typecheck**

Run: `bun run --filter @randsum/roller typecheck`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `bun run lint`
Expected: PASS (or fix any issues)

- [ ] **Step 4: Run build**

Run: `bun run build`
Expected: PASS

- [ ] **Step 5: Run size check**

Run: `bun run size`
Expected: PASS -- conditional explode should add minimal size (reuses existing comparison parsing)

- [ ] **Step 6: Verify spec document links work**

Check that all cross-references between `RANDSUM_DICE_NOTATION_SPEC.md` and `RANDSUM_DICE_NOTATION.md` resolve correctly with relative paths.

- [ ] **Step 7: Final commit if any fixes needed**

Stage only the specific files that needed fixes, then commit:

```bash
git commit -m "fix: address validation issues from full suite run"
```
