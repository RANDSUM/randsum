# @randsum/dice-ui — RANDSUM React UI Components

## Overview

Private React component library (v2.0.0) providing dice notation UI for RANDSUM apps. Exports a
notation input with token color overlay (`TokenOverlayInput`), a roll step visualizer
(`RollSteps`/`StepRow`/`DieBadge`), result panels (`RollResultPanel`/`RollResultDisplay`), a
combined notation roller (`NotationRoller`), a quick reference grid (`QuickReferenceGrid`/`DocModal`),
and theme utilities (`useTheme`/`getTheme`/`subscribeTheme`/`DiceUIThemeProvider`).

The only runtime dependency is `@randsum/roller` (`workspace:~`). `react`, `react-dom`,
`react-native`, and `expo-haptics` are peer dependencies (the latter three optional). There is **no
build script** — `main`/`types`/`exports` resolve to `src/index.ts`, so the package is consumed
directly as TypeScript source.

Private, never published to npm.

## Platform forks

Two entry barrels expose the same public surface against platform-specific implementations:

- `src/index.ts` (web / react-dom) → `*.tsx` files.
- `src/index.native.ts` (React Native) → `*.native.tsx` files.

Most components ship both a `.tsx` and a `.native.tsx`. The Expo app maps to the native barrel via
`tsconfig` paths; web bundlers resolve `index.ts`. There is **no TUI / `ink` target** (see
`docs/adr/ADR-019`).

## Exports

```typescript
export type { RollResult, QuickReferenceGridProps, DocModalProps }
export { tokenColor }
export { useTheme, getTheme, subscribeTheme, DiceUIThemeProvider }
export { TokenOverlayInput }
export type { TokenOverlayInputProps }
export { DieBadge, StepRow, RollSteps }
export type { DieBadgeProps, StepRowProps, RollStepsProps }
export { NotationRoller }
export type { NotationRollerProps }
export { RollResultPanel, RollResultDisplay }
export type { RollResultPanelProps }
export { QuickReferenceGrid, DocModal }
```

## Directory Structure

```
packages/dice-ui/
  src/
    index.ts                  # Web public barrel
    index.native.ts           # React Native public barrel
    types.ts                  # Shared prop/result types
    useTheme.tsx              # Theme store + provider (web)
    useTheme.native.tsx       # Theme store + provider (native)
    tokenColor.ts             # Notation-token → color helper
    TokenOverlayInput.tsx     # Input with colored token spans overlaid (web)
    TokenOverlayInput.native.tsx
    TokenOverlayInput.css
    RollSteps.tsx             # DieBadge, StepRow, RollSteps (web)
    RollSteps.native.tsx
    RollSteps.css
    RollResultPanel.tsx       # RollResultPanel + RollResultDisplay (web)
    RollResultPanel.native.tsx
    NotationRoller.tsx        # Full roller: input + roll button + result (web)
    NotationRoller.native.tsx
    NotationRoller.css
    NumericStepper.tsx        # +/- stepper (web) / .native.tsx
    QuickReferenceGrid.tsx    # Notation reference grid + DocModal (web)
    QuickReferenceGrid.native.tsx
    notationBuilder.ts        # Notation assembly helper
    tokens.css                # CSS custom-property tokens (colors, spacing)
```

## Component Notes

- **`NotationRoller`** — main combined component. Input + roll button + a result panel rendered via
  `RollResultDisplay`.
- **`TokenOverlayInput`** — wraps an `<input>` with a positioned overlay of colored `<span>`s for
  tokenized notation segments. Used inside `NotationRoller`.
- **`RollSteps`** — renders a list of `StepRow`s showing each step of a roll. `DieBadge` renders an
  individual die face value.
- **`QuickReferenceGrid`** — grid of notation examples; `DocModal` shows per-entry docs.
- **`useTheme`** — subscribes to a module-level `'light' | 'dark'` theme store; `getTheme()` /
  `subscribeTheme()` for imperative access; `DiceUIThemeProvider` for context wrapping.

## Commands

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test __tests__
bun run check       # typecheck + test
```

## Key Constraints

- No build script — consumed as TypeScript source, not a built artifact.
- Private, never published to npm.
- Web and native implementations must stay in sync on the shared public surface (both barrels export
  the same names).
- CSS files are imported alongside their web component file (e.g. `import './NotationRoller.css'`);
  native variants use React Native styles instead.
- Props interfaces use `readonly` fields (strict mode convention).
