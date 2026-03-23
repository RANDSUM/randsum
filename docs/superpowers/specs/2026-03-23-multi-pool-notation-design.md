# Multi-Pool Notation Extension — Design Spec

## Summary

Extend `@randsum/roller`'s notation parser to allow percentile (`d%`), geometric (`gN`), and draw (`DDN`) dice in multi-pool notation strings, and support a quantity prefix on percentile dice.

## Goals

1. `1d20+1d%` parses as two pools: `{ 1d20 }` + `{ 1d100 }`
2. `1d%`, `2d%`, `3d%` are valid (quantity prefix on percentile)
3. `1d20+g6` parses as two pools: `{ 1d20 }` + `{ geometric, sides: 6 }`
4. `4d6L+3DD8` parses as two pools: `{ 4d6, drop lowest }` + `{ draw, 3d8 }`
5. All existing notation continues to work unchanged
6. No new aliases or syntax — just unblocking existing die types from multi-pool context

## Non-Goals

- `dF`, `dF.2`, `d{H,T}` in multi-pool (non-numeric, stay single-pool)
- `zN` in multi-pool (defer)
- New fields on `RollOptions` (percentile is just `sides: 100`)
- Changes to the modifier system or roll pipeline

## Changes

### 1. `notation/isDiceNotation.ts`

**Current:** Percentile matches only `/^[Dd]%$/` (exact, no quantity prefix).

**Change:** Allow optional quantity prefix: `/^\d*[Dd]%$/`. This accepts `d%`, `1d%`, `3d%`.

**Current:** Multi-pool validation only detects standard `[+-]?\d+[Dd]\d+` cores.

**Change:** After removing all valid tokens from the string, also remove percentile (`\d*[Dd]%`), geometric (`\d*[Gg]\d+`), and draw (`\d*[Dd]{2}\d+`) patterns that appear with a leading `[+-]`. The validation passes if no characters remain.

Implementation detail: the simplest approach is to extend the `getCompleteNotationPattern()` regex (or the token-stripping logic in `isDiceNotation`) to include these special dice as valid tokens in any position, not just as standalone exact matches.

### 2. `notation/tokenize.ts`

**Current:** The `d%` token is matched by `DICE_SCHEMAS[percentile].parseFrom` which matches `/[Dd]%/`. This works in single-pool context.

**Change:** Extend the `d%` token pattern to allow a leading quantity: `/\d*[Dd]%/`. In multi-pool context, the `parseFrom` function in `tokenize.ts` already checks for new pools via `/^[+-]\d+[Dd][1-9]\d*/` — this needs to also match `[+-]\d*[Dd]%`, `[+-]\d*[Gg]\d+`, and `[+-]\d*[Dd]{2}\d+`.

The token category for `d%` remains `Special`. The `key` remains `d%`. The `description` helper generates "Roll N percentile dice" when quantity > 1.

### 3. `notation/parse/listOfNotations.ts`

**Current:** `coreNotationPattern` global regex finds all `[+-]?\d+[Dd][1-9]\d*` matches to split multi-pool strings.

**Change:** Extend the pool detection to also match:
- `[+-]?\d*[Dd]%` (percentile pool)
- `[+-]?\d*[Gg]\d+` (geometric pool)
- `[+-]?\d*[Dd]{2}\d+` (draw pool)

These are additional "core-like" patterns that split the notation into separate pools. Each matched segment is then parsed by `singleNotationToOptions()` or the appropriate special-die parser.

### 4. `notation/parse/singleNotationToOptions.ts`

**Current:** Core match expects `[+-]?\d+[Dd]\d+`. Percentile (`d%`) is never seen here because it's caught earlier by the exact-match check.

**Change:** Before the standard core match, check for percentile core: if the notation (after stripping modifiers and label) matches `\d*[Dd]%`, extract quantity (default 1) and set `sides: 100`. Then continue with normal modifier parsing on any remaining string.

### 5. `roll/parseArguments.ts`

**Current:** Has a special `isPercentileDie()` check that catches `d%`/`D%` as exact strings before notation parsing.

**Change:** Remove the early-return for percentile. Let `d%` and `Nd%` flow through the normal notation parsing path (which now handles them via the changes above). The `isPercentileDie` function and its special case can be deleted.

### 6. Geometric and Draw in multi-pool context

**Current:** `parseGeometricDieParams()` and `parseDrawDieParams()` in `parseArguments.ts` handle these as standalone strings.

**Change:** When `listOfNotations()` splits a multi-pool string and produces a segment like `+g6` or `+3DD8`, the segment is passed to `parseArguments()` which already calls `parseGeometricDieParams()` and `parseDrawDieParams()`. These parsers need to handle an optional leading `+` or `-` sign (which indicates pool arithmetic). Strip the sign, parse the die, set `arithmetic: 'add'` or `'subtract'` on the resulting `RollParams`.

## Test Cases

```typescript
// Percentile with quantity prefix
isDiceNotation('1d%')           // true (new)
isDiceNotation('3d%')           // true (new)
isDiceNotation('d%')            // true (existing)
roll('1d%').rolls[0].sides      // 100
roll('3d%').rolls[0].quantity   // 3 (or 3 separate d100 rolls)

// Multi-pool with percentile
isDiceNotation('1d20+1d%')      // true (new)
isDiceNotation('1d20+d%')       // true (new)
roll('1d20+1d%').rolls.length   // 2
roll('1d20-1d%').rolls[1].arithmetic // 'subtract'

// Multi-pool with geometric
isDiceNotation('1d20+g6')       // true (new)
roll('1d20+g6').rolls.length    // 2
roll('1d20+g6').rolls[1].geometric // true

// Multi-pool with draw
isDiceNotation('4d6L+3DD8')     // true (new)
roll('4d6L+3DD8').rolls.length  // 2
roll('4d6L+3DD8').rolls[1].draw // true

// Existing behavior unchanged
isDiceNotation('4d6L')          // true
isDiceNotation('d%')            // true
isDiceNotation('dF')            // true
isDiceNotation('g6')            // true
isDiceNotation('3DD8')          // true
roll('4d6L').total              // number
roll('d%').rolls[0].sides       // 100

// These remain invalid (non-numeric, single-pool only)
isDiceNotation('1d20+dF')       // false
isDiceNotation('1d20+d{H,T}')   // false
```

## Migration

- No breaking changes to the public API
- `roll('d%')` continues to work identically
- `roll('1d20', 'd%')` (multi-argument) continues to work
- `roll('1d20+1d%')` (single-string) becomes newly valid
- `roll({ sides: 100 })` continues to work (percentile via options)
