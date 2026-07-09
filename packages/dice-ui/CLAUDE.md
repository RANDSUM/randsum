# @randsum/dice-ui — RANDSUM React UI Components

## Overview

Private React component library (v2.0.0) providing dice notation UI for RANDSUM apps. The public
barrel exports a combined notation roller (`NotationRoller`) and the result panels
(`RollResultPanel`/`RollResultDisplay`) that render a roll's steps, plus the `RollResult` payload
type. The supporting pieces — a token-overlay input (`TokenOverlayInput`), a roll-step visualizer
(`RollSteps`/`StepRow`/`DieBadge`), a theme store (`useTheme`/`getTheme`/`subscribeTheme`), and the
`tokenColor` helper — remain internal modules imported by those components, not re-exported.

The only runtime dependency is `@randsum/roller` (`workspace:~`). `react` and `react-dom` are peer
dependencies (`react-dom` optional). There is **no build script** — `main`/`types`/`exports` resolve
to `src/index.ts`, so the package is consumed directly as TypeScript source.

Private, never published to npm.

## Render target

Web only (`react-dom`) — `src/index.ts` → the `.tsx` components. There is **no React Native target**
and **no TUI / `ink` target** (see `docs/adr/ADR-019`).

## Exports

```typescript
export type { RollResult }
export { NotationRoller }
export type { NotationRollerProps }
export { RollResultPanel, RollResultDisplay }
export type { RollResultPanelProps }
```

The barrel is scoped to exactly what `apps/site` imports. `TokenOverlayInput`, `RollSteps`
(`StepRow`/`DieBadge`), `useTheme`/`getTheme`/`subscribeTheme`/`DiceUIThemeProvider`, and
`tokenColor` are internal modules — still tested directly under `__tests__/` but no longer part of
the public surface.

## Directory Structure

```
packages/dice-ui/
  src/
    index.ts                  # Public barrel (NotationRoller, result panels, RollResult)
    types.ts                  # RollResult type
    useTheme.tsx              # Theme store + provider (internal)
    tokenColor.ts             # Notation-token → color helper (internal)
    TokenOverlayInput.tsx     # Input with colored token spans overlaid (internal)
    TokenOverlayInput.css
    RollSteps.tsx             # DieBadge, StepRow, RollSteps (internal)
    RollSteps.css
    RollResultPanel.tsx       # RollResultPanel + RollResultDisplay
    NotationRoller.tsx        # Full roller: input + roll button + result
    NotationRoller.css
    tokens.css                # CSS custom-property tokens (colors, spacing)
```

## Component Notes

- **`NotationRoller`** — main combined component. Input + roll button + a result panel rendered via
  `RollResultDisplay`.
- **`TokenOverlayInput`** — wraps an `<input>` with a positioned overlay of colored `<span>`s for
  tokenized notation segments. Used inside `NotationRoller`.
- **`RollSteps`** — renders a list of `StepRow`s showing each step of a roll. `DieBadge` renders an
  individual die face value. `RollResultPanel`/`RollResultDisplay` reuse `StepRow` directly.
- **`useTheme`** — subscribes to a module-level `'light' | 'dark'` theme store; `getTheme()` /
  `subscribeTheme()` for imperative access; `DiceUIThemeProvider` for context wrapping.

## Commands

```bash
bun run typecheck      # tsc --noEmit
bun run lint           # eslint
bun run format:check   # biome format .
bun run test           # bun test __tests__
bun run check          # typecheck + format:check + lint + test
```

## Key Constraints

- No build script — consumed as TypeScript source, not a built artifact.
- Private, never published to npm.
- CSS files are imported alongside their component file (e.g. `import './NotationRoller.css'`).
- Props interfaces use `readonly` fields (strict mode convention).
