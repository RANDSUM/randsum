# Design: Vegas Slot Package Filter on Die Roll

**Date:** 2026-03-08
**Status:** Approved

## Problem

Clicking the RANDSUM logo (die button) triggers slot machine animations on taglines, button labels, and the notation playground — but the package filter chips are static. They should participate in the same die-roll event.

## Design

When the `die-rolled` event fires, cycle the `is-active` class through the 4 package filter chips in a slot machine style (fast start, decelerating to a stop), then settle on a randomly chosen filter and apply it.

## Architecture

**Single file change:** `apps/site/src/pages/index.astro` — the existing vanilla JS `<script>` block.

No new files. No React conversion. No new custom events.

## Behavior

- **Trigger:** `window` event `die-rolled` (same event the logo click dispatches)
- **Animation:** 17-step deceleration using `SLOT_INTERVALS` copied from `HeroInteractive.tsx`
  - `[45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860]` ms
  - Each tick: set `is-active` on one randomly chosen chip (visual only — grid does not re-render)
- **Settlement:** Final tick calls `applyFilter(finalFilter)` — the only grid re-render
- **Selection:** True random, equal weight across all 4 filters: `all`, `core`, `game`, `tool`
- **Re-entrant safety:** Store active timeout ID; cancel and restart if `die-rolled` fires mid-animation

## Scope

~20 lines of vanilla JS added to the existing script block. No changes to:
- `HeroInteractive.tsx`
- Any CSS
- Any React components
- Any other Astro pages
