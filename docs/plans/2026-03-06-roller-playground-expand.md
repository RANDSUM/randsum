# RollerPlayground Expand-on-Click Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hover tooltip and clipboard copy on the result chip with an animated inline breakdown panel that expands below the playground when the chip is clicked.

**Architecture:** Pure React + CSS. Add `expanded: boolean` state. Chip click toggles the panel. The panel uses `grid-template-rows: 0fr → 1fr` CSS animation. Hover tooltip and copy-to-clipboard are removed entirely. The existing `RollTooltip` component renders inside the panel, plus an explicit total row always shown at the bottom.

**Tech Stack:** React 18, CSS custom properties, existing `@randsum/roller` types, Ladle for visual verification.

---

### Task 1: Remove hover tooltip and copy-to-clipboard

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

**Step 1: Remove state and refs related to tooltip and copy**

In `RollerPlayground.tsx`, delete these lines:

```tsx
// DELETE these state declarations
const [showTooltip, setShowTooltip] = useState(false)
const [copied, setCopied] = useState(false)
const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
const [chipDir, setChipDir] = useState<'above' | 'below'>('above')
const shellRef = useRef<HTMLDivElement>(null)

// DELETE copyTimerRef cleanup from useEffect
if (copyTimerRef.current) clearTimeout(copyTimerRef.current)

// DELETE the handleRoll line that resets tooltip
setShowTooltip(false)

// DELETE the handleChange line that resets tooltip
setShowTooltip(false)
```

Also delete `tooltipDir` function at the top of the file (lines 11–13).

**Step 2: Remove the chip's event handlers and tooltip render**

Replace the entire `<div ref={chipRef} ...>` chip element. Remove:
- `ref={chipRef}` → keep no ref for now
- `onMouseEnter` handler entirely
- `onMouseLeave` handler entirely
- `onClick` that writes to clipboard → replace with `undefined` temporarily
- `aria-label` mentioning "Copy result" → update in Task 2
- The `copied ?` conditional renders
- The `{showTooltip && <div ... tooltip ... />}` block

Simplified chip for now (no behavior yet, just shows total):

```tsx
<div
  className={[
    'roller-playground-chip',
    state.status !== 'result' ? 'roller-playground-chip--empty' : ''
  ]
    .filter(Boolean)
    .join(' ')}
>
  {state.status === 'result' && (
    <span className="roller-playground-chip-value">{state.total}</span>
  )}
</div>
```

**Step 3: Remove tooltip CSS**

In `RollerPlayground.css`, delete everything from `/* ===== Tooltip ===== */` through the end of `.roller-tooltip-total` media query — all tooltip-related rules. This is roughly lines 259–419.

**Step 4: Verify it builds**

```bash
bun run --filter @randsum/component-library build
```

Expected: build succeeds, no TypeScript errors.

**Step 5: Verify visually with Ladle**

```bash
bun run --filter @randsum/component-library ladle
```

Open http://localhost:61000, roll dice, confirm: chip shows total, no tooltip on hover, no copy on click.

**Step 6: Remove now-unused `shellRef`**

The `shellRef` was only used for `tooltipDir`. Delete `const shellRef = useRef<HTMLDivElement>(null)` and remove `ref={shellRef}` from the shell div.

**Step 7: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/
git commit -m "refactor(component-library): remove hover tooltip and clipboard copy from RollerPlayground"
```

---

### Task 2: Add `expanded` state and chip click toggle

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`

**Step 1: Add `expanded` state**

After the existing state declarations, add:

```tsx
const [expanded, setExpanded] = useState(false)
```

**Step 2: Reset `expanded` on new roll and notation change**

In `handleRoll`:
```tsx
setExpanded(false)
```

In `handleChange`:
```tsx
setExpanded(false)
```

**Step 3: Add chip click handler**

Update the chip element:

```tsx
<div
  className={[
    'roller-playground-chip',
    state.status !== 'result' ? 'roller-playground-chip--empty' : '',
    state.status === 'result' && expanded ? 'roller-playground-chip--expanded' : ''
  ]
    .filter(Boolean)
    .join(' ')}
  onClick={state.status === 'result' ? () => { setExpanded(e => !e) } : undefined}
  role={state.status === 'result' ? 'button' : undefined}
  aria-label={
    state.status === 'result'
      ? expanded ? 'Close breakdown' : 'Open breakdown'
      : undefined
  }
  aria-expanded={state.status === 'result' ? expanded : undefined}
>
  {state.status === 'result' && (
    <span className="roller-playground-chip-value">
      {expanded ? '×' : state.total}
    </span>
  )}
</div>
```

**Step 4: Verify TypeScript is happy**

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

**Step 5: Verify in Ladle**

Roll dice → chip shows number. Click chip → chip shows `×`. Click again → chip shows number again.

**Step 6: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx
git commit -m "feat(component-library): add expanded state and toggle to RollerPlayground chip"
```

---

### Task 3: Chip hover open-icon overlay (CSS)

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

**Step 1: Add hint span inside chip**

Inside the chip, add a hint span after the value span. It is hidden until hover:

```tsx
{state.status === 'result' && (
  <>
    <span className="roller-playground-chip-value">
      {expanded ? '×' : state.total}
    </span>
    {!expanded && (
      <span className="roller-playground-chip-hint" aria-hidden="true">↓</span>
    )}
  </>
)}
```

**Step 2: Add CSS for hint overlay**

In `RollerPlayground.css`, after the existing chip rules, add:

```css
/* ===== Chip open hint (hover) ===== */
.roller-playground-chip-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.92);
  border-radius: inherit;
  color: #fff;
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}

.roller-playground-chip:not(.roller-playground-chip--empty):hover .roller-playground-chip-hint {
  opacity: 1;
}
```

**Step 3: Verify in Ladle**

Roll dice → hover over chip → `↓` overlay appears. Click → chip shows `×`, no overlay (it is not rendered when expanded).

**Step 4: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/
git commit -m "feat(component-library): add hover open-icon overlay to result chip"
```

---

### Task 4: Expanded panel HTML structure

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`

**Step 1: Add the expand panel below the desc-row**

After the closing `</div>` of `roller-playground-desc-row`, add:

```tsx
{state.status === 'result' && (
  <div className={`roller-playground-expand${expanded ? ' roller-playground-expand--open' : ''}`}>
    <div className="roller-playground-expand-inner">
      <RollTooltip record={state.record} />
      <div className="roller-playground-expand-total">
        <span>Total</span>
        <span>{state.total}</span>
      </div>
    </div>
  </div>
)}
```

Note: `roller-playground-expand` is always rendered when `status === 'result'` (so the grid animation works on toggle); it is collapsed by default via CSS.

**Step 2: Verify structure renders**

In Ladle, roll dice, open browser DevTools. The `roller-playground-expand` div should be in the DOM but invisible (no open class yet — CSS in next task). With `--open` class manually added in DevTools, the inner content should appear.

**Step 3: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx
git commit -m "feat(component-library): add expand panel HTML structure to RollerPlayground"
```

---

### Task 5: Expanded panel CSS animation

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

**Step 1: Add expand panel CSS**

Add these rules to the end of `RollerPlayground.css`:

```css
/* ===== Expand panel ===== */
.roller-playground-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}

.roller-playground-expand--open {
  grid-template-rows: 1fr;
}

.roller-playground-expand-inner {
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #e6edf3;
}

@media (prefers-color-scheme: light) {
  .roller-playground-expand-inner {
    border-top-color: rgba(0, 0, 0, 0.1);
    color: #1f2328;
  }
}

/* ===== Total row at bottom of expand panel ===== */
.roller-playground-expand-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 0.3rem;
  margin-top: 0.1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-weight: 700;
  font-size: 0.8rem;
  font-family: system-ui, -apple-system, sans-serif;
  color: #e6edf3;
}

@media (prefers-color-scheme: light) {
  .roller-playground-expand-total {
    border-top-color: rgba(0, 0, 0, 0.1);
    color: #1f2328;
  }
}
```

**Step 2: Add tooltip inner styles back (embedded variant)**

The `<RollTooltip>` component uses `.roller-tooltip-inner` and all its child classes. Add these back to the CSS — they were removed in Task 1. Copy them from the design reference (all `.roller-tooltip-*` rules) but without the `box-shadow` and with `background: transparent` since the panel provides its own background:

```css
/* ===== Embedded tooltip styles (used in expand panel) ===== */
.roller-tooltip-inner {
  background: transparent;
  padding: 0;
}

.roller-tooltip-notation {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-weight: 700;
  font-size: 0.9rem;
  color: #60a5fa;
  margin-bottom: 0.1rem;
}

.roller-tooltip-desc {
  color: #6b7280;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.roller-tooltip-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.1rem 0;
}

@media (prefers-color-scheme: light) {
  .roller-tooltip-divider {
    background: rgba(0, 0, 0, 0.1);
  }
}

.roller-tooltip-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.05rem 0;
  line-height: 1.4;
}

.roller-tooltip-label {
  color: #9ca3af;
}

.roller-tooltip-dice-group {
  display: flex;
  align-items: flex-start;
  gap: 0.2rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  text-align: right;
}

.roller-tooltip-dice {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  letter-spacing: 0;
  white-space: normal;
  word-break: break-word;
}

.roller-tooltip-dice-sep {
  color: rgba(255, 255, 255, 0.1);
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
}

.roller-tooltip-dice--removed {
  color: rgba(255, 255, 255, 0.3);
  text-decoration: line-through;
  text-decoration-color: #9ca3af;
}

.roller-tooltip-dice--added {
  color: #60a5fa;
}

.roller-tooltip-dice--arithmetic {
  color: #60a5fa;
  font-weight: 600;
}

.roller-tooltip-row--final {
  padding-bottom: 0.3rem;
}

.roller-tooltip-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.05rem 0;
  padding-top: 0.3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  line-height: 1;
  font-weight: 700;
}

@media (prefers-color-scheme: light) {
  .roller-tooltip-total {
    border-top-color: rgba(0, 0, 0, 0.1);
  }
}
```

**Step 3: Verify animation in Ladle**

Roll dice → click chip → panel smoothly expands downward, showing notation, description, roll steps, and a total row. Click chip (now showing `×`) → panel collapses.

**Step 4: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.css
git commit -m "feat(component-library): add expand panel CSS animation to RollerPlayground"
```

---

### Task 6: Hide notation text in desc-row when expanded

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

**Step 1: Add hidden modifier class to notation description span**

Find the desc span in the JSX:

```tsx
<span
  className={`roller-playground-desc--${notation.length === 0 ? 'hint' : isValid ? 'valid' : 'invalid'}`}
>
  {notationDesc(notation, isValid)}
</span>
```

Change to:

```tsx
<span
  className={[
    `roller-playground-desc--${notation.length === 0 ? 'hint' : isValid ? 'valid' : 'invalid'}`,
    expanded ? 'roller-playground-desc--hidden' : ''
  ]
    .filter(Boolean)
    .join(' ')}
>
  {notationDesc(notation, isValid)}
</span>
```

**Step 2: Add CSS for hidden state**

```css
.roller-playground-desc--hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

/* Also ensure non-hidden has a transition for smooth reverse */
.roller-playground-desc--hint,
.roller-playground-desc--valid,
.roller-playground-desc--invalid {
  transition: opacity 0.2s ease;
}
```

**Step 3: Verify in Ladle**

Roll dice → notation description text visible. Click chip → text fades out, StackBlitz button stays. Click × → text fades back in.

**Step 4: Build and typecheck**

```bash
bun run --filter @randsum/component-library build
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

**Step 5: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/
git commit -m "feat(component-library): fade desc text when expand panel is open"
```

---

### Task 7: Add Ladle story for expanded state and final smoke test

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.stories.tsx`

**Step 1: Add an "Expanded" story**

Ladle doesn't support programmatic state, but we can document the interaction. Add a comment story variant for human verification:

```tsx
export const ExpandBreakdown: Story = () => (
  <div style={{ padding: '2rem' }}>
    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
      Roll dice, then click the result chip to expand the breakdown.
    </p>
    <RollerPlayground defaultNotation="4d6L" />
  </div>
)

export const ExpandWithArithmetic: Story = () => (
  <div style={{ padding: '2rem' }}>
    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
      Roll and expand — should show arithmetic modifier steps.
    </p>
    <RollerPlayground defaultNotation="1d20+5" />
  </div>
)

export const ExpandSimpleRoll: Story = () => (
  <div style={{ padding: '2rem' }}>
    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
      Simple roll with no modifiers — should show Rolled step only, then Total.
    </p>
    <RollerPlayground defaultNotation="1d6" />
  </div>
)
```

**Step 2: Run Ladle and verify all stories**

```bash
bun run --filter @randsum/component-library ladle
```

Check each story manually:
- Default: roll → hover chip (↓ overlay) → click (panel expands, × appears) → click × (collapses)
- WithModifier (1d20+5): expanded panel shows arithmetic step
- NoStackBlitz: StackBlitz button absent, expand still works
- ExpandSimpleRoll: no modifier steps, just "Rolled" and "Total" rows

**Step 3: Final build**

```bash
bun run build
```

Expected: full monorepo build passes.

**Step 4: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.stories.tsx
git commit -m "chore(component-library): add expand interaction stories for RollerPlayground"
```
