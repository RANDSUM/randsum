# Vegas Slot Package Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the RANDSUM logo (die button) is clicked, the package filter chips cycle through options in a Vegas slot machine style before settling on a random filter.

**Architecture:** Add a `die-rolled` event listener to the existing vanilla JS block in `index.astro`. During animation, rapidly cycle `is-active` across chips using the same deceleration curve as the hero slot machine. On settle, call the existing `applyFilter()`. No new files.

**Tech Stack:** Vanilla JS, Astro, existing `die-rolled` custom event system

---

## Background

The `die-rolled` event is dispatched by `SpinningLogo` (in `HeroInteractive.tsx`) when the logo is clicked. It already triggers slot animations on taglines, button labels, and the notation playground. The package filter chips in `index.astro` don't participate yet.

The filter chips live in a vanilla JS `<script>` block at the bottom of `apps/site/src/pages/index.astro`. The relevant existing code:

```js
const chips = document.querySelectorAll('.pkg-filter-chip')
const grid = document.querySelector('.pkg-grid')

function applyFilter(filter) {
  chips.forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset['filter'] === filter)
  })
  // ... grid filtering logic
}
```

The `SLOT_INTERVALS` deceleration curve (from `HeroInteractive.tsx`) — copy this exactly:
```js
const SLOT_INTERVALS = [45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860]
```

---

## Task 1: Add slot machine filter animation to `index.astro`

**Files:**
- Modify: `apps/site/src/pages/index.astro` — the `<script>` block at the bottom of the file

**Step 1: Find the insertion point**

Open `apps/site/src/pages/index.astro`. Scroll to the `<script>` tag near the end. Find the line where `chips` and `applyFilter` are defined. The new code goes after all existing chip/filter logic, just before the closing `</script>` tag.

**Step 2: Add the slot machine listener**

Insert this block at the end of the script (before `</script>`):

```js
// --- Slot machine filter on die roll ---
const FILTER_SLOT_INTERVALS = [45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860]

let filterSlotTimeout = undefined

window.addEventListener('die-rolled', () => {
  if (filterSlotTimeout !== undefined) {
    clearTimeout(filterSlotTimeout)
    filterSlotTimeout = undefined
  }

  const filterValues = Array.from(chips).map(chip => chip.dataset['filter'] ?? 'all')
  const finalFilter = filterValues[Math.floor(Math.random() * filterValues.length)] ?? 'all'
  let step = 0

  const tick = () => {
    if (step < FILTER_SLOT_INTERVALS.length - 1) {
      const randomFilter = filterValues[Math.floor(Math.random() * filterValues.length)] ?? 'all'
      chips.forEach(chip => {
        chip.classList.toggle('is-active', chip.dataset['filter'] === randomFilter)
      })
      step++
      filterSlotTimeout = setTimeout(tick, FILTER_SLOT_INTERVALS[step])
    } else {
      filterSlotTimeout = undefined
      applyFilter(finalFilter)
    }
  }

  filterSlotTimeout = setTimeout(tick, FILTER_SLOT_INTERVALS[0] ?? 45)
})
```

**Step 3: Verify it works**

```bash
bun run site:dev
# Open http://localhost:4321
```

- Click the RANDSUM logo
- Confirm the filter chips cycle rapidly then settle on one of: All / Core / Games / Tools
- Confirm the package grid updates to match the settled filter
- Click again — confirm a different (or same) filter is chosen each time
- Click rapidly — confirm no broken state (re-entrant safety)

**Step 4: Commit**

```bash
git add apps/site/src/pages/index.astro
git commit -m "feat(site): Vegas slot filter cycle on die roll"
```

---

## Verification Checklist

- [ ] Clicking logo cycles filter chips in slot machine style
- [ ] Animation decelerates (fast → slow → stop), ~2.5s total
- [ ] Final filter is applied to the package grid
- [ ] All 4 filters (All, Core, Games, Tools) are possible outcomes
- [ ] Clicking during animation cancels and restarts cleanly
- [ ] Existing filter chip click behavior is unchanged
- [ ] `bun run --filter @randsum/site build` passes
