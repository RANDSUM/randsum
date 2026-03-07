# Design: Modifiers Hover Tooltip in RollerPlayground

## Summary

Add a "Modifiers" button to the right of the "Code" (StackBlitz) button in `RollerPlayground`. Hovering it reveals a south-facing tooltip embedding `<ModifierReference>` as a read-only cheat sheet.

## Components Affected

- `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`
- `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

## Button

- Label: `Modifiers`
- Position: immediately after the StackBlitz "Code" button in `.roller-playground-desc-row`
- Style: matches `.roller-playground-stackblitz` (same border, font-size `0.65rem`, system-ui, muted color, hover turns blue)
- Wrapped in a `position: relative` container: `.roller-playground-modifiers-wrap`

## Tooltip

- Element: `.roller-playground-modifiers-tooltip`
- Position: `absolute; top: 100%; right: 0; margin-top: 0.25rem`
- Content: `<ModifierReference coreDisabled modifiersDisabled />` (non-interactive)
- Z-index: `10` (shell has `overflow: visible`)
- Show/hide: CSS only via `:hover` on the wrapper
  - Default: `opacity: 0; pointer-events: none; transform: translateY(-4px)`
  - On hover: `opacity: 1; pointer-events: auto; transform: translateY(0)`
  - Transition: `0.15s ease` (matches rest of file)

## Decision: Pure CSS

No React state. Hover is a presentational concern. Consistent with existing transition patterns in the file.
