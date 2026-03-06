# Design: @randsum/component-library

**Date:** 2026-03-06
**Status:** Approved

## Goal

Extract the `RollerPlayground` component from `apps/site` into a standalone, publicly-published npm package (`@randsum/component-library`) so it can be reused across RANDSUM apps and by external consumers.

## Location

`packages/component-library/` — fits the existing `packages/*` workspace glob with no config changes.

## Directory Structure

```
packages/component-library/
  src/
    components/
      RollerPlayground/
        RollerPlayground.tsx    ← moved from apps/site, augmented with className/unstyled props
        RollerPlayground.css    ← rewritten: --randsum-* tokens with real default values baked in
        index.ts                ← re-exports RollerPlayground
    index.ts                    ← public API entry point
  package.json
  tsconfig.json
```

## Component API

```tsx
<RollerPlayground
  defaultNotation="4d6L"   // existing: initial notation value
  stackblitz={true}        // existing: show/hide StackBlitz link
  className=""             // new: appended to root div for consumer overrides
  unstyled={false}         // new: when true, skips internal CSS import entirely
/>
```

- `unstyled` defaults to `false` (styled by default)
- `className` is applied to the root `.roller-playground` div
- All existing behavior (roll, tooltip, validation, copy) unchanged

## Styling Architecture

The CSS is imported directly inside the component source (`import './RollerPlayground.css'`). Consumer bundlers (Vite, Astro, webpack) handle it as a CSS side-effect.

### Self-contained default colors

The package ships default values at `:root` level — no consumer setup required. Consumers override any token at `:root` or any ancestor selector to match their app's theme:

```css
/* packages/component-library — defaults, overrideable by consumers */
:root {
  --randsum-accent: #7c3aed;
  --randsum-accent-high: #a78bfa;
  --randsum-on-accent: #fff;
  --randsum-bg: rgba(0, 0, 0, 0.25);
  --randsum-border: rgba(255, 255, 255, 0.15);
  --randsum-text: #f0f0f0;
  --randsum-text-muted: #9ca3af;
  --randsum-invalid: #f97583;
  --randsum-success: #3fb950;
  --randsum-tooltip-bg: #1e1e2e;
  --randsum-font: system-ui, sans-serif;
  --randsum-font-mono: 'Menlo', 'Consolas', monospace;
}
```

Site override (maps Starlight tokens on top):

```css
/* apps/site — theme integration */
:root {
  --randsum-accent: var(--sl-color-accent);
  --randsum-accent-high: var(--sl-color-accent-high);
  --randsum-on-accent: var(--sl-color-black);
  --randsum-text: var(--sl-color-white);
  --randsum-text-muted: var(--sl-color-gray-3);
  --randsum-bg: rgba(0, 0, 0, 0.25);
  --randsum-font: var(--sl-font);
  --randsum-font-mono: var(--sl-font-mono);
}
```

## Build Setup

Same `bunup` pattern as existing packages, with two additions:

- `--external react` — React is a peer dependency, not bundled
- CSS import passes through as a side-effect resolved by the consumer's bundler

```json
{
  "build": "bunup --entry src/index.ts --format esm,cjs --dts --external react --minify --sourcemap external --target node --clean"
}
```

## Dependencies

| Type | Package | Version |
|------|---------|---------|
| Peer | `react` | `>=18` |
| Runtime | `@randsum/roller` | `workspace:~` |
| Dev | `@types/react` | catalog |

## Site Migration

`apps/site` changes:
1. Add `@randsum/component-library: workspace:~` to dependencies
2. Delete local `RollerPlayground.tsx`, `RollerPlayground.css`
3. Replace import: `import { RollerPlayground } from '@randsum/component-library'`
4. Add a CSS block mapping `--randsum-*` → `--sl-*` for theme integration

## What Is NOT Changing

- All existing `RollerPlayground` behavior (rolling, tooltips, StackBlitz, validation)
- The site's visual appearance (tokens mapped back to Starlight values)
- Any other packages — this is additive only
