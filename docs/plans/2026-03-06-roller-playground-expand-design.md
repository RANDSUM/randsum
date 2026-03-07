# RollerPlayground Expand-on-Click — Design

Date: 2026-03-06

## Summary

When the result chip is clicked, the playground expands inline to show the full roll breakdown (currently displayed only in a hover tooltip). The chip becomes a close button when expanded, and the hover tooltip is removed.

## State

Add `expanded: boolean` tracked alongside `PlaygroundState`. Only meaningful when `status === 'result'`. Reset to `false` on new roll or notation change.

## Chip Behavior

| State | Hover | Click |
|---|---|---|
| Result, not expanded | Show "open" icon overlay | Expand panel |
| Result, expanded | — | Collapse panel (show `×` icon) |
| idle / rolling | — | — |

- Remove `showTooltip` / copy-to-clipboard behavior entirely
- The floating `.roller-playground-tooltip` is removed
- Chip value: total number (collapsed) or `×` (expanded)
- Hover class toggles an icon overlay via CSS; no JS state needed for hover

## Expanded Panel

A `roller-playground-expand` element renders below the desc-row, inside the shell.

Animation: CSS `grid-template-rows: 0fr → 1fr` on a grid wrapper, with `overflow: hidden` on the inner div. Transition: `0.25s ease`.

Content:
- `<RollTooltip>` — notation, description, modifier steps (reuse existing component)
- Total row at the bottom (matching the tooltip's existing total row style)
- Border-top separator from the desc-row
- Reuses `.roller-tooltip-*` styles; no box-shadow/border-radius since it is embedded

## Desc-Row Changes

When expanded:
- Notation description text fades out (`opacity: 0`, `pointer-events: none`) via CSS transition
- StackBlitz button remains visible and functional

## Removed

- `showTooltip` state
- `chipDir` state and `tooltipDir()` helper
- `copyTimerRef` and copy-to-clipboard logic
- `.roller-playground-tooltip` and related CSS
- `onMouseEnter` / `onMouseLeave` handlers on chip
