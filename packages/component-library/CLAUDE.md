# @randsum/component-library - React UI Components

## Overview

Published React component library for interactive dice notation exploration. Provides the playground widget embedded on randsum.dev and a modifier quick-reference grid. Browser-only (no SSR).

## Dependencies

- **Peer**: `react >= 18`, `react-dom >= 18`, `@randsum/roller`, `@randsum/notation`
- **Dev**: `@randsum/display-utils` (step visualization, modifier docs, StackBlitz project builder)
- `display-utils` is a build-time dependency — its helpers (`computeSteps`, `formatAsMath`, `buildStackBlitzProject`) are bundled into the output

## Components

| Export              | Purpose                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `RollerPlayground`  | Interactive dice notation input with live rolling, token highlighting, result breakdown, and optional StackBlitz export |
| `ModifierReference` | Two-column grid of all dice notation modifiers with optional click handlers                                             |
| `Overlay`           | Generic dismissible overlay panel used internally by the playground                                                     |
| `ErrorBoundary`     | React error boundary wrapper around each component                                                                      |

### `RollerPlayground` Props

- `notation` / `defaultNotation` — controlled or uncontrolled notation string
- `size` — `'s' | 'm' | 'l'`
- `stackblitz` — show "Edit in StackBlitz" button (default `true`)
- `expanded` — force modifier reference open

### `ModifierReferenceCell` (exported type)

`{ notation: string, description: string, isCore: boolean }` — passed to `onCellClick` callbacks.

## File Structure

```
src/
  index.ts                          # Public exports
  components/
    RollerPlayground/               # Main playground widget + CSS + stories
    ModifierReference/              # Modifier grid + doc content panel
    Overlay/                        # Dismissible overlay
    ErrorBoundary/                  # Error boundary
```

Each component directory has an `index.ts` barrel, a `.tsx` implementation, and a `.css` file. Stories use Ladle (`.stories.tsx`).

## Commands

```bash
bun run --filter @randsum/component-library build       # bunup: ESM+CJS+DTS
bun run --filter @randsum/component-library test        # bun:test
bun run --filter @randsum/component-library typecheck   # tsc --noEmit
bun run --filter @randsum/component-library ladle       # Ladle dev server for stories
bun run --filter @randsum/component-library size        # Bundle size check (limit: 50KB)
```

## Conventions

- All props interfaces use `readonly` fields
- CSS is plain `.css` (no CSS modules, no Tailwind) — class names prefixed with `roller-playground-` or `modifier-reference-`
- Components are function components with inline prop types (no separate Props interfaces)
- Internal state uses discriminated unions (e.g., `PlaygroundState` with `status` discriminant)
- `not-content` class added to root elements to opt out of Starlight prose styles when embedded in the docs site

## Constraints

- No direct dependency on game packages — only roller and notation
- `display-utils` is dev-only; its code is bundled, not a runtime peer
- Must stay under 50KB bundle size limit
