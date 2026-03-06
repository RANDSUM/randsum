# RollerPlayground Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an interactive one-line dice roller playground to the landing page hero, replacing the static code example section.

**Architecture:** Single React component `RollerPlayground` uses `roll()` and `isDiceNotation()` from `@randsum/roller` — no Web Worker needed since `roll()` is synchronous. A `formatBreakdown` helper extracts tooltip data from `RollRecord`. The component lives in the hero above the CTA buttons, rendered with `client:only="react"`. Clicking Roll shows a 300ms spinner then a chip grows in; hovering the chip shows a breakdown tooltip.

**Tech Stack:** React 19, `@randsum/roller`, `bun:test`, TypeScript strict mode, `client:only="react"`

---

## Codebase Context

- Workspace root: `/Users/jarvis/Code/RANDSUM/@RANDSUM`
- Site app: `apps/site/`
- Playground components: `apps/site/src/components/playground/` (existing directory — don't delete anything in it)
- Tests: `apps/site/__tests__/`
- Landing page: `apps/site/src/pages/index.astro`
- Run tests: `bun run --filter @randsum/site test`
- TypeScript rules: `const` only (no `let`), no `any`, explicit return types on all exported functions, `import type` for type-only imports
- Prettier: no semicolons, single quotes, no trailing commas
- `roll()` never throws — always check `result.error` before using `result.total`
- `isDiceNotation(value)` returns `true` when `value` is valid RANDSUM dice notation
- `RollRecord` is the type for each entry in `result.rolls[]`. It has:
  - `notation: string`
  - `description: string[]`
  - `modifierHistory.initialRolls: number[]` — raw dice before modifiers
  - `modifierHistory.modifiedRolls: number[]` — dice after modifiers
  - `modifierHistory.total: number` — sum of modified rolls
  - `appliedTotal: number` — total including arithmetic (+/- modifiers)

---

## Task 1: Add `formatBreakdown` helper (TDD)

**Files:**
- Create: `apps/site/src/components/playground/helpers/formatBreakdown.ts`
- Create: `apps/site/__tests__/formatBreakdown.test.ts`

### Step 1: Write the failing test

Create `apps/site/__tests__/formatBreakdown.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { formatBreakdown } from '../src/components/playground/helpers/formatBreakdown'
import type { RollRecord } from '@randsum/roller'

function makeRecord(overrides: Partial<RollRecord> = {}): RollRecord {
  return {
    argument: '4d6L',
    notation: '4d6L',
    description: ['4d6 drop lowest 1'],
    parameters: {} as never,
    rolls: [6, 4, 3, 1],
    modifierHistory: {
      logs: [],
      modifiedRolls: [6, 4, 3],
      total: 13,
      initialRolls: [6, 4, 3, 1],
    },
    appliedTotal: 13,
    total: 13,
    ...overrides,
  }
}

describe('formatBreakdown', () => {
  test('extracts notation', () => {
    expect(formatBreakdown(makeRecord()).notation).toBe('4d6L')
  })

  test('extracts description', () => {
    expect(formatBreakdown(makeRecord()).description).toEqual(['4d6 drop lowest 1'])
  })

  test('extracts rolled dice', () => {
    expect(formatBreakdown(makeRecord()).rolled).toEqual([6, 4, 3, 1])
  })

  test('extracts kept dice', () => {
    expect(formatBreakdown(makeRecord()).kept).toEqual([6, 4, 3])
  })

  test('extracts diceTotal from modifierHistory.total', () => {
    expect(formatBreakdown(makeRecord()).diceTotal).toBe(13)
  })

  test('total equals appliedTotal when no arithmetic modifier', () => {
    expect(formatBreakdown(makeRecord()).total).toBe(13)
  })

  test('total reflects arithmetic modifier', () => {
    const breakdown = formatBreakdown(makeRecord({ appliedTotal: 16 }))
    expect(breakdown.diceTotal).toBe(13)
    expect(breakdown.total).toBe(16)
  })
})
```

### Step 2: Run test to verify it fails

```bash
bun test apps/site/__tests__/formatBreakdown.test.ts
```

Expected: FAIL — "Cannot find module '...formatBreakdown'"

### Step 3: Write the implementation

Create `apps/site/src/components/playground/helpers/formatBreakdown.ts`:

```typescript
import type { RollRecord } from '@randsum/roller'

export interface RollBreakdown {
  readonly notation: string
  readonly description: readonly string[]
  readonly rolled: readonly number[]
  readonly kept: readonly number[]
  readonly diceTotal: number
  readonly total: number
}

export function formatBreakdown(record: RollRecord): RollBreakdown {
  return {
    notation: record.notation,
    description: record.description,
    rolled: record.modifierHistory.initialRolls,
    kept: record.modifierHistory.modifiedRolls,
    diceTotal: record.modifierHistory.total,
    total: record.appliedTotal,
  }
}
```

### Step 4: Run test to verify it passes

```bash
bun test apps/site/__tests__/formatBreakdown.test.ts
```

Expected: 7 tests pass.

### Step 5: Commit

```bash
git add apps/site/src/components/playground/helpers/formatBreakdown.ts apps/site/__tests__/formatBreakdown.test.ts
git commit -m "feat(site): add formatBreakdown helper with tests"
```

---

## Task 2: Create `RollerPlayground.tsx`

**Files:**
- Create: `apps/site/src/components/playground/RollerPlayground.tsx`

No unit tests for the React component itself — verify visually in Task 5.

### Step 1: Write the component

Create `apps/site/src/components/playground/RollerPlayground.tsx`:

```tsx
import { useCallback, useRef, useState } from 'react'
import { isDiceNotation, roll } from '@randsum/roller'
import { formatBreakdown } from './helpers/formatBreakdown'
import type { RollBreakdown } from './helpers/formatBreakdown'
import './RollerPlayground.css'

type PlaygroundState =
  | { status: 'idle' }
  | { status: 'rolling' }
  | { status: 'result'; total: number; breakdown: RollBreakdown }

export function RollerPlayground(): React.JSX.Element {
  const [notation, setNotation] = useState('4d6L')
  const [state, setState] = useState<PlaygroundState>({ status: 'idle' })
  const [showTooltip, setShowTooltip] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const isValid = notation.length > 0 && isDiceNotation(notation)

  const handleRoll = useCallback(() => {
    if (!isValid) return

    setState({ status: 'rolling' })
    setShowTooltip(false)

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const result = roll(notation)
      if (result.error || !result.rolls[0]) return
      setState({
        status: 'result',
        total: result.total,
        breakdown: formatBreakdown(result.rolls[0]),
      })
    }, 300)
  }, [notation, isValid])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotation(e.target.value)
    setState({ status: 'idle' })
    setShowTooltip(false)
  }, [])

  const subtext = (() => {
    if (notation.length === 0) return { text: 'Try: 4d6L, 1d20+5, 2d8!', variant: 'hint' }
    if (isValid) return { text: 'Valid notation', variant: 'valid' }
    return { text: 'Invalid notation', variant: 'invalid' }
  })()

  return (
    <div className="roller-playground">
      <div className="roller-playground-row">
        <input
          type="text"
          className="roller-playground-input"
          value={notation}
          onChange={handleChange}
          onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
          placeholder="4d6L"
          spellCheck={false}
          autoComplete="off"
          aria-label="Dice notation"
        />
        <button
          className="roller-playground-btn"
          onClick={handleRoll}
          disabled={!isValid || state.status === 'rolling'}
        >
          {state.status === 'rolling' ? (
            <span className="roller-playground-spinner" aria-hidden="true" />
          ) : state.status === 'result' ? (
            'Reroll'
          ) : (
            'Roll'
          )}
        </button>
      </div>
      <p className={`roller-playground-subtext roller-playground-subtext--${subtext.variant}`}>
        {subtext.text}
      </p>
      {state.status === 'result' && (
        <div className="roller-playground-chip-wrap">
          <div
            className="roller-playground-chip"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="roller-playground-chip-dot" aria-hidden="true" />
            <span className="roller-playground-chip-value">{state.total}</span>
            {showTooltip && (
              <div className="roller-playground-tooltip" role="tooltip">
                <RollTooltip breakdown={state.breakdown} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RollTooltip({ breakdown }: { readonly breakdown: RollBreakdown }): React.JSX.Element {
  const { notation, description, rolled, kept, diceTotal, total } = breakdown
  const hasDropped = rolled.length !== kept.length
  const hasArithmetic = diceTotal !== total

  return (
    <div className="roller-tooltip-inner">
      <div className="roller-tooltip-notation">{notation}</div>
      {description.length > 0 && (
        <div className="roller-tooltip-desc">{description.join(', ')}</div>
      )}
      <div className="roller-tooltip-divider" />
      <div className="roller-tooltip-row">
        <span className="roller-tooltip-label">Rolled</span>
        <span className="roller-tooltip-dice">{rolled.join('  ')}</span>
      </div>
      {hasDropped && (
        <div className="roller-tooltip-row">
          <span className="roller-tooltip-label">Kept</span>
          <span className="roller-tooltip-dice">{kept.join('  ')}</span>
        </div>
      )}
      {hasArithmetic && (
        <div className="roller-tooltip-row">
          <span className="roller-tooltip-label">Dice</span>
          <span>{diceTotal}</span>
        </div>
      )}
      <div className="roller-tooltip-total">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}
```

**Notes:**
- `state.status === 'rolling'` unmounts the chip — so on reroll, the chip always remounts fresh, re-triggering the CSS entry animation
- `clearTimeout` before each new roll prevents double-firing if the user clicks rapidly
- `result.rolls[0]` is always defined for valid single-notation rolls

### Step 2: Commit

```bash
git add apps/site/src/components/playground/RollerPlayground.tsx
git commit -m "feat(site): add RollerPlayground React component"
```

---

## Task 3: Create `RollerPlayground.css`

**Files:**
- Create: `apps/site/src/components/playground/RollerPlayground.css`

### Step 1: Write the styles

Create `apps/site/src/components/playground/RollerPlayground.css`:

```css
/* ===== Container ===== */
.roller-playground {
  max-width: 36rem;
  width: 100%;
}

/* ===== Input row ===== */
.roller-playground-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.roller-playground-input {
  flex: 1;
  padding: 0.65rem 1rem;
  font-family: var(--sl-font-mono);
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--sl-color-gray-4);
  border-radius: 0.5rem;
  color: var(--sl-color-white);
  outline: none;
  transition: border-color 0.15s ease;
}

.roller-playground-input:focus {
  border-color: var(--sl-color-accent);
}

:root[data-theme='light'] .roller-playground-input {
  background: rgba(255, 255, 255, 0.8);
  color: var(--sl-color-black);
}

/* ===== Button ===== */
.roller-playground-btn {
  padding: 0.65rem 1.5rem;
  background: var(--sl-color-accent);
  color: var(--sl-color-black);
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: filter 0.15s ease;
  min-width: 5.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sl-font);
}

.roller-playground-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

.roller-playground-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Spinner ===== */
.roller-playground-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(0, 0, 0, 0.3);
  border-top-color: rgba(0, 0, 0, 0.85);
  border-radius: 50%;
  animation: roller-spin 0.6s linear infinite;
}

@keyframes roller-spin {
  to { transform: rotate(360deg); }
}

/* ===== Subtext ===== */
.roller-playground-subtext {
  font-size: 0.8rem;
  margin: 0.4rem 0 0;
  min-height: 1.1rem;
  transition: color 0.15s ease;
}

.roller-playground-subtext--hint  { color: var(--sl-color-gray-3); }
.roller-playground-subtext--valid  { color: var(--sl-color-accent-high); }
.roller-playground-subtext--invalid { color: #f97583; }

/* ===== Chip wrap ===== */
.roller-playground-chip-wrap {
  margin-top: 0.75rem;
  min-height: 2.25rem;
  display: flex;
  align-items: center;
}

/* ===== Chip ===== */
.roller-playground-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem 0.4rem 0.7rem;
  background: var(--sl-color-gray-6);
  border: 1px solid var(--sl-color-gray-4);
  border-radius: 2rem;
  font-family: var(--sl-font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: default;
  user-select: none;
  animation: chip-enter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes chip-enter {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

:root[data-theme='light'] .roller-playground-chip {
  background: var(--sl-color-gray-7, #f3f4f6);
}

.roller-playground-chip-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--sl-color-accent);
  flex-shrink: 0;
}

.roller-playground-chip-value { color: var(--sl-color-white); }

:root[data-theme='light'] .roller-playground-chip-value { color: var(--sl-color-black); }

/* ===== Tooltip ===== */
.roller-playground-tooltip {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  z-index: 100;
  pointer-events: none;
  animation: tooltip-enter 0.1s ease both;
}

@keyframes tooltip-enter {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.roller-tooltip-inner {
  background: var(--sl-color-bg-nav, var(--sl-color-gray-6));
  border: 1px solid var(--sl-color-gray-4);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  min-width: 12rem;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  font-size: 0.8rem;
  font-family: var(--sl-font);
}

.roller-tooltip-notation {
  font-family: var(--sl-font-mono);
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--sl-color-accent-high);
  margin-bottom: 0.2rem;
}

.roller-tooltip-desc {
  color: var(--sl-color-gray-2);
  font-size: 0.75rem;
  margin-bottom: 0.4rem;
}

.roller-tooltip-divider {
  height: 1px;
  background: var(--sl-color-gray-5);
  margin: 0.4rem 0;
}

.roller-tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 0.1rem 0;
}

.roller-tooltip-label { color: var(--sl-color-gray-3); }

.roller-tooltip-dice {
  font-family: var(--sl-font-mono);
  letter-spacing: 0.05em;
}

.roller-tooltip-total {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid var(--sl-color-gray-5);
  font-weight: 700;
}
```

### Step 2: Commit

```bash
git add apps/site/src/components/playground/RollerPlayground.css
git commit -m "feat(site): add RollerPlayground CSS"
```

---

## Task 4: Integrate into `index.astro`

**Files:**
- Modify: `apps/site/src/pages/index.astro`

### Step 1: Add the React component import

In the frontmatter (between `---` at the top), add this import after line 5 (after the `packageData` import):

```typescript
import RollerPlayground from '../components/playground/RollerPlayground'
```

### Step 2: Insert the component into the hero

Find this block inside the hero section (around lines 47–58):

```html
        <p class="hero-subtitle">
          Built for developers who take their dice seriously.
        </p>
        <div class="hero-actions">
```

Replace it with:

```html
        <p class="hero-subtitle">
          Built for developers who take their dice seriously.
        </p>
        <div class="roller-playground-wrap">
          <RollerPlayground client:only="react" />
        </div>
        <div class="hero-actions">
```

### Step 3: Remove the static `.code-example` section

Delete the entire HTML block that looks like this (around lines 62–84):

```html
    <!-- Quick Code Example -->
    <section class="code-example">
      <div class="section-inner">
        <h2 class="section-heading">Roll dice in seconds</h2>
        <div class="code-block">
          <div class="code-header">
            ...
          </div>
          <pre><code>...</code></pre>
        </div>
        <p class="code-caption">
          Install with <code>bun add @randsum/roller</code> or <code>npm install @randsum/roller</code>
        </p>
      </div>
    </section>
```

Delete this section completely.

### Step 4: Add `.roller-playground-wrap` CSS to the hero styles

In the `<style>` block, find the `.hero-actions` CSS (around line 325). Add this block immediately after the closing `}` of `.hero-actions`:

```css
  /* ===== Playground ===== */
  .roller-playground-wrap {
    margin: 1.5rem auto 0;
    max-width: 36rem;
    width: 100%;
  }
```

### Step 5: Remove the `.code-example` CSS block

Find and delete the entire code-example CSS section. It starts with the comment `/* ===== Code Example ===== */` (around line 376) and includes all these classes:

- `.code-example`
- `.code-block`
- `.code-header`
- `.code-dots`
- `.dot`, `.dot-red`, `.dot-yellow`, `.dot-green`
- `.code-block pre`
- `.code-block code`
- `.kw`, `.str`, `.fn`, `.cm`
- `:root[data-theme='light'] .str` and `.fn`
- `.code-caption` and `.code-caption code`

Delete from the `/* ===== Code Example ===== */` comment through the end of `.code-caption code { ... }`.

### Step 6: Commit

```bash
git add apps/site/src/pages/index.astro
git commit -m "feat(site): replace static code example with RollerPlayground in hero"
```

---

## Task 5: Verify and finish

### Step 1: Run all site tests

```bash
bun run --filter @randsum/site test
```

Expected: All tests pass (includes 7 new `formatBreakdown` tests).

### Step 2: Typecheck

```bash
bun run --filter @randsum/site typecheck
```

Expected: No TypeScript errors.

### Step 3: Visual check with dev server

```bash
bun run site:dev
```

Open http://localhost:4321. Verify:

1. Hero shows input pre-filled `4d6L`, "Roll" button to the right, "Valid notation" subtext in accent color
2. Clicking Roll: button shows spinner ~300ms, then `● 14` chip appears with bounce animation
3. Button text becomes "Reroll"
4. Hovering chip shows tooltip: notation, description, Rolled row, optionally Kept row, Total row
5. Typing invalid notation: subtext turns red "Invalid notation", button disabled
6. Typing valid notation: button re-enables; changing input hides the chip
7. Pressing Enter in the input triggers a roll
8. The static "Roll dice in seconds" code block section is gone

### Step 4: Fix any formatter issues

If pre-commit hook reformats and fails:

```bash
git add -A
git commit -m "chore(site): apply formatting"
```
