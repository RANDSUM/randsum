# Plan: Extract Notation Parser into `@randsum/notation`

## Context

The user asked: **"What would our code look like if we extracted the notation parser into its own package?"** — no actual changes, just an architectural analysis.

The motivation: the notation layer (`packages/roller/src/lib/notation/`) is already the source of truth for modifier identity (name, priority, pattern, parse, toNotation, toDescription). Game packages and the component library currently import only from `@randsum/roller`, but they might benefit from accessing notation without pulling in all roll-execution logic.

---

## Current Architecture

```
packages/roller/src/lib/notation/
├── schema.ts           # NotationSchema<T> type + defineNotationSchema()
├── definitions/        # 16 modifier schemas (cap, drop, reroll, etc.)
├── notationToOptions.ts
├── singleNotationToOptions.ts
├── listOfNotations.ts
└── suggestions.ts

packages/roller/src/lib/modifiers/
├── schema.ts           # ModifierBehavior<T>, ModifierDefinition<T>
├── registry.ts         # defineModifier(), two Maps (registry + notationRegistry)
├── behaviors/          # 16 apply/validate implementations
└── definitions/        # thin combiners: defineModifier(schema, behavior)
```

**Key type-level entanglement:**
`NotationSchema<T>` currently has `name: keyof ModifierOptions` — it references roller's core type. The `parse` return type is `Partial<ModifierOptions>`. These two fields create the type dependency that makes separation non-trivial.

---

## The Core Problem: Type Ownership

To make `@randsum/notation` a standalone package, it needs to either:

**A) Own the shared types** — `ModifierOptions`, `ComparisonOptions`, etc. move to notation. Roller imports them from notation. *(Cleanest long-term)*

**B) Use generics** — `NotationSchema<TName extends string, TOptions>` with no hardcoded reference to `ModifierOptions`. Roller constrains the generics. *(Most flexible)*

**C) Duplicate/redefine types** — Notation defines its own parallel option types; roller has an adapter layer. *(Most friction, not recommended)*

**Recommended: Option A** — notation becomes the foundational layer that defines option shapes; roller adds execution semantics on top.

---

## Proposed Package Structure

### New Package: `packages/notation/`

**Version:** `@randsum/notation` will start at `3.0.0` to stay in sync with the rest of the `@randsum` API.

```
packages/notation/
├── package.json          # name: @randsum/notation, version: 3.0.0, zero deps
├── src/
│   ├── index.ts          # public API
│   ├── types.ts          # ModifierOptions, ComparisonOptions, DropOptions, etc.
│   │                     # (moved from packages/roller/src/types.ts, modifier-related subset)
│   ├── schema.ts         # NotationSchema<T>, defineNotationSchema()
│   ├── definitions/      # all 16 modifier notation schemas (unchanged content)
│   │   ├── index.ts
│   │   ├── cap.ts
│   │   ├── drop.ts
│   │   ├── reroll.ts
│   │   └── ... (14 more)
│   ├── parse/
│   │   ├── notationToOptions.ts
│   │   ├── singleNotationToOptions.ts
│   │   └── listOfNotations.ts
│   └── suggestions.ts
└── __tests__/
    └── (notation-specific tests, currently scattered in roller/__tests__/)
```

### `@randsum/notation` Public API

```typescript
// Types (moved from roller)
export type { ModifierOptions, ComparisonOptions, DropOptions, RerollOptions, ... }

// Schema
export type { NotationSchema }
export { defineNotationSchema }

// Parsing
export { notationToOptions }
export { listOfNotations }
export { isDiceNotation }          // moved from roller
export { validateNotation }        // moved from roller (notation-level validation)

// All 16 schemas (for roller and component-library to register/inspect)
export { capSchema, dropSchema, rerollSchema, ... }
```

### Dependency Graph Changes

**Before:**
```
@randsum/roller (zero deps)
  └── all game packages + component-library
```

**After:**
```
@randsum/notation (zero deps)        ← new foundation
  └── @randsum/roller                ← adds execution semantics
        └── all game packages + component-library
```

**Component-library gains a new option:**
```typescript
// Before: had to import from roller to get isDiceNotation
import { isDiceNotation } from '@randsum/roller'

// After: can import from lighter notation package
import { isDiceNotation } from '@randsum/notation'
```

---

## Key File-Level Changes

### Files That Move (content unchanged, path changes)

| Current location | New location |
|---|---|
| `roller/src/lib/notation/schema.ts` | `notation/src/schema.ts` |
| `roller/src/lib/notation/definitions/*.ts` | `notation/src/definitions/*.ts` |
| `roller/src/lib/notation/notationToOptions.ts` | `notation/src/parse/notationToOptions.ts` |
| `roller/src/lib/notation/singleNotationToOptions.ts` | `notation/src/parse/singleNotationToOptions.ts` |
| `roller/src/lib/notation/listOfNotations.ts` | `notation/src/parse/listOfNotations.ts` |
| `roller/src/lib/notation/suggestions.ts` | `notation/src/suggestions.ts` |
| `roller/src/isDiceNotation.ts` | `notation/src/isDiceNotation.ts` |
| *subset of* `roller/src/types.ts` | `notation/src/types.ts` |

### Files That Change in Roller

**`packages/roller/package.json`:**
```json
{
  "dependencies": {
    "@randsum/notation": "workspace:~"
  }
}
// Note: roller would gain ONE dependency (its own sibling package)
```

**`packages/roller/src/types.ts`:**
- Remove modifier option types (moved to notation)
- Re-export from `@randsum/notation` to preserve public API surface

**15 modifier definition files** (`src/lib/modifiers/definitions/*.ts`):
```typescript
// Before:
import { capSchema } from '../../notation/definitions/cap'

// After:
import { capSchema } from '@randsum/notation'
```

**`src/lib/modifiers/schema.ts`:**
```typescript
// Before:
import type { NotationSchema } from '../notation/schema'

// After:
import type { NotationSchema } from '@randsum/notation'
```

**`src/lib/modifiers/registry.ts`:**
```typescript
// Before:
import type { NotationSchema } from '../notation/schema'

// After:
import type { NotationSchema } from '@randsum/notation'
```

**`src/roll/parseArguments.ts`, `src/validateNotation.ts`:**
```typescript
// Before:
import { notationToOptions } from '../lib/notation'

// After:
import { notationToOptions } from '@randsum/notation'
```

### Registry Coordination (Unchanged Architecture)

The two-registry pattern in `modifiers/registry.ts` **stays identical** — no redesign needed. The `notationRegistry` is populated by `defineModifier()` which is called by each modifier definition file. Those files now import their schemas from `@randsum/notation` instead of a local path, but the registration call site doesn't change.

---

## What Doesn't Change

- The `ModifierBehavior<T>` type stays in roller (it's execution-only)
- `ModifierDefinition<T> = NotationSchema<T> & ModifierBehavior<T>` stays in roller
- The `defineModifier(schema, behavior)` function stays in roller
- All game packages (`@randsum/fifth`, etc.) — they depend on roller, notation becomes a transitive dep
- `roll()` function, random, patterns — all stay in roller
- Bundle size: both roller and notation remain zero-dep from npm's perspective

---

## Size-Limit Consideration

Adding `@randsum/notation` to the size-limit config would be appropriate:
```json
{ "path": "packages/notation/dist/index.js", "limit": "6 KB" }
```
The notation layer is currently ~3-4KB of the roller bundle.

---

## Is It Worth Doing?

**Arguments for:**
- Component-library can import `isDiceNotation`, `validateNotation` without roller's execution logic
- Opens the door to other parsers (e.g. a Foundry VTT module) using notation without rolling
- Cleaner separation of concerns in the architecture

**Arguments against:**
- Roller is already zero-dep and small (10KB limit)
- Game packages wouldn't benefit (they need roller anyway)
- Adds a workspace dep to manage (versions, build order)
- The notation layer is already decoupled internally — the win is organizational, not technical

**Verdict:** A reasonable but non-urgent refactor. The architecture already supports it cleanly; the main work is moving ~8 files and updating imports in ~20 files.

---

## Verification (If Implemented)

1. `bun run typecheck` — zero errors across all packages
2. `bun run test` — all 915+ tests pass
3. `bun run size` — notation under 6KB, roller stays under 10KB
4. `bun run build` — both packages produce valid dist/
5. `bun run check:exports` — no orphaned exports
