# @randsum/dice-ui — RANDSUM React UI Components

## Overview

Private React component library (v2.0.0) providing dice notation UI for RANDSUM apps. Exports a
notation input with token color overlay (`TokenOverlayInput`), a roll step visualizer
(`RollSteps`/`StepRow`/`DieBadge`), result panels (`RollResultPanel`/`RollResultDisplay`), a
combined notation roller (`NotationRoller`), a quick reference grid (`QuickReferenceGrid`/`DocModal`),
and theme utilities (`useTheme`/`getTheme`/`subscribeTheme`/`DiceUIThemeProvider`).

The only runtime dependency is `@randsum/roller` (`workspace:~`). `react` and `react-dom` are peer
dependencies (`react-dom` optional). There is **no build script** — `main`/`types`/`exports` resolve
to `src/index.ts`, so the package is consumed directly as TypeScript source.

Private, never published to npm.

## Render target

Web only (`react-dom`) — `src/index.ts` → the `.tsx` components. There is **no React Native target**
and **no TUI / `ink` target** (see `docs/adr/ADR-019`).

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
    index.ts                  # Public barrel
    types.ts                  # Shared prop/result types
    useTheme.tsx              # Theme store + provider
    tokenColor.ts             # Notation-token → color helper
    TokenOverlayInput.tsx     # Input with colored token spans overlaid
    TokenOverlayInput.css
    RollSteps.tsx             # DieBadge, StepRow, RollSteps
    RollSteps.css
    RollResultPanel.tsx       # RollResultPanel + RollResultDisplay
    NotationRoller.tsx        # Full roller: input + roll button + result
    NotationRoller.css
    QuickReferenceGrid.tsx    # Notation reference grid + DocModal
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
- CSS files are imported alongside their component file (e.g. `import './NotationRoller.css'`).
- Props interfaces use `readonly` fields (strict mode convention).
