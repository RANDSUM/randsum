# NotationRoller Refactor Design Spec

## Overview

Rename `RollerPlayground` to `NotationRoller` and simplify it from a feature-heavy playground into a focused notation input with inline result display. Remove all modifier reference UI, size variants, and StackBlitz integration. Add a floating result tooltip and a "See in Playground" link to `playground.randsum.dev`.

## Motivation

The current `RollerPlayground` component carries significant complexity that serves the standalone playground app but not the embedded use case (docs pages, landing page hero). The modifier overlay, expandable section, chip results, and StackBlitz integration add ~20KB of CSS and substantial JSX that obscure the core value: type notation, see results. The playground app (`apps/playground/`) already provides the full-featured experience — the embedded component should be a lightweight entry point that links to it.

## Component API

### Before

```typescript
function RollerPlayground(props: {
  stackblitz?: boolean          // show StackBlitz button
  defaultNotation?: string      // initial notation (uncontrolled)
  notation?: string             // controlled notation
  className?: string
  size?: 's' | 'm' | 'l'       // layout size variant
  expanded?: boolean            // force modifier reference open
}): React.JSX.Element
```

### After

```typescript
function NotationRoller(props: {
  defaultNotation?: string      // initial notation (uncontrolled)
  notation?: string             // controlled notation
  className?: string
}): React.JSX.Element
```

**Removed props:**
- `stackblitz` — replaced by always-visible "See in Playground" link
- `size` — single responsive size, no variants
- `expanded` — no modifier reference to expand

## Component Behavior

### Input

- Plain textarea (no `roll('')` code prefix/suffix)
- Syntax-highlighted token overlay preserved (all 14+ token type classes)
- Validation states preserved: empty shell, valid (purple border), invalid (red border)
- Controlled and uncontrolled modes via `notation`/`defaultNotation` props

### Rolling

- 300ms artificial delay preserved for UX feedback ("rolling" state)
- Roll triggered by Roll button (existing behavior)

### Result Display

- **Floating tooltip** overlaid on the notation input with natural/intrinsic width
- Notation input blurs behind the tooltip (CSS `filter: blur()`)
- Tooltip content: total value + step breakdown using `computeSteps()` from `@randsum/display-utils` (renders per-step dice with add/remove/unchanged states) and `formatAsMath()` for the final arithmetic expression. No new display logic needed — the existing functions produce the full breakdown.
- Tooltip dismisses when: user edits notation, user rolls again (replaces tooltip content), or user clicks outside the tooltip
- Rolling again while tooltip is visible replaces the tooltip content in-place (no dismiss-then-re-roll cycle)

### "See in Playground" Button

- Always visible (replaces conditional StackBlitz button)
- Opens `playground.randsum.dev?notation=<encoded-value>` in a new tab (`target="_blank"`)
- Uses `?notation=` query param (distinct from the playground's session `?n=` param — avoids triggering session persistence for drive-by visitors from the docs)

## Playground App Changes

### New `?notation=` Query Param

`apps/playground/` must accept a `?notation=<value>` query param that:
- Seeds the notation input on mount (same as `?n=` behavior)
- Does NOT create a session (unlike `?n=` which ties into session persistence)
- Takes precedence over `?n=` if both are present

The existing `?n=` param and session management are unchanged.

## Component-Library Cleanup

### Removed Exports

Remove from `packages/component-library/src/index.ts`:
- `ModifierReference` component and `ModifierReferenceCell` type
- `Overlay` component

Delete the source files if no other internal consumers exist:
- `src/components/ModifierReference/`
- `src/components/Overlay/`

### Removed Internal Code

From the renamed `NotationRoller` component, remove:
- Modifier reference grid and its data
- Expandable overlay section
- Chip-style result display
- StackBlitz project builder (`buildStackBlitzProject` and related)
- Size variant CSS custom properties and size-dependent styles
- `roll('')` code prefix/suffix text rendering

### CSS Simplification

The current `RollerPlayground.css` is ~31KB. Expected removals:
- All modifier overlay styles
- Expand panel transitions
- Chip result styles
- Size variant properties (`--rp-max-width`, `--rp-row-height`, etc. per size)
- StackBlitz button styles

New additions:
- Floating tooltip positioning (absolute, z-index)
- Input blur filter state
- Tooltip entrance/exit transition

Rename file to `NotationRoller.css`.

## Consumer Updates

### `apps/site/src/components/HeroInteractive.tsx`

- Update import: `RollerPlayground` -> `NotationRoller`
- Remove any `stackblitz`, `size`, or `expanded` props from usage

### `apps/site/src/pages/index.astro`

- Update any references to the old component name in class names or comments

### MDX Documentation Pages (~15 files)

All files in `apps/site/src/content/docs/` that import `RollerPlayground`:
- Update import name to `NotationRoller`
- Remove `stackblitz`, `size`, `expanded` props from usage
- `defaultNotation` and `client:only="react"` remain unchanged

Known files:
- `notation/randsum-dice-notation.mdx` (~10 instances)
- `roller/modifiers.mdx` (~20 instances — highest density consumer)
- `roller/getting-started.mdx` (3 instances)
- `roller/error-handling.mdx` (1 instance)
- `roller/roll-options.mdx`
- `roller/introduction.mdx`
- `welcome/introduction.mdx` (1 instance)
- `tools/component-library.mdx`

**Implementation note:** Use a project-wide grep for `RollerPlayground` to catch any unlisted consumers. The list above is best-effort — the grep is authoritative.

### Stories

- Rename `RollerPlayground.stories.tsx` to `NotationRoller.stories.tsx`
- Update story content (remove size variants story, simplify to Default only)

### Smoke Test

- Update `packages/component-library/__tests__/dist.smoke.test.ts`
- Verify `NotationRoller` is exported (not `RollerPlayground`)
- Verify `ModifierReference` and `Overlay` are NOT exported

## File Inventory

### New/Renamed Files
- `src/components/NotationRoller/NotationRoller.tsx` (renamed from `RollerPlayground.tsx`)
- `src/components/NotationRoller/NotationRoller.css` (renamed from `RollerPlayground.css`, heavily reduced)
- `src/components/NotationRoller/NotationRoller.stories.tsx` (renamed, simplified)
- `src/components/NotationRoller/index.ts` (updated export name)

### Deleted Files
- `src/components/ModifierReference/` (entire directory)
- `src/components/Overlay/` (entire directory)
- `src/components/RollerPlayground/` (entire directory, replaced by NotationRoller)

### Modified Files
- `packages/component-library/src/index.ts` (update exports)
- `packages/component-library/__tests__/dist.smoke.test.ts`
- `apps/site/src/components/HeroInteractive.tsx`
- `apps/site/src/pages/index.astro`
- `apps/site/src/styles/custom.css` (update any `RollerPlayground` CSS rules/comments)
- ~8 MDX files in `apps/site/src/content/docs/`
- `apps/playground/src/components/PlaygroundApp.tsx` (add `?notation=` param handling)

## Testing Strategy

- Component-library smoke test: verify `NotationRoller` export, verify `ModifierReference`/`Overlay` removed
- Manual verification: notation input, syntax highlighting, validation states, roll + result tooltip, blur effect, "See in Playground" link
- Playground app: verify `?notation=` param seeds input without creating session
- Bundle size: expect significant reduction from 50KB limit (removing ~20KB of modifier CSS + overlay JS)

## Out of Scope

- No changes to `@randsum/roller` or `@randsum/display-utils`
- No changes to the playground app's session management or `?n=` param behavior
- No new component-library exports
- No new dependencies
