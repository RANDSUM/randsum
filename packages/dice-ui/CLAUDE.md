# @randsum/dice-ui — RANDSUM React UI Components

## Overview

Private React component library providing dice notation UI for RANDSUM apps. Exports three main components — a notation input with token color overlay (`TokenOverlayInput`), a roll step visualizer (`RollSteps`/`StepRow`/`DieBadge`), and a combined notation roller with result display (`NotationRoller`). Also exports a theme utility (`useTheme`, `getTheme`, `subscribeTheme`).

Depends on `@randsum/roller` via `workspace:~`. Peer dependencies on React and React DOM. Has no build script — consumed directly as TypeScript source by the playground app via path aliases or direct imports.

Private, never published to npm.

## Exports

```typescript
// Theme
export { useTheme, getTheme, subscribeTheme }

// Notation input with token color overlay
export { TokenOverlayInput }
export type { TokenOverlayInputProps }

// Roll step visualizer
export { DieBadge, StepRow, RollSteps }
export type { DieBadgeProps, StepRowProps, RollStepsProps }

// Combined roller + result display
export { NotationRoller, RollResultDisplay }
export type { NotationRollerProps }
```

## Directory Structure

```
packages/dice-ui/
  src/
    index.ts                  # Public exports
    useTheme.ts               # Theme (light/dark) reactive utility
    TokenOverlayInput.tsx     # Input with colored token spans overlaid
    TokenOverlayInput.css
    RollSteps.tsx             # DieBadge, StepRow, RollSteps components
    RollSteps.css
    NotationRoller.tsx        # Full roller: input + roll button + result overlay
    NotationRoller.css
    tokens.css                # CSS custom property tokens (colors, spacing)
```

## Component Notes

**`NotationRoller`** — the main combined component. Accepts `defaultNotation`, controlled `notation`+`onChange`, `renderActions` render prop for custom toolbar content, and a `resetToken` for resetting controlled state. Shows a result overlay on roll with `RollResultDisplay`.

**`TokenOverlayInput`** — wraps an `<input>` with a positioned overlay of colored `<span>` elements corresponding to tokenized notation segments. Used inside `NotationRoller`.

**`RollSteps`** — renders a list of `StepRow` elements showing each step of a `traceRoll()` result. `DieBadge` renders an individual die face value.

**`useTheme`** — subscribes to a module-level theme store (`'light' | 'dark'`). `getTheme()` / `subscribeTheme()` for external control.

## Key Constraints

- No build script — the package is consumed as source, not a built artifact.
- Private, never published to npm.
- CSS files must be imported alongside their component file (e.g. `import './NotationRoller.css'`).
- All props interfaces use `readonly` on their fields (strict mode convention).
