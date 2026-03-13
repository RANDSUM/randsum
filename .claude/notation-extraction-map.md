# Notation Extraction — Complete File Mapping

**Prepared by:** SCOTT FREE, Codebase Explorer
**For:** HIMON, Implementation Lead
**Date:** 2026-03-08
**Based on:** `docs/plans/2026-03-07-notation-package.md`

---

## Executive Summary

This document maps every file that will need to change when extracting the notation layer from `@randsum/roller` into a new `@randsum/notation` package.

**Total scope:**
- **8-9 files moving** to new package
- **4 files changing in roller** (imports + re-exports)
- **15 modifier definitions changing** (import path updates)
- **2 files changing in modifiers/registry** (import path updates)
- **2 files in component-library changing** (can optionally import from notation instead)
- **3 root workspace config files changing** (add notation package references)

---

## Part 1: Files Being Moved (Content Unchanged, Path Changes)

### Notation Layer — Core Files

| Current Path | New Path | Exports |
|---|---|---|
| `packages/roller/src/lib/notation/schema.ts` | `packages/notation/src/schema.ts` | `NotationSchema<TOptions>`, `defineNotationSchema()` |
| `packages/roller/src/lib/notation/notationToOptions.ts` | `packages/notation/src/parse/notationToOptions.ts` | `notationToOptions()` |
| `packages/roller/src/lib/notation/singleNotationToOptions.ts` | `packages/notation/src/parse/singleNotationToOptions.ts` | `singleNotationToOptions()` |
| `packages/roller/src/lib/notation/listOfNotations.ts` | `packages/notation/src/parse/listOfNotations.ts` | `listOfNotations()` |
| `packages/roller/src/lib/notation/suggestions.ts` | `packages/notation/src/suggestions.ts` | `suggestNotationFix()` |
| `packages/roller/src/isDiceNotation.ts` | `packages/notation/src/isDiceNotation.ts` | `isDiceNotation()`, `notation()` |

### Notation Modifier Definition Schemas — 14 Files

All files in `packages/roller/src/lib/notation/definitions/` → `packages/notation/src/definitions/`

| Modifier | Current File | New File | Exports |
|---|---|---|---|
| Cap | `cap.ts` | `cap.ts` | `capSchema: NotationSchema<ComparisonOptions>` |
| Drop | `drop.ts` | `drop.ts` | `dropSchema: NotationSchema<DropOptions>` |
| Keep | `keep.ts` | `keep.ts` | `keepSchema: NotationSchema<KeepOptions>` |
| Replace | `replace.ts` | `replace.ts` | `replaceSchema: NotationSchema<ReplaceOptions>` |
| Reroll | `reroll.ts` | `reroll.ts` | `rerollSchema: NotationSchema<RerollOptions>` |
| Explode | `explode.ts` | `explode.ts` | `explodeSchema: NotationSchema<boolean \| number>` |
| Compound | `compound.ts` | `compound.ts` | `compoundSchema: NotationSchema<boolean \| number>` |
| Penetrate | `penetrate.ts` | `penetrate.ts` | `penetrateSchema: NotationSchema<boolean \| number>` |
| Unique | `unique.ts` | `unique.ts` | `uniqueSchema: NotationSchema<boolean \| UniqueOptions>` |
| Count Successes | `countSuccesses.ts` | `countSuccesses.ts` | `countSuccessesSchema: NotationSchema<SuccessCountOptions>` |
| Multiply | `multiply.ts` | `multiply.ts` | `multiplySchema: NotationSchema<number>` |
| Plus | `plus.ts` | `plus.ts` | `plusSchema: NotationSchema<number>` |
| Minus | `minus.ts` | `minus.ts` | `minusSchema: NotationSchema<number>` |
| MultiplyTotal | `multiplyTotal.ts` | `multiplyTotal.ts` | `multiplyTotalSchema: NotationSchema<number>` |
| Arithmetic | `arithmetic.ts` | `arithmetic.ts` | (internal schema re-exports) |
| Index | `index.ts` | `index.ts` | All 14 schema exports |

### Type Definitions That Move

**Source:** `packages/roller/src/types/modifiers.ts` (subset)
**Destination:** `packages/notation/src/types.ts`

These modifier option types move to notation:
- `ComparisonOptions` — interface with `greaterThan`, `greaterThanOrEqual`, `lessThan`, `lessThanOrEqual`, `exact`
- `DropOptions` — extends `ComparisonOptions`, adds `highest`, `lowest`
- `KeepOptions` — interface with `highest`, `lowest`
- `RerollOptions` — extends `ComparisonOptions`, adds `max`
- `ReplaceOptions` — interface with `from: number | ComparisonOptions`, `to: number`
- `UniqueOptions` — interface with `notUnique: number[]`
- `SuccessCountOptions` — interface with `threshold: number`, optional `botchThreshold`
- `ModifierConfig` — union type of all above option types
- `ModifierOptions` — main interface with all modifier keys (`cap`, `drop`, `keep`, `replace`, `reroll`, `unique`, `explode`, `compound`, `penetrate`, `countSuccesses`, `multiply`, `plus`, `minus`, `multiplyTotal`)

**Note:** These are re-exported from roller for backward compatibility (see Part 3).

---

## Part 2: Files in Roller That Import From Notation Layer

These files currently import from relative paths (`../lib/notation`) and will change to import from `@randsum/notation`.

### Core API Files

| File | Current Import | New Import | What's Imported |
|---|---|---|---|
| `packages/roller/src/isDiceNotation.ts` | `from './lib/notation/suggestions'` | `from '@randsum/notation'` | `suggestNotationFix` |
| `packages/roller/src/validateNotation.ts` | `from './lib/notation'` | `from '@randsum/notation'` | `notationToOptions` |
| `packages/roller/src/roll/parseArguments.ts` | `from '../lib/notation'` | `from '@randsum/notation'` | `notationToOptions` |

### Modifier System Files

| File | Current Import | New Import | What's Imported |
|---|---|---|---|
| `packages/roller/src/lib/modifiers/schema.ts` | `from '../notation/schema'` | `from '@randsum/notation'` | `NotationSchema` (type) |
| `packages/roller/src/lib/modifiers/registry.ts` | `from '../notation/schema'` | `from '@randsum/notation'` | `NotationSchema` (type) |

---

## Part 3: Modifier Definition Files That Change Import Paths

All 15 modifier definition files in `packages/roller/src/lib/modifiers/definitions/` change from:
```typescript
import { xxxSchema } from '../../notation/definitions/xxx'
```
To:
```typescript
import { xxxSchema } from '@randsum/notation'
```

**Files to update (15 total):**
1. `cap.ts` — imports `capSchema`
2. `drop.ts` — imports `dropSchema`
3. `keep.ts` — imports `keepSchema`
4. `replace.ts` — imports `replaceSchema`
5. `reroll.ts` — imports `rerollSchema`
6. `explode.ts` — imports `explodeSchema`
7. `compound.ts` — imports `compoundSchema`
8. `penetrate.ts` — imports `penetrateSchema`
9. `unique.ts` — imports `uniqueSchema`
10. `countSuccesses.ts` — imports `countSuccessesSchema`
11. `multiply.ts` — imports `multiplySchema`
12. `plus.ts` — imports `plusSchema`
13. `minus.ts` — imports `minusSchema`
14. `multiplyTotal.ts` — imports `multiplyTotalSchema`
15. `index.ts` — may or may not reference them (likely just re-exports)

---

## Part 4: Roller Files That Need Type Updates

### `packages/roller/src/types/modifiers.ts`

**Action:** Remove all modifier option types (listed in Part 1), add re-exports:

```typescript
// Re-export from notation for backward compatibility
export type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  SuccessCountOptions,
  ModifierConfig,
  ModifierOptions
} from '@randsum/notation'
```

Keep in this file:
- `ModifierLog` — execution-only, stays in roller
- `NumericRollBonus` — execution-only, stays in roller

---

## Part 5: Component-Library Files That Can Import From Notation

These files currently import notation-related items from roller. After extraction, they can optionally import from the lighter notation package instead (backward compatible either way).

| File | Current Import | What's Imported | Can Change To |
|---|---|---|---|
| `packages/component-library/src/components/ModifierReference/ModifierDocContent.tsx` | `from '@randsum/roller'` | `isDiceNotation` | `from '@randsum/notation'` |
| `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx` | `from '@randsum/roller'` | `isDiceNotation, roll` | Keep `roll` from roller, move `isDiceNotation` to notation |
| `packages/component-library/src/components/RollerPlayground/tokenize.ts` | `from '@randsum/roller'` | `validateNotation` | Could import from notation (optional) |

**Note:** These changes are optional — the public API of roller re-exports these items, so imports continue to work. Only update if component-library wants the lighter dependency.

---

## Part 6: Roller Package Configuration

### `packages/roller/package.json`

**Changes needed:**
1. Add dependency on notation:
```json
{
  "dependencies": {
    "@randsum/notation": "workspace:~"
  }
}
```

2. Note: This becomes roller's **only npm dependency** (currently zero-dep from npm's perspective).

---

## Part 7: Root Workspace Configuration Files

### `package.json` (Root)

**Changes needed:**

1. **Workspaces array** — add notation package:
```json
{
  "workspaces": [
    "packages/notation",    // ADD THIS
    "packages/roller",
    "games/*",
    "apps/cli",
    "apps/discord-bot",
    "apps/site"
  ]
}
```

2. **Size-limit configuration** — add entry for notation package:
```json
{
  "size-limit": [
    {
      "path": "packages/notation/dist/index.js",
      "limit": "6 KB"
    },
    // ... existing entries for roller (unchanged)
  ]
}
```

### `tsconfig.json` (Root)

**Changes needed:** Add notation package reference in the `references` array:
```json
{
  "references": [
    { "path": "packages/notation" },    // ADD THIS
    { "path": "packages/roller" },
    { "path": "packages/games" },
    // ... rest unchanged
  ]
}
```

---

## Part 8: New Package Structure

### `packages/notation/package.json` (NEW)

```json
{
  "name": "@randsum/notation",
  "version": "3.0.0",
  "description": "Dice notation parser for @randsum ecosystem",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "bunup",
    "test": "bun test",
    "lint": "eslint src",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "typecheck": "tsc --noEmit"
  }
}
```

### `packages/notation/tsconfig.json` (NEW)

```json
{
  "extends": "../../tsconfig.packages.json"
}
```

### `packages/notation/src/index.ts` (NEW)

```typescript
// Types
export type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  SuccessCountOptions,
  ModifierConfig,
  ModifierOptions,
} from './types'

// Schema
export type { NotationSchema } from './schema'
export { defineNotationSchema } from './schema'

// Parsing
export { notationToOptions } from './parse/notationToOptions'
export { listOfNotations } from './parse/listOfNotations'
export { isDiceNotation, notation } from './isDiceNotation'

// Validation/suggestions
export { suggestNotationFix } from './suggestions'

// All modifier schemas (for roller to register)
export {
  capSchema,
  dropSchema,
  keepSchema,
  replaceSchema,
  rerollSchema,
  explodeSchema,
  compoundSchema,
  penetrateSchema,
  uniqueSchema,
  countSuccessesSchema,
  multiplySchema,
  plusSchema,
  minusSchema,
  multiplyTotalSchema,
} from './definitions'
```

### `packages/notation/src/types.ts` (NEW — moved from roller)

Contains all modifier option types (see Part 1 for full list).

### `packages/notation/src/definitions/index.ts` (NEW)

```typescript
export { capSchema } from './cap'
export { dropSchema } from './drop'
export { keepSchema } from './keep'
export { replaceSchema } from './replace'
export { rerollSchema } from './reroll'
export { explodeSchema } from './explode'
export { compoundSchema } from './compound'
export { penetrateSchema } from './penetrate'
export { uniqueSchema } from './unique'
export { countSuccessesSchema } from './countSuccesses'
export { multiplySchema } from './multiply'
export { plusSchema } from './plus'
export { minusSchema } from './minus'
export { multiplyTotalSchema } from './multiplyTotal'
```

---

## Part 9: Files That Don't Change

**The following stay in roller and are not affected:**

- All execution-only files in `lib/modifiers/behaviors/` — these stay in roller
- `lib/modifiers/registry.ts` — registration mechanism unchanged (only import paths change)
- `lib/modifiers/definitions/` index and individual modifier definition files — only import paths change
- All game packages — they continue to import from roller (notation becomes a transitive dep)
- `lib/modifiers/schema.ts` (ModifierBehavior, ModifierDefinition) — execution-side types
- All comparison utilities (`lib/comparison/`) — can stay or move (decision point)
- All random number generation (`lib/random/`)
- All roll execution (`lib/patterns/`, `lib/transformers/`, `roll/` except parseArguments)

---

## Part 10: Import Path Reference Quick Guide

### For HIMON during implementation:

**When moving notation files, update ALL of these import paths:**

#### In `packages/notation/src/**/*.ts` files:

- `from '../../types'` → `from './types'` (types move with them)
- `from '../../comparison'` → `from '../comparison'` (comparison moves with them)

#### In `packages/roller/src/**/*.ts` files:

- `from '../lib/notation'` → `from '@randsum/notation'`
- `from '../../lib/notation'` → `from '@randsum/notation'`
- `from '../notation/definitions'` → `from '@randsum/notation'`
- Any `from '../notation/schema'` → `from '@randsum/notation'`

#### In modifier definition files:

- `from '../../notation/definitions/xxx'` → `from '@randsum/notation'`

---

## Verification Checklist

After implementation, verify:

- [ ] `bun run typecheck` — zero errors across all packages
- [ ] `bun run test` — all tests pass (including notation tests)
- [ ] `bun run build` — both `@randsum/notation` and `@randsum/roller` build successfully
- [ ] `bun run size` — notation under 6KB, roller remains under 10KB
- [ ] `bun run lint` — no eslint errors
- [ ] `bun run format:check` — code formatted
- [ ] New package exports are correct (run quick import test)
- [ ] Game packages still build and test correctly (transitive dep)
- [ ] Component-library tests pass

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Files moving to notation | 8-9 |
| Notation schema files | 14 |
| Files changing imports in roller | 17 |
| Modifier definition files updating imports | 15 |
| Root config files changing | 3 |
| Type exports moving | 9 |
| Component-library optional changes | 3 |
| Total configuration changes | ~50-60 lines |

---

**End of briefing document.**
Ready for HIMON's implementation phase.
