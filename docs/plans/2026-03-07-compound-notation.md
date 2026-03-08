# Compound Notation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the RollerPlayground correctly tokenize and display compound dice notation like `1d6+1d20`.

**Architecture:** Three focused changes — fix the tokenizer's new-pool detection, update the playground's state to hold all roll records, and update the result overlay to render per-pool breakdowns when there are multiple pools.

**Tech Stack:** TypeScript, React, bun:test, CSS modules (flat class names)

---

## Background

The roller engine already handles compound notation correctly:
- `isDiceNotation("1d6+1d20")` → `true`
- `roll("1d6+1d20")` → `{ rolls: [record1, record2], total: N }`

The bug is entirely in the playground's tokenizer and result display.

**How the engine parses `1d6+1d20`:**
`notationToOptions` finds two core matches via the global pattern `/[+-]?\d+[Dd][1-9]\d*/g`,
then `listOfNotations` slices them into `["1d6", "+1d20"]`.
Each is parsed separately. `+1d20` means: 1d20 with `arithmetic: 'add'`.

**Why the tokenizer is wrong:**
`parseFrom` reaches `+1d20` and runs the MODIFIERS loop. The `plus` pattern `/^\+\d+/` matches `+1`, consuming it as an arithmetic modifier. `d20` has no pattern → becomes `unknown`.

---

## Task 1: Test the tokenizer for compound notation

**Files:**
- Create: `packages/component-library/__tests__/tokenize.test.ts`

**Step 1: Create the test file**

```ts
import { describe, expect, test } from 'bun:test'
import { tokenize } from '../src/components/RollerPlayground/tokenize'

describe('tokenize — compound notation', () => {
  test('1d6+1d20 produces two core tokens', () => {
    const tokens = tokenize('1d6+1d20')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({ type: 'core', text: '1d6' })
    expect(tokens[1]).toMatchObject({ type: 'core', text: '+1d20' })
  })

  test('1d6+5 still treats +5 as arithmetic (not a pool)', () => {
    const tokens = tokenize('1d6+5')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({ type: 'core', text: '1d6' })
    expect(tokens[1]).toMatchObject({ type: 'plus', text: '+5' })
  })

  test('1d6+1d20L produces core, core, dropLowest', () => {
    const tokens = tokenize('1d6+1d20L')
    expect(tokens).toHaveLength(3)
    expect(tokens[0]).toMatchObject({ type: 'core', text: '1d6' })
    expect(tokens[1]).toMatchObject({ type: 'core', text: '+1d20' })
    expect(tokens[2]).toMatchObject({ type: 'dropLowest', text: 'L' })
  })

  test('second core description is english', () => {
    const tokens = tokenize('1d6+1d20')
    expect(tokens[1]?.description).toBe('Roll 1 20-sided die')
  })
})
```

**Step 2: Run to confirm it fails**

```bash
bun test packages/component-library/__tests__/tokenize.test.ts
```

Expected: 4 failing tests (tokenize produces wrong token types for compound notation).

---

## Task 2: Fix `parseFrom` to detect new dice pools

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/tokenize.ts`

**Step 1: Add the new-pool check in `parseFrom`**

In `parseFrom()`, insert this block **before** the `for (const entry of MODIFIERS)` loop:

```ts
// A second dice pool (e.g. +1d20 in "1d6+1d20") must be detected before
// the plus/minus modifier patterns would consume the leading +/- sign.
const newPoolMatch = remaining.match(/^[+-]\d+[Dd]\d+/)
if (newPoolMatch) {
  const text = newPoolMatch[0]
  tokens.push({
    text,
    type: 'core',
    start: cursor,
    end: cursor + text.length,
    description: describeCoreToken(text)
  })
  return parseFrom(notation, cursor + text.length, tokens)
}
```

The full updated `parseFrom` will look like:

```ts
function parseFrom(notation: string, cursor: number, tokens: Token[]): readonly Token[] {
  if (cursor >= notation.length) return tokens

  const remaining = notation.slice(cursor)

  const newPoolMatch = remaining.match(/^[+-]\d+[Dd]\d+/)
  if (newPoolMatch) {
    const text = newPoolMatch[0]
    tokens.push({
      text,
      type: 'core',
      start: cursor,
      end: cursor + text.length,
      description: describeCoreToken(text)
    })
    return parseFrom(notation, cursor + text.length, tokens)
  }

  for (const entry of MODIFIERS) {
    const m = remaining.match(entry.pattern)
    if (m) {
      const text = m[0]
      tokens.push({
        text,
        type: entry.type,
        start: cursor,
        end: cursor + text.length,
        description: entry.describe(text)
      })
      return parseFrom(notation, cursor + text.length, tokens)
    }
  }

  appendUnknown(tokens, notation[cursor] ?? '', cursor)
  return parseFrom(notation, cursor + 1, tokens)
}
```

**Step 2: Run the tests**

```bash
bun test packages/component-library/__tests__/tokenize.test.ts
```

Expected: all 4 tests pass.

**Step 3: Commit**

```bash
git add packages/component-library/__tests__/tokenize.test.ts \
        packages/component-library/src/components/RollerPlayground/tokenize.ts
git commit -m "feat(component-library): tokenize compound dice notation as multiple core tokens"
```

---

## Task 3: Update `PlaygroundState` and `handleRoll`

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx:7-10,107-128`

**Step 1: Update the state type**

Change the `result` variant of `PlaygroundState`:

```ts
// before
| { status: 'result'; total: number; record: RollRecord }

// after
| { status: 'result'; total: number; records: readonly RollRecord[] }
```

**Step 2: Update `handleRoll`**

```ts
// before
if (!result.rolls[0]) return
setState({ status: 'result', total: result.total, record: result.rolls[0] })

// after
if (result.rolls.length === 0) return
setState({ status: 'result', total: result.total, records: result.rolls })
```

**Step 3: Update the state.record reference in the overlay**

There are two places that use `state.record`. Change both:

In the total display section and `RollTooltip` call:
```tsx
// before
<RollTooltip record={state.record} />

// after
<RollTooltip records={state.records} />
```

Also find where `state.record` is used to display `state.total` in the chip — those just use `state.total` which doesn't change.

**Step 4: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx
git commit -m "feat(component-library): store all roll records in playground state"
```

---

## Task 4: Update `RollTooltip` to handle multiple pools

**Files:**
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx:663-701`
- Modify: `packages/component-library/src/components/RollerPlayground/RollerPlayground.css`

**Step 1: Extract single-pool rendering into `PoolSteps`**

Replace the existing `RollTooltip` with:

```tsx
function PoolSteps({ record }: { readonly record: RollRecord }): React.JSX.Element {
  const steps = computeSteps(record)
  return (
    <>
      {steps.map((step, i) => {
        if (step.kind === 'divider') {
          return <div key={`div-${i}`} className="roller-tooltip-divider" />
        }
        if (step.kind === 'arithmetic') {
          return (
            <div key={i} className="roller-tooltip-row">
              <span className="roller-tooltip-label">{step.label}</span>
              <span className="roller-tooltip-dice roller-tooltip-dice--arithmetic">
                {step.display}
              </span>
            </div>
          )
        }
        if (step.kind === 'rolls') {
          return (
            <div key={i} className="roller-tooltip-row">
              <span className="roller-tooltip-label">{step.label}</span>
              <DiceGroup unchanged={step.unchanged} removed={step.removed} added={step.added} />
            </div>
          )
        }
        return (
          <div key="finalRolls" className="roller-tooltip-row roller-tooltip-row--final">
            <span className="roller-tooltip-label">Final rolls</span>
            <span className="roller-tooltip-dice">
              {formatAsMath(step.rolls, step.arithmeticDelta)}
            </span>
          </div>
        )
      })}
    </>
  )
}

export function RollTooltip({
  records
}: {
  readonly records: readonly RollRecord[]
}): React.JSX.Element {
  if (records.length === 1) {
    return (
      <div className="roller-tooltip-inner">
        <PoolSteps record={records[0]!} />
      </div>
    )
  }

  return (
    <div className="roller-tooltip-inner">
      {records.map((record, i) => (
        <React.Fragment key={i}>
          <div className="roller-tooltip-pool-header">{record.notation}</div>
          <PoolSteps record={record} />
          {i < records.length - 1 && <div className="roller-tooltip-pool-divider" />}
        </React.Fragment>
      ))}
    </div>
  )
}
```

**Step 2: Add CSS for pool header and divider**

In `RollerPlayground.css`, find the `/* ===== Tooltip =====` section and add:

```css
.roller-tooltip-pool-header {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.7rem;
  opacity: 0.5;
  padding: 0.15rem 0;
  letter-spacing: 0.02em;
}

.roller-tooltip-pool-divider {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 0.35rem 0;
}
```

**Step 3: Run the full component-library typecheck**

```bash
bun run --filter @randsum/component-library typecheck
```

Expected: no errors.

**Step 4: Commit**

```bash
git add packages/component-library/src/components/RollerPlayground/RollerPlayground.tsx \
        packages/component-library/src/components/RollerPlayground/RollerPlayground.css
git commit -m "feat(component-library): show per-pool breakdown in result overlay for compound notation"
```

---

## Task 5: Manual smoke test

Start the dev server and verify the following scenarios:

```bash
bun run site:dev
# open http://localhost:4321
```

| Input | Expected tokenization | Expected result overlay |
|-------|-----------------------|------------------------|
| `1d6` | single green core | single pool, "Rolled [N]" |
| `1d6+5` | core + green plus | single pool, "Rolled [N]", "Add +5" |
| `1d6+1d20` | two core tokens (green) | two pool sections labeled `1d6` and `+1d20` |
| `4d6L+1d20` | core + dropLowest + core | two pools, first shows drop step |
| `1d6+1d20+5` | core + core + plus | two pools, `+5` belongs to second pool's steps |

**Step 1: Final commit if all good**

```bash
git add -A
git commit -m "chore: verify compound notation playground smoke tests"
```

---

## Summary

| Task | File | Change |
|------|------|--------|
| 1 | `__tests__/tokenize.test.ts` | Write failing tests |
| 2 | `tokenize.ts` | Add new-pool check before MODIFIERS loop |
| 3 | `RollerPlayground.tsx` | `record` → `records`, store all rolls |
| 4 | `RollerPlayground.tsx` + `.css` | Multi-pool `RollTooltip`, pool header style |
| 5 | — | Manual smoke test |
