# @randsum/display-utils - UI Display Utilities

## Overview

Internal package providing UI display utilities for the RANDSUM ecosystem. Consumed by `@randsum/component-library` (React browser code) and the RANDSUM CLI. Not a general-purpose library — it exists to share display logic across RANDSUM UI surfaces without duplicating it.

Built targeting the browser environment (`bunup` target: `browser`). Externals `@randsum/roller` — consumers must have it installed.

## Public API

### `computeSteps(record: RollRecord): readonly TooltipStep[]`

Takes a single `RollRecord` (from `roll().rolls[n]`) and returns an ordered array of `TooltipStep` values describing each transformation applied to the dice pool.

Steps are built by walking `record.modifierLogs`:
- Arithmetic modifiers (`plus`, `minus`, `multiply`, `multiplyTotal`) produce `kind: 'arithmetic'` steps
- `drop`/`keep` modifiers with both `lowest` and `highest` in one log entry are split into two separate `kind: 'rolls'` steps
- All other modifiers produce a single `kind: 'rolls'` step
- If any modifier steps were emitted, a `kind: 'finalRolls'` step is appended at the end

`TooltipStep` discriminated union:
- `{ kind: 'rolls'; label: string; unchanged: readonly number[]; removed: readonly number[]; added: readonly number[] }`
- `{ kind: 'divider' }`
- `{ kind: 'arithmetic'; label: string; display: string }`
- `{ kind: 'finalRolls'; rolls: readonly number[]; arithmeticDelta: number }`

Also exports `formatAsMath(rolls, delta?)` — formats a number array as a space-separated math expression string.

### `MODIFIER_DOCS`

`Readonly<Record<string, ModifierDoc>>` — static documentation for every RANDSUM dice modifier. Keys are the notation shorthand (e.g. `'R{..}'`, `'!'`, `'L'`, `'xDN'`).

`ModifierDoc` shape:
```typescript
interface ModifierDoc {
  readonly title: string
  readonly description: string
  readonly displayBase: string
  readonly displayOptional?: string
  readonly forms: readonly { readonly notation: string; readonly note: string }[]
  readonly comparisons?: readonly { readonly operator: string; readonly note: string }[]
  readonly examples: readonly { readonly notation: string; readonly description: string }[]
}
```

Covers 16 modifiers: `xDN`, `L`, `H`, `K`, `KL`, `D{..}`, `!`, `!!`, `!p`, `U`, `V{..}`, `S{..}`, `**`, `*`, `-`, `+`, `C{..}`, `R{..}`.

### `buildStackBlitzProject(notation: string): StackBlitzProject`

Generates a StackBlitz-compatible project object for the given dice notation. The resulting `files` map contains `index.ts` (a runnable script calling `roll()`) and `package.json` (with `@randsum/roller` as a dependency). Intended to be passed directly to `@stackblitz/sdk`'s `openProject` or `embedProject`.

`StackBlitzProject` shape:
```typescript
interface StackBlitzProject {
  readonly title: string
  readonly description: string
  readonly template: string
  readonly files: Readonly<Record<string, string>>
}
```

## Internal Helpers (not exported)

- `ARITHMETIC_MODIFIERS` — maps modifier key → `{ label, sign }` for arithmetic step rendering
- `numVal(opts, key)` — safely extracts a numeric value from an unknown record
- `formatComparison(opts)` — formats comparison operator options as a human-readable string
- `modifierLabel(modifier, options)` — builds a display label for a modifier step
- `applyRemove(pool, values)` — mutatively removes values from a pool array (one-at-a-time by index)

## Source Layout

```
src/
  index.ts          - Re-exports everything public
  computeSteps.ts   - computeSteps, formatAsMath, TooltipStep, internal helpers
  modifierDocs.ts   - MODIFIER_DOCS, ModifierDoc
  stackblitz.ts     - buildStackBlitzProject, StackBlitzProject
```

## Testing

No tests currently exist for this package. If adding tests, use `bun:test`:

```typescript
import { describe, expect, test } from 'bun:test'
import { computeSteps } from '../src/computeSteps'
```

Place test files in `__tests__/` with `.test.ts` extension.

## Dependencies

- `@randsum/roller` (`workspace:~`) — peer/runtime dependency for `RollRecord` type and dice engine
