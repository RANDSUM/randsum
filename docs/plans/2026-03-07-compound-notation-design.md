# Compound Notation in RollerPlayground

**Date:** 2026-03-07
**Status:** Approved

## Problem

The RollerPlayground does not handle compound dice notation (e.g., `1d20 + 1d8`). The tokenizer misidentifies the second pool as an arithmetic modifier, and the result overlay only displays the first roll record.

## What Already Works

- `isDiceNotation("1d6+1d20")` returns `true` — the roller's pattern strips both cores and finds nothing remaining.
- `roll("1d6+1d20")` returns `result.rolls` as an array — one `RollRecord` per pool, already separated by the engine.
- `validateNotation` correctly parses compound expressions.

## Root Cause

`tokenize("1d6+1d20")` calls `parseFrom` with remaining string `+1d20`. The `plus` modifier pattern `/^\+\d+/` matches `+1`, leaving `d20` as an unknown token. The tokenizer lacks a pre-check for new dice pools.

## Changes

### 1. `tokenize.ts` — Recognize second dice pool before modifiers

In `parseFrom()`, before the MODIFIERS loop, check if the remaining string starts with `/^[+-]\d+[Dd]\d+/`. If it matches, push it as a second `'core'` token.

- `describeCoreToken()` already handles the optional `[+-]` prefix.
- Correct tokenization of `1d6+1d20L+5`:
  - `core: "1d6"` → "Roll 1 6-sided die"
  - `core: "+1d20"` → "Roll 1 20-sided die"
  - `dropLowest: "L"` → "Drop lowest"
  - `plus: "+5"` → "+5"

### 2. `RollerPlayground.tsx` — Store all roll records

Change the `PlaygroundState` result variant:

```ts
// before
{ status: 'result'; total: number; record: RollRecord }

// after
{ status: 'result'; total: number; records: readonly RollRecord[] }
```

In `handleRoll`, store `result.rolls` (the full array) instead of `result.rolls[0]`.

### 3. Result overlay — Multi-pool layout

- **Single pool:** unchanged — existing `RollTooltip` behavior.
- **Multiple pools:** render a labeled section per pool using `record.notation` as the heading, each with its own `computeSteps()` output, followed by a shared "Total" row.

```
┌─────────────────────────────┐
│ 1d6                         │
│   Rolled              [4]   │
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
│ +1d20L                      │
│   Rolled    [12, 7, 3, 19]  │
│   Drop lowest     [~~3~~]   │
│   Final rolls  12 + 7 + 19  │
├─────────────────────────────┤
│ Total                  42   │
└─────────────────────────────┘
```

Pool labels use `record.notation` from each `RollRecord`.

## Files Changed

| File | Change |
|------|--------|
| `packages/component-library/src/components/RollerPlayground/tokenize.ts` | Add new-pool check before MODIFIERS loop in `parseFrom()` |
| `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx` | State: `record` → `records`; store all `result.rolls`; multi-pool result overlay |

## Out of Scope

- Subtraction between pools (e.g., `1d20 - 1d4`) — the roller already handles this via `arithmetic: 'subtract'` on the second pool's parameters.
- Controlled `notation` prop — not affected; compound notation works the same way.
