# Modifiers Hover Tooltip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Modifiers" button next to the "Code" button in RollerPlayground that reveals an embedded `<ModifierReference>` cheat sheet in a south-facing CSS hover tooltip.

**Architecture:** Pure CSS hover — a `position: relative` wrapper div holds the button and an absolutely-positioned tooltip below it. No React state. The tooltip embeds `<ModifierReference>` in read-only (disabled) mode. Show/hide via opacity + pointer-events transition on wrapper `:hover`.

**Tech Stack:** React (JSX), CSS custom properties (existing `--rp-*` tokens), `ModifierReference` component from the same package.

---

### Task 1: Add the "Modifiers" button and tooltip JSX

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`

**Step 1: Add the `ModifierReference` import**

Near the top of the file, after the existing imports, add:

```typescript
import { ModifierReference } from '../ModifierReference'
```

**Step 2: Locate the StackBlitz button block**

Find this block in `RollerPlayground.tsx` (around line 236–254):

```tsx
{stackblitz && (
  <button
    className="roller-playground-stackblitz"
    onClick={() => { openInStackBlitz(notation) }}
    aria-label="Open in StackBlitz"
  >
    <svg ...>...</svg>
    Code
  </button>
)}
```

**Step 3: Add the Modifiers button + tooltip wrapper immediately after the StackBlitz block (before the closing `</div>` of `.roller-playground-desc-row`)**

```tsx
<div className="roller-playground-modifiers-wrap">
  <button
    className="roller-playground-stackblitz roller-playground-modifiers-btn"
    type="button"
    aria-label="Show modifier reference"
  >
    Modifiers
  </button>
  <div className="roller-playground-modifiers-tooltip" role="tooltip">
    <ModifierReference coreDisabled modifiersDisabled />
  </div>
</div>
```

**Step 4: Verify the file compiles**

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

**Step 5: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx
git commit -m "feat(component-library): add Modifiers button with ModifierReference tooltip JSX"
```

---

### Task 2: Add CSS for the wrapper, button variant, and tooltip

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

**Step 1: Add styles at the end of the file**

Append the following after the last rule in `RollerPlayground.css`:

```css
/* ===== Modifiers hover tooltip ===== */
.roller-playground-modifiers-wrap {
  position: relative;
  flex-shrink: 0;
}

/* The button inherits all .roller-playground-stackblitz styles.
   This class only overrides what differs (nothing yet — kept for future). */
.roller-playground-modifiers-btn {
  /* intentionally empty — shares stackblitz button style */
}

.roller-playground-modifiers-tooltip {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 10;
  min-width: 16rem;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-4px);
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.roller-playground-modifiers-wrap:hover .roller-playground-modifiers-tooltip {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}
```

**Step 2: Verify no regressions**

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

**Step 3: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.css
git commit -m "feat(component-library): add CSS for Modifiers hover tooltip"
```

---

### Task 3: Verify in Storybook / site

**Step 1: Start the site dev server (or Storybook if configured)**

```bash
bun run site:dev
```

**Step 2: Open the RollerPlayground in browser and manually verify:**

- [ ] "Modifiers" button appears to the right of "Code" button
- [ ] Same visual style as "Code" button (border, font-size, color, hover turns blue)
- [ ] Hovering "Modifiers" reveals a panel below it, left-aligned to the right edge of the button
- [ ] Panel contains the ModifierReference grid (read-only, cells not clickable)
- [ ] Panel animates in (opacity + slight upward slide)
- [ ] Panel disappears when mouse leaves
- [ ] Works in both dark and light themes (`[data-theme=light]`)
- [ ] No overflow clipping (shell has `overflow: visible`)

**Step 3: If anything looks off, adjust `min-width`, `top` offset, or `z-index` in the CSS.**

**Step 4: Final commit (if any CSS tweaks were needed)**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.css
git commit -m "fix(component-library): tweak Modifiers tooltip positioning"
```
