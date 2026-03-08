# TUI / Playground Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the CLI TUI (`apps/cli/src/tui/`) to feature parity with the web `DicePlayground` — adding game mode, rich history display, clear history, and mode toggle.

**Architecture:** Unify `HistoryEntry` shape across notation and game rolls, port `formatResult` helper, add `GameModePanel` with 6 game systems driven by keyboard-navigable field widgets, and wire a mode toggle in `App.tsx`. All field interaction is handled by a single `useInput` in `GameModePanel` to avoid listener conflicts.

**Tech Stack:** Ink 5.2, ink-text-input 6.0, bun:test, `@randsum/roller` (validateNotation), `@randsum/fifth/blades/daggerheart/pbta/root-rpg/salvageunion` (all ^3.0.0)

---

## Before you start

```bash
# Verify tests pass before touching anything
bun run --filter @randsum/cli test

# Launch TUI to see current state
bun run --filter @randsum/cli dev -- -i
```

All source lives in `apps/cli/src/tui/`. All tests live in `apps/cli/__tests__/tui/`.

---

### Task 1: Port `formatResult` helper

**Files:**
- Create: `apps/cli/src/tui/helpers/formatResult.ts`
- Create: `apps/cli/__tests__/tui/formatResult.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/cli/__tests__/tui/formatResult.test.ts
import { describe, expect, test } from 'bun:test'
import { roll } from '@randsum/roller'
import { formatResult, isFormattedError } from '../../src/tui/helpers/formatResult'

describe('formatResult', () => {
  test('returns total matching roll total', () => {
    const result = roll(6)
    const formatted = formatResult(result)
    expect(isFormattedError(formatted)).toBe(false)
    if (!isFormattedError(formatted)) {
      expect(formatted.total).toBe(result.total)
    }
  })

  test('returns rolls as array of number arrays', () => {
    const result = roll('2d6')
    const formatted = formatResult(result)
    if (!isFormattedError(formatted)) {
      expect(formatted.rolls).toHaveLength(1)
      expect(formatted.rolls[0]).toHaveLength(2)
    }
  })

  test('returns description string', () => {
    const result = roll('2d6')
    const formatted = formatResult(result)
    if (!isFormattedError(formatted)) {
      expect(typeof formatted.description).toBe('string')
      expect(formatted.description.length).toBeGreaterThan(0)
    }
  })
})
```

**Step 2: Run test to verify it fails**

```bash
bun test apps/cli/__tests__/tui/formatResult.test.ts
```
Expected: FAIL — `Cannot find module '../../src/tui/helpers/formatResult'`

**Step 3: Write the implementation**

```typescript
// apps/cli/src/tui/helpers/formatResult.ts
// SYNC: apps/site/src/components/playground/helpers/formatResult.ts
import type { RollerRollResult } from '@randsum/roller'

export interface FormattedResult {
  readonly total: number
  readonly rolls: readonly (readonly number[])[]
  readonly description: string
}

export interface FormattedError {
  readonly error: string
}

export type FormatResultOutput = FormattedResult | FormattedError

export function isFormattedError(output: FormatResultOutput): output is FormattedError {
  return 'error' in output
}

export function formatResult(result: RollerRollResult): FormatResultOutput {
  const rolls = result.rolls.map(record => record.rolls)
  const descriptions = result.rolls.flatMap(record => record.description).filter(Boolean)
  const description = descriptions.length > 0 ? descriptions.join(', ') : `Total: ${result.total}`

  return {
    total: result.total,
    rolls,
    description
  }
}
```

**Step 4: Run test to verify it passes**

```bash
bun test apps/cli/__tests__/tui/formatResult.test.ts
```
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add apps/cli/src/tui/helpers/formatResult.ts apps/cli/__tests__/tui/formatResult.test.ts
git commit -m "feat(cli): port formatResult helper from playground"
```

---

### Task 2: Unify `HistoryEntry` shape and add `clearHistory`

**Files:**
- Modify: `apps/cli/src/tui/hooks/useRollHistory.ts`
- Create: `apps/cli/__tests__/tui/useRollHistory.test.ts`

**Step 1: Write the failing tests**

```typescript
// apps/cli/__tests__/tui/useRollHistory.test.ts
import { describe, expect, test } from 'bun:test'
import { renderHook, act } from '@testing-library/react'
import { useRollHistory } from '../../src/tui/hooks/useRollHistory'

const sampleEntry = {
  notation: '1d6',
  total: 4,
  rolls: [[4]] as readonly (readonly number[])[],
  description: 'Total: 4'
}

describe('useRollHistory', () => {
  test('starts with empty history', () => {
    const { result } = renderHook(() => useRollHistory())
    expect(result.current.history).toHaveLength(0)
  })

  test('addRoll adds an entry with id and timestamp', () => {
    const { result } = renderHook(() => useRollHistory())
    act(() => { result.current.addRoll(sampleEntry) })
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0]?.id).toBe(0)
    expect(result.current.history[0]?.notation).toBe('1d6')
    expect(typeof result.current.history[0]?.timestamp).toBe('number')
  })

  test('addRoll prepends (newest first)', () => {
    const { result } = renderHook(() => useRollHistory())
    act(() => { result.current.addRoll({ ...sampleEntry, notation: 'first' }) })
    act(() => { result.current.addRoll({ ...sampleEntry, notation: 'second' }) })
    expect(result.current.history[0]?.notation).toBe('second')
    expect(result.current.history[1]?.notation).toBe('first')
  })

  test('addRoll auto-increments id', () => {
    const { result } = renderHook(() => useRollHistory())
    act(() => { result.current.addRoll(sampleEntry) })
    act(() => { result.current.addRoll(sampleEntry) })
    expect(result.current.history[0]?.id).toBe(1)
    expect(result.current.history[1]?.id).toBe(0)
  })

  test('clearHistory resets to empty', () => {
    const { result } = renderHook(() => useRollHistory())
    act(() => { result.current.addRoll(sampleEntry) })
    act(() => { result.current.clearHistory() })
    expect(result.current.history).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
bun test apps/cli/__tests__/tui/useRollHistory.test.ts
```
Expected: FAIL — wrong shape, no clearHistory, appends instead of prepends

> **Note on `@testing-library/react`**: If not available, install with `bun add -d @testing-library/react` in `apps/cli/`. Alternatively, test the hook by calling it directly as a plain function since it only uses `useState`/`useCallback` — no Ink-specific hooks. If `renderHook` proves difficult with bun:test, extract the logic to a pure function and test that.

**Step 3: Rewrite `useRollHistory.ts`**

```typescript
// apps/cli/src/tui/hooks/useRollHistory.ts
// SYNC: apps/site/src/components/playground/hooks/useRollHistory.ts
// Differences: uses string (not string|null) error type throughout; same HistoryEntry shape
import { useCallback, useState } from 'react'

export interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly rolls: readonly (readonly number[])[]
  readonly description: string
  readonly timestamp: number
}

interface UseRollHistoryReturn {
  readonly history: readonly HistoryEntry[]
  readonly addRoll: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  readonly clearHistory: () => void
}

export function useRollHistory(): UseRollHistoryReturn {
  const [history, setHistory] = useState<readonly HistoryEntry[]>([])
  const [nextId, setNextId] = useState(0)

  const addRoll = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void => {
      setHistory(prev => [{ ...entry, id: nextId, timestamp: Date.now() }, ...prev])
      setNextId(prev => prev + 1)
    },
    [nextId]
  )

  const clearHistory = useCallback((): void => {
    setHistory([])
  }, [])

  return { history, addRoll, clearHistory }
}
```

**Step 4: Run test to verify it passes**

```bash
bun test apps/cli/__tests__/tui/useRollHistory.test.ts
```
Expected: PASS (5 tests)

**Step 5: Run full suite to check nothing broke**

```bash
bun run --filter @randsum/cli test
```
Expected: All pass (existing tests still pass)

**Step 6: Commit**

```bash
git add apps/cli/src/tui/hooks/useRollHistory.ts apps/cli/__tests__/tui/useRollHistory.test.ts
git commit -m "feat(cli): unify HistoryEntry shape and add clearHistory"
```

---

### Task 3: Update `RollHistory` display

**Files:**
- Modify: `apps/cli/src/tui/components/RollHistory.tsx`

The new `HistoryEntry` shape gives us `total`, `rolls`, and `description`. We display each entry with three lines: notation+total, dice pools, description. Cap at 10 visible entries.

**Step 1: Rewrite `RollHistory.tsx`**

```typescript
// apps/cli/src/tui/components/RollHistory.tsx
import { Box, Text } from 'ink'
import type { HistoryEntry } from '../hooks/useRollHistory'

interface RollHistoryProps {
  readonly history: readonly HistoryEntry[]
  readonly onClear: () => void
}

const MAX_VISIBLE = 10

export function RollHistory({ history, onClear: _onClear }: RollHistoryProps): React.JSX.Element {
  if (history.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor italic>
          No rolls yet.
        </Text>
      </Box>
    )
  }

  const visible = history.slice(0, MAX_VISIBLE)
  const overflow = history.length - MAX_VISIBLE

  return (
    <Box flexDirection="column" paddingX={1} gap={0}>
      {visible.map(entry => (
        <Box key={entry.id} flexDirection="column" marginBottom={1}>
          <Box justifyContent="space-between">
            <Text color="cyan">{`> ${entry.notation}`}</Text>
            <Text bold>{` ${entry.total}`}</Text>
          </Box>
          <Box paddingLeft={2}>
            {entry.rolls.map((pool, i) => (
              <Text key={i} dimColor>{`[${pool.join(', ')}]`}</Text>
            ))}
          </Box>
          <Box paddingLeft={2}>
            <Text color="gray">{entry.description}</Text>
          </Box>
        </Box>
      ))}
      {overflow > 0 && (
        <Text dimColor>{`(${overflow} more)`}</Text>
      )}
      <Text dimColor>{'[Ctrl+L to clear]'}</Text>
    </Box>
  )
}
```

**Step 2: Run full suite**

```bash
bun run --filter @randsum/cli test
```
Expected: All pass — `RollHistory` has no pure-logic tests yet, so no failures.

**Step 3: Manual smoke test**

```bash
bun run --filter @randsum/cli dev -- -i
```
Type `2d6`, press Enter. Verify you see:
- `> 2d6` with total on same line
- `[n, n]` pools line
- description line
- `[Ctrl+L to clear]` hint

**Step 4: Commit**

```bash
git add apps/cli/src/tui/components/RollHistory.tsx
git commit -m "feat(cli): rich roll history display with total, pools, description"
```

---

### Task 4: Update `App.tsx` to use new hook signature

The hook's `addRoll` signature changed. `App.tsx` calls `addRoll(trimmed, result)` — that must become the new structured form. Also replace `try/catch` with `result.error` check.

**Files:**
- Modify: `apps/cli/src/tui/App.tsx`

**Step 1: Update `App.tsx` — hook wiring and never-throw pattern**

Replace the `handleSubmit` function and the `useRollHistory` call:

```typescript
// At top, add these imports:
import { validateNotation } from '@randsum/roller'
import { formatResult, isFormattedError } from './helpers/formatResult'

// Replace:
//   const { history, addRoll } = useRollHistory()
// With:
const { history, addRoll, clearHistory } = useRollHistory()

// Replace the entire handleSubmit:
const handleSubmit = (value: string): void => {
  const trimmed = value.trim()
  if (trimmed === '') return

  const validation = validateNotation(trimmed)
  if (!validation.valid) return

  const result = roll(...validation.notation)
  if (result.error) return

  const formatted = formatResult(result)
  if (isFormattedError(formatted)) return

  addRoll({
    notation: trimmed,
    total: formatted.total,
    rolls: formatted.rolls,
    description: formatted.description
  })
  setInput('')
}
```

Also add `clearHistory` to the existing `useInput` handler:
```typescript
useInput((_input, key) => {
  if (key.tab) {
    setFocus(prev => (prev === 'input' ? 'toolbar' : 'input'))
  }
  // Ctrl+L clears history from any focus zone
  if (key.ctrl && _input === 'l') {
    clearHistory()
  }
})
```

Remove `const [error, setError] = useState('')` — no longer needed.

Pass `onClear={clearHistory}` to `<RollHistory>`:
```typescript
<RollHistory history={history} onClear={clearHistory} />
```

**Step 2: Run full suite**

```bash
bun run --filter @randsum/cli test
```
Expected: All pass.

**Step 3: Typecheck**

```bash
bun run --filter @randsum/cli typecheck
```
Expected: No errors.

**Step 4: Manual smoke test**

```bash
bun run --filter @randsum/cli dev -- -i
```
Roll a few dice. Press Ctrl+L. Verify history clears.

**Step 5: Commit**

```bash
git add apps/cli/src/tui/App.tsx
git commit -m "feat(cli): wire clearHistory, never-throw roll pattern, validateNotation"
```

---

### Task 5: Simplify `NotationInput` — remove external error prop

**Files:**
- Modify: `apps/cli/src/tui/components/NotationInput.tsx`

**Step 1: Rewrite `NotationInput.tsx`**

```typescript
// apps/cli/src/tui/components/NotationInput.tsx
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { useValidation } from '../hooks/useValidation'

interface NotationInputProps {
  readonly value: string
  readonly active: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
}

export function NotationInput({
  value,
  onChange,
  onSubmit,
  active
}: NotationInputProps): React.JSX.Element {
  const { validationError } = useValidation(value)
  const hasError = validationError !== ''

  const borderColor = hasError ? 'red' : active ? 'green' : 'gray'
  const promptColor = hasError ? 'red' : 'green'

  return (
    <Box borderStyle="single" borderColor={borderColor} paddingX={1} flexDirection="column">
      <Box>
        <Text color={promptColor}>{'> '}</Text>
        <TextInput value={value} onChange={onChange} onSubmit={onSubmit} focus={active} />
      </Box>
      {hasError && <Text color="red">{validationError}</Text>}
    </Box>
  )
}
```

**Step 2: Remove `error` prop from App.tsx call site**

In `App.tsx`, find the `<NotationInput>` usage and remove `error={error}`. Since `error` state was removed in Task 4, this should already be clean.

**Step 3: Run full suite + typecheck**

```bash
bun run --filter @randsum/cli test && bun run --filter @randsum/cli typecheck
```
Expected: All pass.

**Step 4: Commit**

```bash
git add apps/cli/src/tui/components/NotationInput.tsx apps/cli/src/tui/App.tsx
git commit -m "feat(cli): remove external error prop from NotationInput"
```

---

### Task 6: Create `gameConfigs.ts` for TUI

**Files:**
- Create: `apps/cli/src/tui/gameConfigs.ts`

**Step 1: Create the file**

```typescript
// apps/cli/src/tui/gameConfigs.ts
// SYNC: apps/site/src/components/playground/gameConfigs.ts
// Differences: color values are Ink color strings (not CSS variables)
export interface FieldConfig {
  readonly name: string
  readonly label: string
  readonly type: 'number' | 'select' | 'boolean'
  readonly options?: readonly string[]
  readonly min?: number
  readonly max?: number
  readonly defaultValue: string | number | boolean
}

export interface GameConfig {
  readonly id: string
  readonly name: string
  readonly color: string   // Ink color string, not CSS variable
  readonly fields: readonly FieldConfig[]
}

export const GAME_CONFIGS: readonly GameConfig[] = [
  {
    id: 'fifth',
    name: 'D&D 5e',
    color: 'red',
    fields: [
      { name: 'modifier', label: 'Modifier', type: 'number', min: -30, max: 30, defaultValue: 0 },
      {
        name: 'rollingWith',
        label: 'Rolling With',
        type: 'select',
        options: ['Normal', 'Advantage', 'Disadvantage'],
        defaultValue: 'Normal'
      }
    ]
  },
  {
    id: 'blades',
    name: 'Blades in the Dark',
    color: 'magenta',
    fields: [
      { name: 'diceCount', label: 'Dice Pool', type: 'number', min: 0, max: 10, defaultValue: 2 }
    ]
  },
  {
    id: 'daggerheart',
    name: 'Daggerheart',
    color: 'blue',
    fields: [
      { name: 'modifier', label: 'Modifier', type: 'number', min: -20, max: 20, defaultValue: 0 },
      {
        name: 'rollingWith',
        label: 'Rolling With',
        type: 'select',
        options: ['Normal', 'Advantage', 'Disadvantage'],
        defaultValue: 'Normal'
      },
      { name: 'amplifyHope', label: 'Amplify Hope', type: 'boolean', defaultValue: false },
      { name: 'amplifyFear', label: 'Amplify Fear', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'pbta',
    name: 'Powered by the Apocalypse',
    color: 'green',
    fields: [
      { name: 'stat', label: 'Stat', type: 'number', min: -3, max: 5, defaultValue: 0 },
      { name: 'forward', label: 'Forward', type: 'number', min: -5, max: 5, defaultValue: 0 },
      { name: 'ongoing', label: 'Ongoing', type: 'number', min: -5, max: 5, defaultValue: 0 },
      { name: 'advantage', label: 'Advantage', type: 'boolean', defaultValue: false },
      { name: 'disadvantage', label: 'Disadvantage', type: 'boolean', defaultValue: false }
    ]
  },
  {
    id: 'root-rpg',
    name: 'Root RPG',
    color: 'yellow',
    fields: [
      { name: 'bonus', label: 'Bonus', type: 'number', min: -20, max: 20, defaultValue: 0 }
    ]
  },
  {
    id: 'salvageunion',
    name: 'Salvage Union',
    color: 'cyan',
    fields: [
      {
        name: 'tableName',
        label: 'Table',
        type: 'select',
        options: ['Core Mechanic'],
        defaultValue: 'Core Mechanic'
      }
    ]
  }
] as const
```

**Step 2: Run typecheck**

```bash
bun run --filter @randsum/cli typecheck
```
Expected: No errors.

**Step 3: Commit**

```bash
git add apps/cli/src/tui/gameConfigs.ts
git commit -m "feat(cli): add gameConfigs with Ink-compatible colors"
```

---

### Task 7: Add game package dependencies

**Files:**
- Modify: `apps/cli/package.json`

**Step 1: Add game packages to dependencies**

In `apps/cli/package.json`, add to the `"dependencies"` object:

```json
"@randsum/blades": "^3.0.0",
"@randsum/daggerheart": "^3.0.0",
"@randsum/fifth": "^3.0.0",
"@randsum/pbta": "^3.0.0",
"@randsum/root-rpg": "^3.0.0",
"@randsum/salvageunion": "^3.0.0"
```

**Step 2: Install**

```bash
bun install
```
Expected: Packages resolve. No errors. (They already exist in the monorepo workspace.)

**Step 3: Verify imports work**

```bash
bun run --filter @randsum/cli typecheck
```
Expected: No errors.

**Step 4: Commit**

```bash
git add apps/cli/package.json bun.lock
git commit -m "feat(cli): add game package dependencies for game mode"
```

---

### Task 8: Create reusable field components

**Files:**
- Create: `apps/cli/src/tui/components/fields/SelectField.tsx`
- Create: `apps/cli/src/tui/components/fields/NumberField.tsx`
- Create: `apps/cli/src/tui/components/fields/BooleanField.tsx`

These are pure display components — they receive `focused` and `value` as props, rendering only. All `useInput` key handling lives in the parent `GameModePanel`.

**Step 1: Create `SelectField.tsx`**

Modeled on `DiceToolbar`'s cycle + highlight pattern:

```typescript
// apps/cli/src/tui/components/fields/SelectField.tsx
import { Box, Text } from 'ink'

interface SelectFieldProps {
  readonly label: string
  readonly options: readonly string[]
  readonly value: string
  readonly focused: boolean
}

export function SelectField({ label, options, value, focused }: SelectFieldProps): React.JSX.Element {
  const color = focused ? 'cyan' : 'white'
  const labelColor = focused ? 'cyan' : 'gray'
  const arrows = focused ? { left: '◄ ', right: ' ►' } : { left: '  ', right: '  ' }
  const isFirst = options[0] === value
  const isLast = options[options.length - 1] === value

  return (
    <Box gap={1}>
      <Text color={labelColor} bold={focused}>{label}:</Text>
      <Text dimColor={!focused && isFirst}>{arrows.left}</Text>
      <Text color={color} bold={focused}>{value}</Text>
      <Text dimColor={!focused && isLast}>{arrows.right}</Text>
    </Box>
  )
}
```

**Step 2: Create `NumberField.tsx`**

```typescript
// apps/cli/src/tui/components/fields/NumberField.tsx
import { Box, Text } from 'ink'

interface NumberFieldProps {
  readonly label: string
  readonly value: number
  readonly min?: number
  readonly max?: number
  readonly focused: boolean
}

export function NumberField({ label, value, min, max, focused }: NumberFieldProps): React.JSX.Element {
  const color = focused ? 'cyan' : 'white'
  const labelColor = focused ? 'cyan' : 'gray'
  const arrows = focused ? { left: '◄ ', right: ' ►' } : { left: '  ', right: '  ' }
  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max
  const rangeHint = focused && min !== undefined && max !== undefined ? ` (${min}..${max})` : ''

  return (
    <Box gap={1}>
      <Text color={labelColor} bold={focused}>{label}:</Text>
      <Text dimColor={atMin}>{arrows.left}</Text>
      <Text color={color} bold={focused}>{value}</Text>
      <Text dimColor={atMax}>{arrows.right}</Text>
      {rangeHint !== '' && <Text dimColor>{rangeHint}</Text>}
    </Box>
  )
}
```

**Step 3: Create `BooleanField.tsx`**

```typescript
// apps/cli/src/tui/components/fields/BooleanField.tsx
import { Box, Text } from 'ink'

interface BooleanFieldProps {
  readonly label: string
  readonly value: boolean
  readonly focused: boolean
}

export function BooleanField({ label, value, focused }: BooleanFieldProps): React.JSX.Element {
  const labelColor = focused ? 'cyan' : 'gray'

  return (
    <Box gap={1}>
      <Text color={value ? 'green' : 'gray'}>{value ? '[ON]' : '[OFF]'}</Text>
      <Text color={labelColor} bold={focused}>{label}</Text>
      {focused && <Text dimColor>{'(Space to toggle)'}</Text>}
    </Box>
  )
}
```

**Step 4: Typecheck**

```bash
bun run --filter @randsum/cli typecheck
```
Expected: No errors.

**Step 5: Commit**

```bash
git add apps/cli/src/tui/components/fields/
git commit -m "feat(cli): add SelectField, NumberField, BooleanField display components"
```

---

### Task 9: Create `GameModePanel`

**Files:**
- Create: `apps/cli/src/tui/components/GameModePanel.tsx`

This is the largest component. It handles all game-mode keyboard input via a single `useInput` and dispatches based on `focusIndex`.

**Step 1: Write a smoke test for `executeGameRoll`**

```typescript
// apps/cli/__tests__/tui/executeGameRoll.test.ts
import { describe, expect, test } from 'bun:test'
import { executeGameRoll } from '../../src/tui/components/GameModePanel'

describe('executeGameRoll', () => {
  test('fifth returns notation, total (number), rolls, description', () => {
    const result = executeGameRoll('fifth', { modifier: 0, rollingWith: 'Normal' })
    expect(typeof result.total).toBe('number')
    expect(result.rolls.length).toBeGreaterThan(0)
    expect(result.notation).toContain('D&D 5e')
  })

  test('blades returns valid result', () => {
    const result = executeGameRoll('blades', { diceCount: 2 })
    expect(typeof result.total).toBe('number')
  })

  test('daggerheart returns valid result', () => {
    const result = executeGameRoll('daggerheart', {
      modifier: 0, rollingWith: 'Normal', amplifyHope: false, amplifyFear: false
    })
    expect(typeof result.total).toBe('number')
  })

  test('pbta returns valid result', () => {
    const result = executeGameRoll('pbta', {
      stat: 0, forward: 0, ongoing: 0, advantage: false, disadvantage: false
    })
    expect(typeof result.total).toBe('number')
  })

  test('root-rpg returns valid result', () => {
    const result = executeGameRoll('root-rpg', { bonus: 0 })
    expect(typeof result.total).toBe('number')
  })

  test('salvageunion returns valid result', () => {
    const result = executeGameRoll('salvageunion', { tableName: 'Core Mechanic' })
    expect(typeof result.total).toBe('number')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
bun test apps/cli/__tests__/tui/executeGameRoll.test.ts
```
Expected: FAIL — module not found

**Step 3: Create `GameModePanel.tsx`**

```typescript
// apps/cli/src/tui/components/GameModePanel.tsx
import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import { roll as rollFifth } from '@randsum/fifth'
import { roll as rollBlades } from '@randsum/blades'
import { roll as rollDaggerheart } from '@randsum/daggerheart'
import { roll as rollPbta } from '@randsum/pbta'
import { roll as rollRootRpg } from '@randsum/root-rpg'
import { roll as rollSalvageunion } from '@randsum/salvageunion'
import { GAME_CONFIGS } from '../gameConfigs'
import type { HistoryEntry } from '../hooks/useRollHistory'
import { SelectField } from './fields/SelectField'
import { NumberField } from './fields/NumberField'
import { BooleanField } from './fields/BooleanField'

type FieldValues = Record<string, string | number | boolean>

function getDefaultValues(config: (typeof GAME_CONFIGS)[number]): FieldValues {
  const values: FieldValues = {}
  for (const field of config.fields) {
    values[field.name] = field.defaultValue
  }
  return values
}

export function executeGameRoll(
  gameId: string,
  values: FieldValues
): Omit<HistoryEntry, 'id' | 'timestamp'> {
  switch (gameId) {
    case 'fifth': {
      const rollingWithValue = String(values['rollingWith'] ?? 'Normal')
      const rollingWith =
        rollingWithValue === 'Advantage'
          ? { advantage: true as const }
          : rollingWithValue === 'Disadvantage'
            ? { disadvantage: true as const }
            : undefined
      const result = rollFifth({ modifier: Number(values['modifier'] ?? 0), rollingWith })
      return {
        notation: `D&D 5e (mod: ${values['modifier']}, ${rollingWithValue})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `D&D 5e: ${result.result}`
      }
    }
    case 'blades': {
      const result = rollBlades(Number(values['diceCount'] ?? 2))
      return {
        notation: `Blades (${values['diceCount']}d)`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Blades: ${result.result}`
      }
    }
    case 'daggerheart': {
      const rollingWithDH = String(values['rollingWith'] ?? 'Normal')
      const result = rollDaggerheart({
        modifier: Number(values['modifier'] ?? 0),
        rollingWith: rollingWithDH === 'Normal' ? undefined : (rollingWithDH as 'Advantage' | 'Disadvantage'),
        amplifyHope: Boolean(values['amplifyHope']),
        amplifyFear: Boolean(values['amplifyFear'])
      })
      return {
        notation: `Daggerheart (mod: ${values['modifier']})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Daggerheart: ${JSON.stringify(result.result)} (total: ${result.total})`
      }
    }
    case 'pbta': {
      const result = rollPbta({
        stat: Number(values['stat'] ?? 0),
        forward: Number(values['forward'] ?? 0),
        ongoing: Number(values['ongoing'] ?? 0),
        advantage: Boolean(values['advantage']),
        disadvantage: Boolean(values['disadvantage'])
      })
      return {
        notation: `PbtA (stat: ${values['stat']})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `PbtA: ${result.result}`
      }
    }
    case 'root-rpg': {
      const result = rollRootRpg(Number(values['bonus'] ?? 0))
      return {
        notation: `Root RPG (bonus: ${values['bonus']})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Root RPG: ${result.result}`
      }
    }
    case 'salvageunion': {
      const tableName = String(values['tableName'] ?? 'Core Mechanic')
      const result = rollSalvageunion(tableName)
      return {
        notation: `Salvage Union (${tableName})`,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Salvage Union: ${JSON.stringify(result.result)}`
      }
    }
    default:
      throw new Error(`Unknown game: ${gameId}`)
  }
}

interface GameModePanelProps {
  readonly active: boolean
  readonly onGameRoll: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
}

export function GameModePanel({ active, onGameRoll }: GameModePanelProps): React.JSX.Element {
  const firstGame = GAME_CONFIGS[0]
  const [gameIndex, setGameIndex] = useState(0)
  const [fieldValues, setFieldValues] = useState<FieldValues>(
    firstGame !== undefined ? getDefaultValues(firstGame) : {}
  )
  const [focusIndex, setFocusIndex] = useState(0) // 0 = game selector, 1..N = fields, N+1 = roll button
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedGame = GAME_CONFIGS[gameIndex] ?? GAME_CONFIGS[0]

  // focusIndex layout: 0=game selector, 1..fields.length=fields, fields.length+1=roll button
  const totalFocusable = (selectedGame?.fields.length ?? 0) + 2

  useInput(
    (_char, key) => {
      if (!active || selectedGame === undefined) return

      if (key.upArrow) {
        setFocusIndex(prev => (prev > 0 ? prev - 1 : totalFocusable - 1))
        return
      }
      if (key.downArrow) {
        setFocusIndex(prev => (prev < totalFocusable - 1 ? prev + 1 : 0))
        return
      }

      if (focusIndex === 0) {
        // Game selector
        if (key.leftArrow) {
          const newIndex = gameIndex > 0 ? gameIndex - 1 : GAME_CONFIGS.length - 1
          const newGame = GAME_CONFIGS[newIndex]
          if (newGame !== undefined) {
            setGameIndex(newIndex)
            setFieldValues(getDefaultValues(newGame))
            setFocusIndex(1)
            setLastResult(null)
          }
        } else if (key.rightArrow) {
          const newIndex = gameIndex < GAME_CONFIGS.length - 1 ? gameIndex + 1 : 0
          const newGame = GAME_CONFIGS[newIndex]
          if (newGame !== undefined) {
            setGameIndex(newIndex)
            setFieldValues(getDefaultValues(newGame))
            setFocusIndex(1)
            setLastResult(null)
          }
        }
        return
      }

      const fieldFocusIndex = focusIndex - 1
      const field = selectedGame.fields[fieldFocusIndex]

      if (field !== undefined && focusIndex < totalFocusable - 1) {
        // Field focus
        if (field.type === 'number') {
          const current = Number(fieldValues[field.name] ?? field.defaultValue)
          if (key.leftArrow || key.downArrow) {
            const min = field.min ?? -Infinity
            setFieldValues(prev => ({ ...prev, [field.name]: Math.max(min, current - 1) }))
          } else if (key.rightArrow || key.upArrow) {
            const max = field.max ?? Infinity
            setFieldValues(prev => ({ ...prev, [field.name]: Math.min(max, current + 1) }))
          }
        } else if (field.type === 'select' && field.options !== undefined) {
          const options = field.options
          const currentVal = String(fieldValues[field.name] ?? field.defaultValue)
          const currentIdx = options.indexOf(currentVal)
          if (key.leftArrow) {
            const newIdx = currentIdx > 0 ? currentIdx - 1 : options.length - 1
            const newVal = options[newIdx]
            if (newVal !== undefined) setFieldValues(prev => ({ ...prev, [field.name]: newVal }))
          } else if (key.rightArrow) {
            const newIdx = currentIdx < options.length - 1 ? currentIdx + 1 : 0
            const newVal = options[newIdx]
            if (newVal !== undefined) setFieldValues(prev => ({ ...prev, [field.name]: newVal }))
          }
        } else if (field.type === 'boolean') {
          if (_char === ' ' || key.return) {
            setFieldValues(prev => ({ ...prev, [field.name]: !Boolean(prev[field.name]) }))
            return
          }
        }
      }

      // Enter rolls from any focusIndex
      if (key.return) {
        try {
          const entry = executeGameRoll(selectedGame.id, fieldValues)
          setLastResult(entry.description)
          setError(null)
          onGameRoll(entry)
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      }
    },
    { isActive: active }
  )

  if (selectedGame === undefined) return <Text color="red">No game configs loaded</Text>

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={active ? 'cyan' : 'gray'}
      paddingX={1}
    >
      {/* Game selector */}
      <Box justifyContent="center" marginBottom={1}>
        <SelectField
          label="Game"
          options={GAME_CONFIGS.map(g => g.name)}
          value={selectedGame.name}
          focused={active && focusIndex === 0}
        />
      </Box>

      {/* Dynamic fields */}
      {selectedGame.fields.map((field, i) => {
        const fieldFocused = active && focusIndex === i + 1
        const value = fieldValues[field.name] ?? field.defaultValue

        if (field.type === 'number') {
          return (
            <NumberField
              key={field.name}
              label={field.label}
              value={Number(value)}
              min={field.min}
              max={field.max}
              focused={fieldFocused}
            />
          )
        }
        if (field.type === 'select' && field.options !== undefined) {
          return (
            <SelectField
              key={field.name}
              label={field.label}
              options={field.options}
              value={String(value)}
              focused={fieldFocused}
            />
          )
        }
        if (field.type === 'boolean') {
          return (
            <BooleanField
              key={field.name}
              label={field.label}
              value={Boolean(value)}
              focused={fieldFocused}
            />
          )
        }
        return null
      })}

      {/* Roll button */}
      <Box
        marginTop={1}
        borderStyle="round"
        borderColor={active && focusIndex === totalFocusable - 1 ? selectedGame.color : 'gray'}
        paddingX={1}
        justifyContent="center"
      >
        <Text
          bold={active && focusIndex === totalFocusable - 1}
          color={active && focusIndex === totalFocusable - 1 ? selectedGame.color : 'white'}
        >
          {`Roll ${selectedGame.name}`}
        </Text>
      </Box>

      {/* Error */}
      {error !== null && <Text color="red">{error}</Text>}

      {/* Last result */}
      {lastResult !== null && (
        <Box marginTop={1} borderStyle="single" borderColor={selectedGame.color} paddingX={1}>
          <Text>{lastResult}</Text>
        </Box>
      )}

      {/* Nav hint */}
      <Text dimColor>{'↑↓ navigate · ←→ adjust · Enter roll'}</Text>
    </Box>
  )
}
```

**Step 4: Run the smoke test**

```bash
bun test apps/cli/__tests__/tui/executeGameRoll.test.ts
```
Expected: PASS (6 tests)

**Step 5: Full suite + typecheck**

```bash
bun run --filter @randsum/cli test && bun run --filter @randsum/cli typecheck
```
Expected: All pass.

**Step 6: Commit**

```bash
git add apps/cli/src/tui/components/GameModePanel.tsx apps/cli/__tests__/tui/executeGameRoll.test.ts
git commit -m "feat(cli): add GameModePanel with 6 game systems"
```

---

### Task 10: Wire mode toggle in `App.tsx`

**Files:**
- Modify: `apps/cli/src/tui/App.tsx`

**Step 1: Update `App.tsx` with full mode toggle**

Add `Mode` type, expand `FocusZone`, add game mode rendering:

```typescript
// Add to imports:
import { GameModePanel } from './components/GameModePanel'

// Add after existing type declarations:
type Mode = 'notation' | 'game'

// Add to state:
const [mode, setMode] = useState<Mode>('notation')

// Expand FocusZone type:
type FocusZone = 'input' | 'toolbar' | 'game'
```

Update the `useInput` handler to support mode switching and smart Tab cycling:

```typescript
useInput((_input, key) => {
  // 'm' toggles mode
  if (_input === 'm') {
    setMode(prev => {
      const next = prev === 'notation' ? 'game' : 'notation'
      setFocus(next === 'notation' ? 'input' : 'game')
      return next
    })
    return
  }

  // Ctrl+L clears history
  if (key.ctrl && _input === 'l') {
    clearHistory()
    return
  }

  // Tab cycles within current mode's zones
  if (key.tab) {
    if (mode === 'notation') {
      setFocus(prev => (prev === 'input' ? 'toolbar' : 'input'))
    } else {
      // game mode: only input and game zones
      setFocus(prev => (prev === 'input' ? 'game' : 'input'))
    }
  }
})
```

Add mode toggle display at the top (below RANDSUM header):

```typescript
// After the RANDSUM header Box:
<Box justifyContent="center" gap={2} marginBottom={1}>
  <Text bold={mode === 'notation'} color={mode === 'notation' ? 'cyan' : 'gray'}>
    {'[ Notation ]'}
  </Text>
  <Text bold={mode === 'game'} color={mode === 'game' ? 'cyan' : 'gray'}>
    {'[ Game ]'}
  </Text>
  <Text dimColor>{'(m to switch)'}</Text>
</Box>
```

Add game mode rendering in the wide layout (inside the `isWide` branch):

```typescript
// In wide mode, replace the fixed layout with mode-conditional:
{mode === 'notation' ? (
  <Box>
    <Box flexDirection="column" width="33%">
      <Box flexDirection="column" flexGrow={1}>
        <RollHistory history={history} onClear={clearHistory} />
      </Box>
      <Box marginY={1}><Text dimColor>{'─'.repeat(30)}</Text></Box>
      <Box paddingX={1}>
        <Text dimColor>Type notation and press Enter to roll, or use the dice buttons.</Text>
      </Box>
      <Box marginY={1}><Text dimColor>{'─'.repeat(30)}</Text></Box>
      <DiceToolbar active={focus === 'toolbar'} onSelect={handleDiceSelect} />
    </Box>
    <NotationReference />
  </Box>
) : (
  <Box>
    <Box flexDirection="column" width="50%">
      <GameModePanel active={focus === 'game'} onGameRoll={addRoll} />
    </Box>
    <Box flexDirection="column" width="50%">
      <RollHistory history={history} onClear={clearHistory} />
    </Box>
  </Box>
)}
```

Similarly update the narrow mode branch.

Also update `NotationInput` render — only show in notation mode:

```typescript
{mode === 'notation' && (
  <NotationInput
    value={input}
    onChange={setInput}
    onSubmit={handleSubmit}
    active={focus === 'input'}
  />
)}
```

**Step 2: Full suite + typecheck**

```bash
bun run --filter @randsum/cli test && bun run --filter @randsum/cli typecheck
```
Expected: All pass.

**Step 3: Manual test — full flow**

```bash
bun run --filter @randsum/cli dev -- -i
```

Verify:
- `m` switches between Notation and Game modes
- Notation mode: type `4d6L`, Enter, see rich history (total + pools + description)
- Game mode: Up/Down navigates between game selector, fields, roll button
- Game selector: Left/Right cycles through all 6 games
- Number fields: Left/Right increments/decrements, respects min/max
- Select fields: Left/Right cycles options
- Boolean fields: Space toggles ON/OFF
- Enter rolls from any field position
- `Ctrl+L` clears history from any mode

**Step 4: Commit**

```bash
git add apps/cli/src/tui/App.tsx
git commit -m "feat(cli): add mode toggle and game mode wiring to App.tsx"
```

---

### Task 11: Final verification

**Step 1: Full CI pipeline**

```bash
bun run --filter @randsum/cli test
bun run --filter @randsum/cli typecheck
bun run --filter @randsum/cli lint
bun run --filter @randsum/cli build
```
Expected: All pass. Build succeeds.

**Step 2: Run bundle size check**

```bash
bun run size
```
Verify the CLI stays within its size budget (check `package.json` size-limit config if present).

**Step 3: Test all 6 games manually**

```bash
bun run --filter @randsum/cli dev -- -i
```

For each game (cycle with Left/Right on game selector):
- D&D 5e: set modifier, try Normal/Advantage/Disadvantage
- Blades in the Dark: try dice pool 0 (desperate) and 3
- Daggerheart: try amplifyHope toggle, amplifyFear toggle
- PbtA: try advantage + disadvantage toggles, stat values
- Root RPG: try bonus values
- Salvage Union: verify Core Mechanic rolls

**Step 4: Verify `add sync comments` to incrementDiceQuantity and useValidation**

```bash
# Check sync comments are present
grep -n "SYNC:" apps/cli/src/tui/helpers/incrementDiceQuantity.ts
grep -n "SYNC:" apps/cli/src/tui/hooks/useValidation.ts
```

If missing, add them:
```typescript
// SYNC: apps/site/src/components/playground/helpers/incrementDiceQuantity.ts
// TUI version adds case-insensitive flag ('i') for terminal input flexibility
```
```typescript
// SYNC: apps/site/src/components/playground/hooks/useValidation.ts
// Uses empty string (not null) for "no error" state — matches Ink's string-based rendering
```

**Step 5: Final commit**

```bash
git add apps/cli/src/tui/helpers/incrementDiceQuantity.ts apps/cli/src/tui/hooks/useValidation.ts
git commit -m "chore(cli): add sync comments to divergent playground files"
```

---

## Summary of files changed

| File | Action |
|---|---|
| `apps/cli/src/tui/helpers/formatResult.ts` | Create |
| `apps/cli/src/tui/hooks/useRollHistory.ts` | Rewrite |
| `apps/cli/src/tui/components/RollHistory.tsx` | Rewrite |
| `apps/cli/src/tui/components/NotationInput.tsx` | Simplify (remove error prop) |
| `apps/cli/src/tui/components/GameModePanel.tsx` | Create |
| `apps/cli/src/tui/components/fields/SelectField.tsx` | Create |
| `apps/cli/src/tui/components/fields/NumberField.tsx` | Create |
| `apps/cli/src/tui/components/fields/BooleanField.tsx` | Create |
| `apps/cli/src/tui/gameConfigs.ts` | Create |
| `apps/cli/src/tui/App.tsx` | Major update |
| `apps/cli/package.json` | Add 6 game package deps |
| `apps/cli/__tests__/tui/formatResult.test.ts` | Create |
| `apps/cli/__tests__/tui/useRollHistory.test.ts` | Create |
| `apps/cli/__tests__/tui/executeGameRoll.test.ts` | Create |

## Keyboard reference (final spec)

| Key | Context | Action |
|---|---|---|
| `m` | Any | Toggle Notation/Game mode |
| `Tab` | Any | Cycle focus zones within current mode |
| `Ctrl+L` | Any | Clear roll history |
| `Enter` | Notation input | Submit roll |
| `Enter` | Game panel | Execute roll |
| `Space` | Game boolean field | Toggle ON/OFF |
| `←/→` | Game selector | Cycle through 6 games |
| `←/→` | Game number field | Decrement/increment value |
| `←/→` | Game select field | Cycle through options |
| `↑/↓` | Game panel | Move between fields |
| `←/→` | Toolbar | Navigate dice buttons |
| `Enter` | Toolbar | Select die (appends to input) |
