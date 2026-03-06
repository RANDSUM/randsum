# RollerPlayground Component Design

**Date:** 2026-03-06
**Branch:** jarvis/skill-roller

## Goal

Replace the static code example section on the landing page with an interactive one-line dice roller playground, embedded in the hero section above the CTA buttons.

## Placement

Inside the hero section (`apps/site/src/pages/index.astro`), between `.hero-subtitle` and `.hero-actions`. The existing `.code-example` section is removed entirely.

## Component

Single React component `RollerPlayground`, used with `client:only="react"`.

**Files:**
- Create: `apps/site/src/components/playground/RollerPlayground.tsx`
- Create: `apps/site/src/components/playground/RollerPlayground.css`
- Modify: `apps/site/src/pages/index.astro`

## Layout

```
┌────────────────────────────────────────────────────┐
│  ┌────────────────────────────────┐  ┌──────────┐  │
│  │  4d6L                          │  │  Roll    │  │
│  └────────────────────────────────┘  └──────────┘  │
│  ● Valid notation                                   │
│                                                     │
│  [14]  ← chip (tooltip on hover)                   │
└────────────────────────────────────────────────────┘
```

## States

1. **Idle** — Input pre-filled with `4d6L`, validation subtext visible
2. **Rolling** — 300ms spinner delay before chip appears (feels intentional)
3. **Result** — Chip shows total; button becomes "Reroll"; chip has tooltip on hover

## Validation subtext (live)

Uses `isDiceNotation()` from `@randsum/roller`:
- Valid: accent color, "Valid notation"
- Invalid: red, "Invalid notation"
- Empty: grey hint, "Try: 4d6L, 1d20+5, 2d8!"

## Chip behavior

- One chip at a time — reroll replaces previous result
- Enter animation: `transform: scale(0) → scale(1)` + opacity fade
- Reroll: chip briefly scales down then pops back with new value

## Tooltip

On hover, shows breakdown built from `RollRecord`:
- `description` — human-readable modifier description (e.g. "4d6 drop lowest")
- `modifierHistory.initialRolls` — raw dice before modifiers
- `modifierHistory.modifiedRolls` — dice after modifiers
- `total` — final result

Example:
```
4d6 drop lowest
────────────────
Rolled:  6  4  3  1
Kept:    6  4  3
Total:   13
```

## API used

```typescript
import { roll, isDiceNotation } from '@randsum/roller'

// Live validation
isDiceNotation(input) // boolean

// Roll on button click
const result = roll(notation)
if (!result.error) {
  result.total           // chip value
  result.rolls[0]        // RollRecord for tooltip
}
```

No Web Worker — `roll()` is synchronous and fast.

## Design notes

- Styled to blend with hero; monospace font for input and chip
- Tooltip is an absolutely-positioned div, shown on hover via React state
- Chip only appears after first roll; input row is always visible
- Component is self-contained — no shared state with rest of page
