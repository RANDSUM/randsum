# Typed Dice Notation Template Literals — Design Spec

## Summary

Replace the loose `DiceNotation` template literal type (`${number}${'d' | 'D'}${number}${string}`) with a recursive type-level parser that validates the full dice notation grammar at compile time. Consumers get red squiggles in their editor for invalid notation strings.

## Goals

1. `roll('4d6L')` typechecks — valid notation
2. `roll('4d6GARBAGE')` is a compile error — invalid modifier
3. `roll('1d20+1d6')` typechecks — valid multi-pool
4. `roll('1d20+dF')` typechecks — valid mixed pool
5. `roll('d%')` typechecks — valid special die
6. `roll('not-dice')` is a compile error
7. Complex notations that exceed TypeScript's recursion depth widen to `string` gracefully
8. The runtime `isDiceNotation()` type guard continues to work for dynamic strings
9. Zero runtime cost — all validation is compile-time only

## Non-Goals

- Validating semantic correctness (e.g., "drop lowest 5 from 4 dice" is structurally valid)
- Validating numeric ranges (e.g., "0 sides" passes the type check, caught at runtime)
- Supporting notation strings longer than ~50 characters at full type precision

## Architecture

### Type-Level Parser

A recursive conditional type that mirrors the runtime `isDiceNotation` function. It consumes a string character by character (or token by token), validating structure at each step.

```
Input: "4d6L+5"
  ↓ ValidNotation<"4d6L+5">
  ↓ try ValidMultiPool → fail (no pool after +, just modifier)
  ↓ try ValidSinglePool<"4d6L+5">
  ↓   match ${Digits}d${Digits} → "4d6", rest = "L+5"
  ↓   ValidModifierChain<"L+5">
  ↓     consume "L" → rest = "+5"
  ↓     consume "+${Digits}" → rest = ""
  ↓     "" is valid end → PASS
  ↓ Result: "4d6L+5" (the literal type itself)
```

### Core Types

#### Digit and Number Matching

```typescript
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

// Consumes one or more digits from the start of a string
// Returns [consumed_digits, remaining_string] or never
type ConsumeDigits<S extends string, Acc extends string = ''> =
  S extends `${infer C}${infer Rest}`
    ? C extends Digit
      ? ConsumeDigits<Rest, `${Acc}${C}`>
      : Acc extends '' ? never : [Acc, S]
    : Acc extends '' ? never : [Acc, S]
```

#### Single Pool Validation

```typescript
type ValidSinglePool<S extends string> =
  // Standard: NdS + modifiers
  ConsumeDigits<S> extends [infer _Q, infer AfterQ extends string]
    ? AfterQ extends `${'d' | 'D'}${infer AfterD}`
      ? ConsumeDigits<AfterD> extends [infer _S, infer Rest extends string]
        ? ValidModifierChain<Rest> extends true ? true : false
        : // d% special case
          AfterD extends `%${infer Rest}`
          ? Rest extends '' ? true : false
          : false
      : false
    : // No leading digits — check special die patterns
      ValidSpecialDie<S>
```

#### Modifier Chain Validation

The modifier chain is the most complex part. Each modifier is tried in order. When one matches, the remainder is recursively validated.

```typescript
type ValidModifierChain<S extends string> =
  // Empty string — end of notation, valid
  S extends '' ? true :
  // Drop/Keep: L, H, K, KL, KM + optional digits
  S extends `${'L' | 'l' | 'H' | 'h'}${infer Rest}` ? ValidAfterOptionalDigits<Rest> :
  S extends `${'K' | 'k'}${'L' | 'l' | 'M' | 'm'}${infer Rest}` ? ValidAfterOptionalDigits<Rest> :
  S extends `${'K' | 'k'}${infer Rest}` ? ValidAfterOptionalDigits<Rest> :
  // Explode variants: !!, !p, !s{...}, !i, !r, !{...}, !
  S extends `!!${infer Rest}` ? ValidAfterOptionalDigits<Rest> :
  S extends `!${'p' | 'P'}${infer Rest}` ? ValidAfterOptionalConditionOrDigits<Rest> :
  S extends `!${'s' | 'S'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  S extends `!${'i' | 'I' | 'r' | 'R'}${infer Rest}` ? ValidModifierChain<Rest> :
  S extends `!{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  S extends `!${infer Rest}` ? ValidAfterOptionalDigits<Rest> :
  // Reroll: R{...} or ro{...}
  S extends `${'R' | 'r'}${'o' | 'O'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  S extends `${'R' | 'r'}{${infer _Inner}}${infer Rest}` ? ValidAfterOptionalDigits<Rest> :
  // Cap: C{...}
  S extends `${'C' | 'c'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  // Drop condition: D{...} (distinct from DD draw die)
  S extends `${'D' | 'd'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  // Replace/Map: V{...}
  S extends `${'V' | 'v'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  // Unique: U or U{...}
  S extends `${'U' | 'u'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  S extends `${'U' | 'u'}${infer Rest}` ? ValidModifierChain<Rest> :
  // Wild die: W
  S extends `${'W' | 'w'}${infer Rest}` ? ValidModifierChain<Rest> :
  // Count: #{...}
  S extends `#{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  // Success/Failure count: S{...}, F{...}
  S extends `${'S' | 'F'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  // Sort: sa, sd, or bare s (must not be followed by digit or {)
  S extends `${'s' | 'S'}${'a' | 'A' | 'd' | 'D'}${infer Rest}` ? ValidModifierChain<Rest> :
  // Margin of success: ms{N}
  S extends `${'m' | 'M'}${'s' | 'S'}{${infer _Inner}}${infer Rest}` ? ValidModifierChain<Rest> :
  // Scale: **, *, //, %
  S extends `**${infer Rest}` ? ValidAfterDigits<Rest> :
  S extends `*${infer Rest}` ? ValidAfterDigits<Rest> :
  S extends `//${infer Rest}` ? ValidAfterDigits<Rest> :
  S extends `%${infer Rest}` ? ValidAfterDigits<Rest> :
  // Arithmetic: +N or -N (where N is NOT followed by d — that would be a new pool)
  S extends `${'+' | '-'}${infer Rest}` ? IsPoolStart<Rest> extends true ? false : ValidAfterDigits<Rest> :
  // Repeat: xN (must be at end)
  S extends `${'x' | 'X'}${infer Rest}` ? ConsumeDigits<Rest> extends [infer _, ''] ? true : false :
  // Label: [text]
  S extends `[${infer _Label}]${infer Rest}` ? ValidModifierChain<Rest> :
  // Nothing matched — invalid
  false
```

#### Multi-Pool Validation

```typescript
// Check if a string starts with a die indicator (new pool, not modifier)
type IsPoolStart<S extends string> =
  // Standard: digits + d + digits
  ConsumeDigits<S> extends [infer _, infer After extends string]
    ? After extends `${'d' | 'D'}${Digit}${string}` ? true :
      After extends `${'d' | 'D'}%${string}` ? true :
      false
    : // Special die at start: dF, d{...}, gN, DDN, d%
      S extends `${'d' | 'D'}${'F' | 'f'}${string}` ? true :
      S extends `${'d' | 'D'}{${string}` ? true :
      S extends `${'g' | 'G'}${Digit}${string}` ? true :
      S extends `${'d' | 'D'}${'d' | 'D'}${Digit}${string}` ? true :
      S extends `${'d' | 'D'}%${string}` ? true :
      S extends `${'z' | 'Z'}${Digit}${string}` ? true :
      false

// Multi-pool: split at +/- pool boundaries
type ValidMultiPool<S extends string> =
  // Find the first +/- that starts a new pool
  // This requires scanning the modifier chain to find where it ends
  // and a +/- followed by a pool indicator begins
  ValidSinglePoolConsuming<S> extends [true, infer Rest extends string]
    ? Rest extends '' ? true :
      Rest extends `+${infer After}` ? IsPoolStart<After> extends true
        ? ValidNotation<After> extends true ? true : false
        : false :
      Rest extends `-${infer After}` ? IsPoolStart<After> extends true
        ? ValidNotation<After> extends true ? true : false
        : false :
      false
    : false
```

#### Special Die Validation

The existing literal types (`FateDieNotation`, `PercentileDie`, etc.) already cover these. The top-level `ValidNotation` unions them:

```typescript
type ValidSpecialDie<S extends string> =
  S extends FateDieNotation ? true :
  S extends PercentileDie ? true :
  S extends `${number}${'d' | 'D'}%` ? true :  // Nd% with quantity
  S extends ZeroBiasNotation ? true :
  S extends CustomFacesNotation ? true :
  S extends DrawDieNotation ? true :
  S extends GeometricDieNotation ? true :
  false
```

### The Public `DiceNotation` Type — No Branding

`DiceNotation` remains a **template literal type** (not a branded type). Flat strings continue to work:

```typescript
// DiceNotation is the union of all structurally valid notation patterns
type DiceNotation =
  | ValidStandardNotation    // NdS + modifiers
  | FateDieNotation          // dF, 4dF.2
  | PercentileDie            // d%, Nd%
  | ZeroBiasNotation         // z6, 3z10
  | CustomFacesNotation      // d{H,T}
  | DrawDieNotation          // DD6, 3DD8
  | GeometricDieNotation     // g6, 2g10

// ValidStandardNotation is the recursive template literal:
type ValidStandardNotation = `${number}${'d' | 'D'}${number}${ValidModifierSuffix}`

// ValidModifierSuffix enumerates structurally valid modifier tails
type ValidModifierSuffix = '' | `${ValidModifier}${ValidModifierSuffix}`
```

**Key design decision:** `ValidModifierSuffix` uses a **finite unrolled union** rather than infinite recursion. We enumerate modifier patterns up to a practical depth (2-3 modifiers deep as explicit union members). Beyond that depth, the trailing `${string}` catch-all accepts anything — matching the graceful widening goal.

```typescript
// Tier 1: single modifier
type Mod1 = DropMod | KeepMod | ExplodeMod | RerollMod | CapMod | UniqueMod | ArithMod | SortMod | WildMod | RepeatMod | LabelMod

// Tier 2: two modifiers
type Mod2 = `${Mod1}${Mod1}`

// Tier 3: catch-all for 3+
type Mod3Plus = `${Mod1}${Mod1}${string}`

type ValidModifierSuffix = '' | Mod1 | Mod2 | Mod3Plus
```

Each `*Mod` type is a template literal union:

```typescript
type DropMod = 'L' | 'l' | 'H' | 'h' | `${'L' | 'l'}${number}` | `${'H' | 'h'}${number}` | `${'D' | 'd'}{${string}}`
type KeepMod = 'K' | 'k' | `${'K' | 'k'}${number}` | `${'K' | 'k'}${'L' | 'l'}${number | ''}` | `${'K' | 'k'}${'M' | 'm'}${number | ''}`
type ExplodeMod = '!' | '!!' | `!{${string}}` | `!!{${string}}` | '!p' | '!P' | `!p{${string}}` | '!i' | '!I' | '!r' | '!R' | `!s{${string}}` | `!S{${string}}`
type RerollMod = `${'R' | 'r'}{${string}}` | `${'R' | 'r'}${'o' | 'O'}{${string}}`
type CapMod = `${'C' | 'c'}{${string}}`
type UniqueMod = 'U' | 'u' | `${'U' | 'u'}{${string}}`
type ArithMod = `+${number}` | `-${number}` | `*${number}` | `**${number}` | `//${number}` | `%${number}` | `${'m' | 'M'}${'s' | 'S'}{${number}}`
type SortMod = 's' | 'S' | 'sa' | 'SA' | 'sd' | 'SD' | 'Sa' | 'Sd' | 'sA' | 'sD'
type WildMod = 'W' | 'w'
type RepeatMod = `${'x' | 'X'}${number}`
type LabelMod = `[${string}]`
type CountMod = `#{${string}}` | `${'S' | 'F'}{${string}}`
```

### How `roll()` Works

```typescript
// roll() accepts flat strings that match DiceNotation — no casting needed
roll('4d6L')        // ✓ matches ValidStandardNotation
roll('1d20+5')      // ✓ matches ValidStandardNotation (+5 is ArithMod)
roll('d%')          // ✓ matches PercentileDie
roll('4dF')         // ✓ matches FateDieNotation
roll('not-dice')    // ✗ compile error: doesn't match DiceNotation

// Multi-pool: separate arguments (already works)
roll('1d20', '1d6') // ✓ each arg matches DiceNotation

// Multi-pool single string: matches because +NdS is a valid ArithMod tail
// that happens to also look like a pool boundary
roll('1d20+1d6')    // ✓ matches `${number}d${number}+${number}d${number}`
                    //   which is a subset of ValidStandardNotation

// Dynamic strings need isDiceNotation() guard
const input: string = getUserInput()
if (isDiceNotation(input)) {
  roll(input)       // ✓ narrowed to DiceNotation
}
```

### `isDiceNotation` Flexibility

`isDiceNotation()` remains the runtime authority. It accepts anything the type system accepts, plus edge cases the type system can't express (like very long modifier chains that exceed the union depth).

The type guard narrows `unknown` to `DiceNotation`:

```typescript
export function isDiceNotation(argument: unknown): argument is DiceNotation
```

Since `DiceNotation` is a template literal union (not a branded type), the narrowed value is directly usable as a flat string — no casting needed anywhere in the consumer's code.

## File Structure

```
packages/roller/src/notation/
  templateLiterals.ts    — NEW: all type-level validation types
  types.ts               — MODIFY: DiceNotation becomes branded type, re-exports from templateLiterals
```

```
packages/roller/src/types/
  core.ts                — MODIFY: RollArgument uses new DiceNotation
```

```
packages/roller/src/roll/
  index.ts               — MODIFY: roll() overloads for string literal validation
```

## Test Strategy

Type-level tests using `@ts-expect-error` annotations:

```typescript
// packages/roller/__tests__/types/templateLiterals.test-d.ts

// Valid notations — should NOT error
const a: ValidNotation<'4d6L'> = true
const b: ValidNotation<'1d20+5'> = true
const c: ValidNotation<'4d6L+1d20'> = true
const d: ValidNotation<'d%'> = true
const e: ValidNotation<'2dF'> = true

// Invalid notations — should error
// @ts-expect-error
const f: ValidNotation<'garbage'> = true
// @ts-expect-error
const g: ValidNotation<'4d6X'> = true
// @ts-expect-error
const h: ValidNotation<''> = true
```

Run with `tsc --noEmit` — `@ts-expect-error` lines that DON'T error will themselves become errors (TypeScript's built-in assertion mechanism).

## Complexity Budget

TypeScript's recursive conditional type depth limit is ~50 levels. Each modifier consumption is ~3-5 levels of recursion. Budget:

- Core `NdS` parsing: ~5 levels
- Each modifier: ~3-5 levels
- Multi-pool recursion: ~5 levels per pool

This means: **single pool with up to ~8 modifiers, or up to ~5 pools with 1-2 modifiers each** should validate within the depth limit. Beyond that, the type widens to `string` (the graceful degradation path).

## Migration

- `DiceNotation` changes from loose `${number}d${number}${string}` to a precise union of template literal patterns
- All existing `'4d6L'` style string literals that are valid notation continue to typecheck
- All existing `as DiceNotation` casts continue to work
- `isDiceNotation()` return type still narrows to `DiceNotation`
- `roll()` signature unchanged — accepts `DiceNotation | RollOptions | number`
- Game packages that re-export `DiceNotation` pick up the new type automatically
- **Breaking:** strings like `'4d6GARBAGE'` that previously passed the loose template literal will now be compile errors. This is the intended behavior.

## Phases

**Phase 1: Modifier types + strict DiceNotation**
- Define all `*Mod` template literal types (DropMod, KeepMod, etc.)
- Define `ValidModifierSuffix` as a tiered union (1 modifier, 2 modifiers, 3+ catch-all)
- Define `ValidStandardNotation` as `${number}d${number}${ValidModifierSuffix}`
- Update `DiceNotation` to be the union of all valid patterns
- Type-level tests with `@ts-expect-error`
- Verify no runtime changes needed

**Phase 2: Multi-pool + integration**
- Ensure multi-pool notation (`1d20+1d6`) matches the template literal
- Verify all `as DiceNotation` casts in roller + games + expo still compile
- Verify `isDiceNotation()` narrows correctly
- Add type tests for edge cases (long notation, special dice in multi-pool)
