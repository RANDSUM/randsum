# Modifier Doc Overlay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract the playground overlay as a reusable `Overlay` component, add per-modifier documentation content, and wire `ModifierReference` cell clicks to open a modifier doc view in that overlay.

**Architecture:** Three focused changes — extract the backdrop/dismiss logic into a standalone `Overlay` component; add a `modifierDocs.ts` data map and a `ModifierDocContent` component for rendering docs; refactor `RollerPlayground` overlay state from `overlayVisible: boolean` to `overlayContent: OverlayContent | null` so the same overlay slot can host a result view or a modifier doc view, with back-navigation when replacing a result.

**Tech Stack:** TypeScript, React, bun:test, CSS modules (flat class names), `bun run --filter @randsum/component-library typecheck`

---

## Background

### Current overlay structure in `RollerPlayground.tsx`

The expand panel (`roller-playground-expand-reference`) is `position: relative`. The overlay is `position: absolute; inset: 0`, rendered conditionally via `overlayVisible && (state.status === 'rolling' || state.status === 'result')`.

State: `overlayVisible: boolean`, `dismissing: boolean`.

`dismiss()` sets `dismissing: true`, then after 180 ms sets `overlayVisible: false` + `dismissing: false`.

Escape key is wired in a `useEffect` that calls `dismiss()`.

### ModifierReference `onCellClick` prop

`ModifierReference` already accepts `onCellClick?: (cell: ModifierReferenceCell) => void`. `ModifierReferenceCell` is `{ notation: string; description: string; isCore: boolean }`. The RollerPlayground currently passes **no** `onCellClick`, so clicks do nothing.

### Notation keys (from `MODIFIER_PAIRS` + `CORE`)

These exact strings are what land in `cell.notation`. The doc map must key on them:

```
'xDY'  'L'   'H'   'K'    'kl'
'!'    '!!'  '!p'  'U'    'V{..}'
'S{..}' '**' '*'   '\u2013' (–)  '+'   'C{..}'  'R{..}'
```

---

## Task 1: Extract `Overlay` component

**Files:**
- Create: `packages/component-library/src/components/Overlay/Overlay.tsx`
- Create: `packages/component-library/src/components/Overlay/Overlay.css`
- Create: `packages/component-library/src/components/Overlay/index.ts`
- Modify: `packages/component-library/src/index.ts`

### Step 1: Create `Overlay.css`

Move the overlay CSS from `RollerPlayground.css` (the four blocks below) into `Overlay.css` with **renamed classes** (`roller-playground-result-overlay` → `rp-overlay`, etc.):

```css
.rp-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  z-index: 10;
  background: rgba(13, 17, 23, 0.82);
  backdrop-filter: blur(4px);
  animation: rp-overlay-enter 0.18s ease both;
}

.rp-overlay--dismissible {
  cursor: pointer;
}

.rp-overlay--dismissing {
  animation: rp-overlay-exit 0.18s ease both;
  pointer-events: none;
}

.rp-overlay-card {
  width: fit-content;
  min-width: 240px;
  max-width: min(480px, 100%);
  max-height: 100%;
  overflow-y: auto;
  background: #161b22;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  cursor: default;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  transition: width 0.2s ease;
  animation: rp-overlay-card-enter 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes rp-overlay-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes rp-overlay-exit {
  to { opacity: 0; }
}

@keyframes rp-overlay-card-enter {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (prefers-color-scheme: light) {
  .rp-overlay {
    background: rgba(246, 248, 250, 0.88);
  }
  .rp-overlay-card {
    background: #ffffff;
    border-color: rgba(0, 0, 0, 0.12);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  }
}

[data-theme='light'] .rp-overlay {
  background: rgba(246, 248, 250, 0.88);
}

[data-theme='light'] .rp-overlay-card {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}
```

### Step 2: Create `Overlay.tsx`

```tsx
import { useEffect } from 'react'
import type React from 'react'
import './Overlay.css'

export function Overlay({
  visible,
  dismissing,
  dismissible = true,
  onDismiss,
  children
}: {
  readonly visible: boolean
  readonly dismissing: boolean
  readonly dismissible?: boolean
  readonly onDismiss: () => void
  readonly children: React.ReactNode
}): React.JSX.Element | null {
  useEffect(() => {
    if (!visible) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      className={[
        'rp-overlay',
        dismissible && !dismissing ? 'rp-overlay--dismissible' : '',
        dismissing ? 'rp-overlay--dismissing' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={dismissible && !dismissing ? onDismiss : undefined}
    >
      <div
        className="rp-overlay-card"
        onClick={e => {
          e.stopPropagation()
        }}
      >
        {children}
      </div>
    </div>
  )
}
```

### Step 3: Create `index.ts`

```ts
export { Overlay } from './Overlay'
```

### Step 4: Export from component library index

In `packages/component-library/src/index.ts`, add:

```ts
export { Overlay } from './components/Overlay'
```

### Step 5: Typecheck

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

### Step 6: Commit

```bash
git add packages/component-library/src/components/Overlay/ \
        packages/component-library/src/index.ts
git commit -m "feat(component-library): add reusable Overlay component"
```

---

## Task 2: Add modifier documentation data

**Files:**
- Create: `packages/component-library/src/components/ModifierReference/modifierDocs.ts`

### Step 1: Create `modifierDocs.ts`

The keys **must exactly match** the `notation` strings from `MODIFIER_PAIRS` and `CORE`. `'–'` is `'\u2013'` (en-dash).

```ts
export interface ModifierDoc {
  readonly title: string
  readonly description: string
  readonly forms: readonly { readonly notation: string; readonly note: string }[]
  readonly examples: readonly { readonly notation: string; readonly description: string }[]
}

export const MODIFIER_DOCS: Readonly<Record<string, ModifierDoc>> = {
  xDY: {
    title: 'Core Roll',
    description: 'Roll X dice with Y sides each. The foundation of every notation string.',
    forms: [
      { notation: 'NdS', note: 'Roll N dice, S sides' },
      { notation: '1d20', note: 'One twenty-sided die' },
      { notation: '4d6', note: 'Four six-sided dice' }
    ],
    examples: [
      { notation: '1d20', description: 'Roll one d20' },
      { notation: '4d6', description: 'Roll four d6' },
      { notation: '2d8', description: 'Roll two d8' }
    ]
  },
  L: {
    title: 'Drop Lowest',
    description: 'Remove the lowest-valued dice from the pool before summing.',
    forms: [
      { notation: 'L', note: 'Drop 1 lowest' },
      { notation: 'LN', note: 'Drop N lowest' },
      { notation: 'LH', note: 'Drop lowest and highest' }
    ],
    examples: [
      { notation: '4d6L', description: 'Roll 4d6, drop lowest (ability scores)' },
      { notation: '5d6L2', description: 'Roll 5d6, drop 2 lowest' }
    ]
  },
  H: {
    title: 'Drop Highest',
    description: 'Remove the highest-valued dice from the pool before summing.',
    forms: [
      { notation: 'H', note: 'Drop 1 highest' },
      { notation: 'HN', note: 'Drop N highest' },
      { notation: 'LH', note: 'Drop lowest and highest' }
    ],
    examples: [
      { notation: '2d20H', description: 'Roll 2d20, drop highest (disadvantage)' },
      { notation: '4d6H', description: 'Roll 4d6, drop highest' }
    ]
  },
  K: {
    title: 'Keep Highest',
    description: 'Keep only the N highest-valued dice; discard the rest.',
    forms: [
      { notation: 'K', note: 'Keep 1 highest' },
      { notation: 'KN', note: 'Keep N highest' }
    ],
    examples: [
      { notation: '2d20K', description: 'Roll 2d20, keep highest (advantage)' },
      { notation: '4d6K3', description: 'Roll 4d6, keep highest 3' }
    ]
  },
  kl: {
    title: 'Keep Lowest',
    description: 'Keep only the N lowest-valued dice; discard the rest.',
    forms: [
      { notation: 'kl', note: 'Keep 1 lowest' },
      { notation: 'klN', note: 'Keep N lowest' }
    ],
    examples: [
      { notation: '2d20kl', description: 'Roll 2d20, keep lowest (disadvantage)' },
      { notation: '4d6kl2', description: 'Roll 4d6, keep 2 lowest' }
    ]
  },
  '!': {
    title: 'Explode',
    description:
      'Each die that shows its maximum value triggers an extra die roll, added to the result. Continues if new dice also max.',
    forms: [{ notation: '!', note: 'Explode on max value' }],
    examples: [
      { notation: '3d6!', description: 'Roll 3d6; any 6 explodes (adds another d6)' },
      { notation: '4d6L!', description: 'Roll 4d6, explode, then drop lowest' }
    ]
  },
  '!!': {
    title: 'Compound Explode',
    description:
      'Like explode, but extra rolls add to the triggering die rather than creating new dice.',
    forms: [
      { notation: '!!', note: 'Compound once on max' },
      { notation: '!!N', note: 'Compound up to depth N' },
      { notation: '!!0', note: 'Compound unlimited (capped at 100)' }
    ],
    examples: [
      { notation: '3d6!!', description: 'Roll 3d6; 6s add to themselves' },
      { notation: '1d8!!5', description: 'Roll 1d8, compound up to 5 times' }
    ]
  },
  '!p': {
    title: 'Penetrating Explode',
    description:
      'Like explode, but each subsequent explosion subtracts 1 from the result (Hackmaster-style).',
    forms: [
      { notation: '!p', note: 'Penetrate on max value' },
      { notation: '!pN', note: 'Penetrate up to depth N' },
      { notation: '!p0', note: 'Penetrate unlimited (capped at 100)' }
    ],
    examples: [
      { notation: '1d6!p', description: 'Roll 1d6; max penetrates with -1 per chain' },
      { notation: '2d6!pL', description: 'Penetrate, then drop lowest' }
    ]
  },
  U: {
    title: 'Unique',
    description: 'Force all dice in the pool to show different values by rerolling duplicates.',
    forms: [
      { notation: 'U', note: 'All values must be unique' },
      { notation: 'U{X,Y}', note: 'Unique except X and Y may repeat' }
    ],
    examples: [
      { notation: '4d20U', description: 'Roll 4d20, no duplicate results' },
      { notation: '4d6U{1}', description: 'Unique except 1s may repeat' }
    ]
  },
  'V{..}': {
    title: 'Replace',
    description: 'Replace dice showing specific values with a new value.',
    forms: [
      { notation: 'V{X=Y}', note: 'Replace exact value X with Y' },
      { notation: 'V{>N=Y}', note: 'Replace results over N with Y' },
      { notation: 'V{<N=Y}', note: 'Replace results under N with Y' },
      { notation: 'V{X=Y,A=B}', note: 'Multiple replacement rules' }
    ],
    examples: [
      { notation: '4d6V{1=2}', description: 'Reroll 1s, replace with 2' },
      { notation: '4d20V{>18=20}', description: 'Cap 19s and 20s to 20 by replace' }
    ]
  },
  'S{..}': {
    title: 'Count Successes',
    description:
      'Count dice that meet a threshold instead of summing values — used in dice pool systems.',
    forms: [
      { notation: 'S{N}', note: 'Count dice >= N' },
      { notation: 'S{N,B}', note: 'Successes >= N minus botches <= B' }
    ],
    examples: [
      { notation: '5d10S{7}', description: 'Count dice that rolled 7 or higher' },
      { notation: '5d10S{7,1}', description: 'Successes >= 7, subtract botches <= 1' }
    ]
  },
  '**': {
    title: 'Multiply Total',
    description:
      'Multiply the entire final total after all other modifiers have been applied.',
    forms: [{ notation: '**N', note: 'Multiply final total by N' }],
    examples: [
      { notation: '2d6+3**2', description: '(roll + 3) × 2' },
      { notation: '4d6L**3', description: '(drop-lowest sum) × 3' }
    ]
  },
  '*': {
    title: 'Multiply Dice',
    description:
      'Multiply the dice sum before applying +/- arithmetic modifiers.',
    forms: [{ notation: '*N', note: 'Multiply dice sum by N (pre-arithmetic)' }],
    examples: [
      { notation: '2d6*2+3', description: '(roll × 2) + 3' },
      { notation: '4d6*3', description: 'Triple the dice sum' }
    ]
  },
  '\u2013': {
    title: 'Subtract',
    description: 'Subtract a fixed number from the total after all dice are rolled.',
    forms: [{ notation: '-N', note: 'Subtract N from total' }],
    examples: [
      { notation: '1d20-2', description: 'Roll 1d20, subtract 2' },
      { notation: '4d6L-1', description: 'Drop lowest, subtract 1' }
    ]
  },
  '+': {
    title: 'Add',
    description: 'Add a fixed number to the total after all dice are rolled.',
    forms: [{ notation: '+N', note: 'Add N to total' }],
    examples: [
      { notation: '1d20+5', description: 'Roll 1d20, add 5' },
      { notation: '2d6+3', description: 'Roll 2d6, add 3' }
    ]
  },
  'C{..}': {
    title: 'Cap',
    description: 'Clamp individual die values to a range — dice that fall outside are moved to the boundary.',
    forms: [
      { notation: 'C{>N}', note: 'Cap rolls over N to N' },
      { notation: 'C{<N}', note: 'Cap rolls under N to N' },
      { notation: 'C{N}', note: 'Max cap at N (bare number)' },
      { notation: 'C{<N,>M}', note: 'Floor N and ceiling M' }
    ],
    examples: [
      { notation: '4d6C{>5}', description: 'Cap rolls: nothing exceeds 5' },
      { notation: '4d20C{<3,>18}', description: 'Clamp rolls to [3, 18]' }
    ]
  },
  'R{..}': {
    title: 'Reroll',
    description: 'Reroll dice that match a condition. The new result stands (may reroll again if still matching).',
    forms: [
      { notation: 'R{<N}', note: 'Reroll results under N' },
      { notation: 'R{>N}', note: 'Reroll results over N' },
      { notation: 'R{X,Y}', note: 'Reroll exact values X, Y' },
      { notation: 'R{<N}M', note: 'Reroll under N, max M attempts' }
    ],
    examples: [
      { notation: '4d6R{1}', description: 'Reroll any 1s' },
      { notation: '2d10R{<3}', description: 'Reroll results under 3' },
      { notation: '4d6R{<3}2', description: 'Reroll under 3, max 2 attempts' }
    ]
  }
}
```

### Step 2: Typecheck

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

### Step 3: Commit

```bash
git add packages/component-library/src/components/ModifierReference/modifierDocs.ts
git commit -m "feat(component-library): add modifier documentation data"
```

---

## Task 3: Add `ModifierDocContent` component

**Files:**
- Create: `packages/component-library/src/components/ModifierReference/ModifierDocContent.tsx`
- Modify: `packages/component-library/src/components/ModifierReference/ModifierDocContent.css` (new file)
- Modify: `packages/component-library/src/components/ModifierReference/index.ts`

### Step 1: Create `ModifierDocContent.css`

```css
.modifier-doc {
  font-size: var(--rp-font-size-expand, 0.8rem);
  font-family: system-ui, -apple-system, sans-serif;
  color: #e6edf3;
  min-width: 220px;
}

.modifier-doc-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 0.35rem;
}

.modifier-doc-notation {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #60a5fa;
}

.modifier-doc-title {
  font-weight: 600;
  color: #e6edf3;
}

.modifier-doc-description {
  color: #9ca3af;
  margin-bottom: 0.4rem;
  line-height: 1.4;
}

.modifier-doc-section-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  margin-bottom: 0.2rem;
}

.modifier-doc-forms {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.4rem;
}

.modifier-doc-form-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.modifier-doc-form-notation {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  color: #e6edf3;
  flex-shrink: 0;
}

.modifier-doc-form-note {
  color: #6b7280;
  text-align: right;
}

.modifier-doc-examples {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.modifier-doc-example-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.modifier-doc-example-notation {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  color: #60a5fa;
  flex-shrink: 0;
}

.modifier-doc-example-desc {
  color: #6b7280;
  text-align: right;
}

.modifier-doc-back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.7rem;
  cursor: pointer;
  padding: 0.25rem 0 0;
  margin-top: 0.15rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  width: 100%;
}

.modifier-doc-back:hover {
  color: #9ca3af;
}

[data-theme='light'] .modifier-doc {
  color: #1f2328;
}
[data-theme='light'] .modifier-doc-title {
  color: #1f2328;
}
[data-theme='light'] .modifier-doc-notation {
  color: #4878c8;
}
[data-theme='light'] .modifier-doc-example-notation {
  color: #4878c8;
}
```

### Step 2: Create `ModifierDocContent.tsx`

```tsx
import type React from 'react'
import type { ModifierReferenceCell } from './ModifierReference'
import { MODIFIER_DOCS } from './modifierDocs'
import './ModifierDocContent.css'

export function ModifierDocContent({
  cell,
  onBack
}: {
  readonly cell: ModifierReferenceCell
  readonly onBack?: () => void
}): React.JSX.Element {
  const doc = MODIFIER_DOCS[cell.notation]

  if (!doc) {
    return (
      <div className="modifier-doc">
        <div className="modifier-doc-header">
          <span className="modifier-doc-notation">{cell.notation}</span>
          <span className="modifier-doc-title">{cell.description}</span>
        </div>
        {onBack && (
          <button className="modifier-doc-back" onClick={onBack} type="button">
            ← back
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="modifier-doc">
      <div className="modifier-doc-header">
        <span className="modifier-doc-notation">{cell.notation}</span>
        <span className="modifier-doc-title">{doc.title}</span>
      </div>
      <p className="modifier-doc-description">{doc.description}</p>

      <div className="modifier-doc-section-label">Forms</div>
      <div className="modifier-doc-forms">
        {doc.forms.map(form => (
          <div key={form.notation} className="modifier-doc-form-row">
            <span className="modifier-doc-form-notation">{form.notation}</span>
            <span className="modifier-doc-form-note">{form.note}</span>
          </div>
        ))}
      </div>

      <div className="modifier-doc-section-label">Examples</div>
      <div className="modifier-doc-examples">
        {doc.examples.map(ex => (
          <div key={ex.notation} className="modifier-doc-example-row">
            <span className="modifier-doc-example-notation">{ex.notation}</span>
            <span className="modifier-doc-example-desc">{ex.description}</span>
          </div>
        ))}
      </div>

      {onBack && (
        <button className="modifier-doc-back" onClick={onBack} type="button">
          ← back
        </button>
      )}
    </div>
  )
}
```

### Step 3: Export from ModifierReference index

In `packages/component-library/src/components/ModifierReference/index.ts`, add:

```ts
export { ModifierDocContent } from './ModifierDocContent'
```

### Step 4: Typecheck

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

### Step 5: Commit

```bash
git add packages/component-library/src/components/ModifierReference/ModifierDocContent.tsx \
        packages/component-library/src/components/ModifierReference/ModifierDocContent.css \
        packages/component-library/src/components/ModifierReference/index.ts
git commit -m "feat(component-library): add ModifierDocContent component"
```

---

## Task 4: Refactor RollerPlayground overlay state + wire up `onCellClick`

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx`
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

### Step 1: Replace the old overlay CSS blocks in `RollerPlayground.css`

Remove these sections (they now live in `Overlay.css`):
- `.roller-playground-result-overlay { … }`
- `.roller-playground-result-overlay--dismissible { … }`
- `.roller-playground-result-overlay--dismissing { … }`
- `@media` + `[data-theme='light']` blocks for those classes
- `.roller-playground-result-card { … }`
- `@keyframes result-overlay-enter`, `result-overlay-exit`, `result-card-enter`
- Light theme overrides for result-card

Then update the remaining reference to use the Overlay component's card class for the result-loading spinner, if needed (the loading spinner can stay in RollerPlayground.css).

### Step 2: Update imports in `RollerPlayground.tsx`

Add:

```ts
import type { ModifierReferenceCell } from '../ModifierReference'
import { ModifierDocContent } from '../ModifierReference'
import { Overlay } from '../Overlay'
```

### Step 3: Add new `OverlayContent` type and update state

Replace:
```ts
const [overlayVisible, setOverlayVisible] = useState(false)
const [dismissing, setDismissing] = useState(false)
```

With:
```ts
type OverlayContent =
  | { kind: 'rolling' }
  | { kind: 'result' }
  | { kind: 'modifier-doc'; cell: ModifierReferenceCell; returnTo: 'result' | null }

const [overlayContent, setOverlayContent] = useState<OverlayContent | null>(null)
const [dismissing, setDismissing] = useState(false)
```

### Step 4: Update `dismiss` callback

```ts
const dismiss = useCallback(() => {
  setDismissing(true)
  if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
  dismissTimerRef.current = setTimeout(() => {
    setOverlayContent(null)
    setDismissing(false)
  }, 180)
}, [])
```

### Step 5: Update the Escape key effect

```ts
useEffect(() => {
  if (!overlayContent) return
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape') return
    if (
      overlayContent.kind === 'modifier-doc' &&
      overlayContent.returnTo === 'result'
    ) {
      setOverlayContent({ kind: 'result' })
    } else {
      dismiss()
    }
  }
  document.addEventListener('keydown', onKeyDown)
  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}, [overlayContent, dismiss])
```

### Step 6: Update `handleRoll`

Replace `setOverlayVisible(true/false)` with `setOverlayContent(...)`:

```ts
const handleRoll = useCallback(() => {
  if (!isValid) return
  setState({ status: 'rolling' })
  setOverlayContent({ kind: 'rolling' })
  if (timerRef.current) clearTimeout(timerRef.current)
  timerRef.current = setTimeout(() => {
    try {
      const result = roll(notation)
      if (result.rolls.length === 0) {
        setState({ status: 'idle' })
        setOverlayContent(null)
        return
      }
      setState({ status: 'result', total: result.total, records: result.rolls })
      setOverlayContent({ kind: 'result' })
    } catch {
      // invalid notation — isDiceNotation guard above should prevent this
    }
  }, 300)
}, [notation, isValid])
```

### Step 7: Update other `setOverlayVisible` call sites

- `handleChange`: `setOverlayVisible(false)` → `setOverlayContent(null)`
- Controlled notation `useEffect`: `setOverlayVisible(false)` → `setOverlayContent(null)`
- Chip toggle button (any `setOverlayVisible(v => !v)` calls): replace with:
  ```ts
  setOverlayContent(c => (c ? null : { kind: 'result' }))
  ```
  but only toggle when state is result:
  ```ts
  overlayContent ? setOverlayContent(null) : setOverlayContent({ kind: 'result' })
  ```
  — check the exact call sites and update each one.

### Step 8: Add `handleCellClick` callback

```ts
const handleCellClick = useCallback(
  (cell: ModifierReferenceCell) => {
    if (overlayContent?.kind === 'result') {
      setOverlayContent({ kind: 'modifier-doc', cell, returnTo: 'result' })
    } else if (!overlayContent) {
      setOverlayContent({ kind: 'modifier-doc', cell, returnTo: null })
    }
    // If rolling or already showing a doc, do nothing
  },
  [overlayContent]
)
```

### Step 9: Update the `ModifierReference` callsite to pass `onCellClick`

```tsx
<ModifierReference
  modifiersDisabled={!isValid}
  onCellClick={handleCellClick}
/>
```

### Step 10: Update any `overlayVisible` references in the render

Replace `overlayVisible` everywhere it appears in JSX/class names:
- Expand panel open check: `overlayContent !== null`
- Chip hidden check: `overlayContent !== null`
- Chip aria-expanded: `overlayContent !== null`

### Step 11: Replace the overlay JSX with `Overlay` + updated content

Replace the entire overlay `{overlayVisible && ...}` block with:

```tsx
<Overlay
  visible={overlayContent !== null}
  dismissing={dismissing}
  dismissible={
    overlayContent?.kind === 'result' ||
    (overlayContent?.kind === 'modifier-doc' && overlayContent.returnTo === null)
  }
  onDismiss={
    overlayContent?.kind === 'modifier-doc' && overlayContent.returnTo === 'result'
      ? () => { setOverlayContent({ kind: 'result' }) }
      : dismiss
  }
>
  {overlayContent?.kind === 'rolling' && (
    <div className="roller-playground-result-loading">
      <div className="roller-playground-expand-loading-spinner" />
    </div>
  )}
  {overlayContent?.kind === 'result' && state.status === 'result' && (
    <>
      <div className="roller-playground-result-total-hero">{state.total}</div>
      <RollResult records={state.records} />
      <div className="roller-playground-expand-total">
        <span>Total</span>
        <span className="roller-playground-expand-total-chip">{state.total}</span>
      </div>
    </>
  )}
  {overlayContent?.kind === 'modifier-doc' && (
    <ModifierDocContent
      cell={overlayContent.cell}
      onBack={
        overlayContent.returnTo === 'result'
          ? () => { setOverlayContent({ kind: 'result' }) }
          : undefined
      }
    />
  )}
</Overlay>
```

Note: the old `.roller-playground-result-card` wrapper div is gone — the `Overlay` component renders its own `rp-overlay-card` wrapper around children.

### Step 12: Typecheck

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

### Step 13: Commit

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx \
        packages/component-library/src/components/RollerPlayground/RollerPlayground.css
git commit -m "feat(component-library): wire modifier cell clicks to doc overlay"
```

---

## Summary

| Task | Files | Change |
|------|-------|--------|
| 1 | `Overlay/Overlay.tsx`, `.css`, `index.ts` | Reusable backdrop + dismiss component |
| 2 | `ModifierReference/modifierDocs.ts` | Static doc data for all modifier notations |
| 3 | `ModifierReference/ModifierDocContent.tsx`, `.css` | Doc content renderer with back button |
| 4 | `RollerPlayground.tsx`, `.css` | State refactor, Overlay adoption, onCellClick wiring |
