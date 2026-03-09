# TUI Playground Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the `@randsum/cli` TUI to achieve 1:1 visual and functional parity with the `RollerPlayground` web component — full-width modifier reference, tokenized header, cursor-driven token highlighting, and an overlay-style result view that replaces the reference when a roll is executed.

**Architecture:** Remove roll history entirely. The layout is a single-column container: header (`roll('notation')` with live token colors), description row, full-width main panel (modifier reference OR roll result), and an input at the bottom. A new `useCursorPosition` hook tracks cursor position in the text input to enable bidirectional token ↔ description highlighting.

**Tech Stack:** Ink (React for CLI), ink-text-input, @randsum/roller, @randsum/notation (tokenize), bun:test

---

## Task 1: Delete dead code

**Files:**
- Delete: `src/tui/components/RollHistory.tsx`
- Delete: `src/tui/hooks/useRollHistory.ts`
- Delete: `src/tui/components/DiceToolbar.tsx`
- Delete: `src/tui/helpers/incrementDiceQuantity.ts`
- Delete: `__tests__/tui/useRollHistory.test.ts`
- Delete: `__tests__/tui/incrementDiceQuantity.test.ts`

**Step 1: Delete the files**

```bash
rm src/tui/components/RollHistory.tsx
rm src/tui/hooks/useRollHistory.ts
rm src/tui/components/DiceToolbar.tsx
rm src/tui/helpers/incrementDiceQuantity.ts
rm __tests__/tui/useRollHistory.test.ts
rm __tests__/tui/incrementDiceQuantity.test.ts
```

**Step 2: Run tests to confirm nothing else depended on them**

```bash
bun test
```

Expected: All remaining tests pass (they don't import the deleted files).

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(cli): remove roll history, dice toolbar, incrementDiceQuantity"
```

---

## Task 2: Add `useCursorPosition` hook

The Playground tracks which token is under the mouse cursor. In the TUI we track which token the text cursor is in by intercepting left/right arrow keys while the input is focused.

**Files:**
- Create: `src/tui/hooks/useCursorPosition.ts`
- Create: `__tests__/tui/useCursorPosition.test.ts`

**Step 1: Write the failing test**

Create `__tests__/tui/useCursorPosition.test.ts`:

```typescript
import { describe, expect, test } from 'bun:test'
import { tokenCursorIndex } from '../../src/tui/hooks/useCursorPosition'
import { tokenize } from '@randsum/notation'

describe('tokenCursorIndex', () => {
  test('returns -1 for empty tokens', () => {
    expect(tokenCursorIndex([], 0)).toBe(-1)
  })

  test('returns 0 for cursor inside first token', () => {
    const tokens = tokenize('4d6L')
    // tokens[0] is the core token '4d6', positions 0-2
    expect(tokenCursorIndex(tokens, 0)).toBe(0) // cursor at '4'
    expect(tokenCursorIndex(tokens, 2)).toBe(0) // cursor at '6'
  })

  test('returns 1 for cursor inside second token', () => {
    const tokens = tokenize('4d6L')
    // tokens[1] is 'L', position 3
    expect(tokenCursorIndex(tokens, 3)).toBe(1)
  })

  test('returns -1 for cursor past end', () => {
    const tokens = tokenize('4d6')
    // cursor at position 3 (after the string) — not inside any token
    expect(tokenCursorIndex(tokens, 3)).toBe(-1)
  })

  test('handles cursor at start of token', () => {
    const tokens = tokenize('1d20+5')
    // find the '+5' token
    const plusIdx = tokens.findIndex(t => t.type === 'plus' || t.text === '+5' || t.text.startsWith('+'))
    expect(plusIdx).toBeGreaterThan(-1)
    const plusToken = tokens[plusIdx]!
    expect(tokenCursorIndex(tokens, plusToken.start)).toBe(plusIdx)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
bun test __tests__/tui/useCursorPosition.test.ts
```

Expected: FAIL — `tokenCursorIndex` is not exported.

**Step 3: Implement `useCursorPosition.ts`**

Create `src/tui/hooks/useCursorPosition.ts`:

```typescript
import { useCallback, useEffect, useState } from 'react'
import { useInput } from 'ink'
import type { Token } from '@randsum/notation'

/**
 * Returns the index (into `tokens`) of the token that contains `cursorPos`,
 * or -1 if the cursor is not inside any token.
 */
export function tokenCursorIndex(tokens: readonly Token[], cursorPos: number): number {
  return tokens.findIndex(t => cursorPos >= t.start && cursorPos < t.end)
}

/**
 * Tracks the text cursor position inside an ink text input by intercepting
 * left/right arrow keys. Returns the current cursor position and the index
 * of the token under the cursor.
 */
export function useCursorPosition(
  value: string,
  tokens: readonly Token[],
  isActive: boolean
): { cursorPos: number; activeTokenIdx: number } {
  const [cursorPos, setCursorPos] = useState(value.length)

  // Reset cursor to end whenever value changes (new character typed or cleared)
  useEffect(() => {
    setCursorPos(value.length)
  }, [value])

  const handleInput = useCallback(
    (_input: string, key: { leftArrow?: boolean; rightArrow?: boolean }) => {
      if (key.leftArrow) {
        setCursorPos(prev => Math.max(0, prev - 1))
      } else if (key.rightArrow) {
        setCursorPos(prev => Math.min(value.length, prev + 1))
      }
    },
    [value.length]
  )

  useInput(handleInput, { isActive })

  const activeTokenIdx = tokenCursorIndex(tokens, cursorPos)

  return { cursorPos, activeTokenIdx }
}
```

**Step 4: Run tests**

```bash
bun test __tests__/tui/useCursorPosition.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/tui/hooks/useCursorPosition.ts __tests__/tui/useCursorPosition.test.ts
git commit -m "feat(cli): add useCursorPosition hook for token-aware cursor tracking"
```

---

## Task 3: Update `NotationDescriptionRow` to highlight active token

The Playground dims non-hovered description chips and brightens the hovered one. We match this with `activeTokenIdx`.

**Files:**
- Modify: `src/tui/components/NotationDescriptionRow.tsx`

**Step 1: Update the component**

Replace the file contents:

```typescript
import { Box, Text } from 'ink'
import type { Token } from '@randsum/notation'

const TOKEN_COLORS: Partial<Record<Token['type'], string>> = {
  core: 'cyan',
  dropLowest: 'yellow',
  dropHighest: 'yellow',
  keepHighest: 'green',
  keepLowest: 'green',
  explode: 'magenta',
  compound: 'magenta',
  penetrate: 'magenta',
  reroll: 'blue',
  cap: 'blue',
  replace: 'blue',
  unique: 'blue',
  countSuccesses: 'green',
  dropCondition: 'yellow',
  plus: 'cyan',
  minus: 'cyan',
  multiply: 'cyan',
  multiplyTotal: 'cyan',
  unknown: 'gray'
}

export function NotationDescriptionRow({
  notation,
  tokens,
  isValid,
  activeTokenIdx = -1
}: {
  readonly notation: string
  readonly tokens: readonly Token[]
  readonly isValid: boolean
  readonly activeTokenIdx?: number
}): React.JSX.Element {
  if (notation.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>Try: 4d6L, 1d20+5, 2d8!</Text>
      </Box>
    )
  }

  if (!isValid) {
    return (
      <Box paddingX={1}>
        <Text color="red" dimColor>
          Invalid notation
        </Text>
      </Box>
    )
  }

  const described = tokens.filter(t => Boolean(t.description))
  // map described tokens back to original index in tokens[]
  const describedWithIdx = described.map(t => ({
    token: t,
    tokenIdx: tokens.indexOf(t)
  }))

  return (
    <Box paddingX={1} flexWrap="wrap">
      {describedWithIdx.map(({ token, tokenIdx }, i) => {
        const sep =
          i === 0
            ? null
            : token.type === 'core'
              ? token.text.startsWith('-')
                ? ' − '
                : ' + '
              : ', '
        const color = TOKEN_COLORS[token.type] ?? 'gray'
        const isActive = tokenIdx === activeTokenIdx
        return (
          <Box key={`${token.type}-${token.start}`} flexDirection="row">
            {sep !== null && <Text dimColor>{sep}</Text>}
            <Text color={color} bold={isActive} inverse={isActive}>
              {token.description}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
```

**Step 2: Run tests**

```bash
bun test
```

Expected: All pass (no tests for this component, but nothing broken).

**Step 3: Commit**

```bash
git add src/tui/components/NotationDescriptionRow.tsx
git commit -m "feat(cli): highlight active description token matching cursor position"
```

---

## Task 4: Rewrite `NotationReference` — full-width with row separators

Match Playground's row-bordered grid: each row separated by a `─` divider, no `│` center separator, full width.

**Files:**
- Modify: `src/tui/components/NotationReference.tsx`

**Step 1: Rewrite the component**

The changes are:
1. Replace the `│` separator with spacing/justify and no separator character
2. Add a `─` horizontal divider between rows (a `<Box>` with dimmed `─` text after each row except the last)
3. Make the container full-width (remove `flexGrow={1}` — it already will expand, but ensure no width constraints)

Key structural change — where the grid rows are rendered, after each row (except last), render:
```tsx
<Box>
  <Text dimColor>{'─'.repeat(60)}</Text>
</Box>
```

But we don't know the terminal width inside the component easily. Instead, use `flexGrow={1}` on a `Box` with `borderBottom` — actually Ink doesn't support individual border sides. Use a full-width `─` by using `process.stdout.columns` or just rendering a fixed-width separator.

The cleanest Ink approach: render a Box with `borderStyle="single"` only on the bottom. Since Ink doesn't support single-side borders, we'll use a spacer line of `─` characters using the stdout width passed as a prop or computed.

Simpler: just use a light separator `Text` with `dimColor` — even a fixed width looks fine in terminals.

Replace the contents of `src/tui/components/NotationReference.tsx`:

```typescript
// SYNC: packages/component-library/src/components/ModifierReference/ModifierReference.tsx
import { Box, Text, useInput, useStdout } from 'ink'
import { useState } from 'react'
import type { GridPosition } from '../helpers/modifierGrid'
import { navigateGrid } from '../helpers/modifierGrid'
import { MODIFIER_DOCS } from '../helpers/modifierDocs'

interface ModifierEntry {
  readonly notation: string
  readonly description: string
  readonly notationSuffix?: string
}

const CORE: ModifierEntry = { notation: 'xDN', description: 'roll x dice with N sides' }

const GRID_ROWS = [
  [CORE, { notation: '+', description: 'add', notationSuffix: 'N' }],
  [
    { notation: 'L', description: 'drop lowest', notationSuffix: 'N' },
    { notation: '-', description: 'subtract', notationSuffix: 'N' }
  ],
  [
    { notation: 'H', description: 'drop highest', notationSuffix: 'N' },
    { notation: '*', description: 'multiply dice', notationSuffix: 'N' }
  ],
  [
    { notation: 'K', description: 'keep highest', notationSuffix: 'N' },
    { notation: '**', description: 'multiply total', notationSuffix: 'N' }
  ],
  [
    { notation: 'KL', description: 'keep lowest', notationSuffix: 'N' },
    { notation: 'V{..}', description: 'replace...' }
  ],
  [
    { notation: '!', description: 'explode' },
    { notation: 'S{..}', description: 'successes...' }
  ],
  [
    { notation: '!!', description: 'compound', notationSuffix: 'N' },
    { notation: 'D{..}', description: 'drop condition...' }
  ],
  [
    { notation: '!p', description: 'penetrate', notationSuffix: 'N' },
    { notation: 'C{..}', description: 'cap...' }
  ],
  [
    { notation: 'U', description: 'unique', notationSuffix: '{..}' },
    { notation: 'R{..}', description: 'reroll...', notationSuffix: 'N' }
  ]
] as const satisfies readonly (readonly [ModifierEntry, ModifierEntry])[]

export function NotationReference({
  active,
  modifiersDisabled,
  onAddModifier
}: {
  readonly active: boolean
  readonly modifiersDisabled: boolean
  readonly onAddModifier: (notation: string) => void
}): React.JSX.Element {
  const [selectedPos, setSelectedPos] = useState<GridPosition>({ row: 0, col: 0 })
  const [showDoc, setShowDoc] = useState(false)
  const { stdout } = useStdout()
  // Inner width = terminal width minus container padding/border (approx 4)
  const separatorWidth = Math.max(10, (stdout?.columns ?? 80) - 6)

  useInput(
    (_input, key) => {
      if (key.upArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'up', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.downArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'down', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.leftArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'left', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.rightArrow) {
        setSelectedPos(prev => navigateGrid(prev, 'right', GRID_ROWS.length))
        setShowDoc(false)
      } else if (key.return) {
        if (showDoc) {
          const row = GRID_ROWS[selectedPos.row]
          if (row === undefined) return
          const cell = selectedPos.col === 0 ? row[0] : row[1]
          const isCore = selectedPos.row === 0 && selectedPos.col === 0
          if (!modifiersDisabled || isCore) {
            onAddModifier(cell.notation)
          }
          setShowDoc(false)
        } else {
          setShowDoc(true)
        }
      } else if (_input === 'a' || _input === 'A') {
        const row = GRID_ROWS[selectedPos.row]
        if (row === undefined) return
        const cell = selectedPos.col === 0 ? row[0] : row[1]
        const isCore = selectedPos.row === 0 && selectedPos.col === 0
        if (!modifiersDisabled || isCore) {
          onAddModifier(cell.notation)
        }
      }
    },
    { isActive: active }
  )

  const selectedRow = GRID_ROWS[selectedPos.row]
  const selectedCell =
    selectedRow !== undefined
      ? selectedPos.col === 0
        ? selectedRow[0]
        : selectedRow[1]
      : undefined
  const selectedDoc = selectedCell !== undefined ? MODIFIER_DOCS[selectedCell.notation] : undefined

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      {/* Header row */}
      <Box justifyContent="space-between" marginBottom={0}>
        {active && <Text dimColor>arrows:navigate  Enter:details  a:add</Text>}
        {!active && <Box />}
      </Box>

      <Box flexDirection="column">
        {GRID_ROWS.map((row, rowIdx) => {
          const left = row[0]
          const right = row[1]
          const isCore = rowIdx === 0
          const leftSelected = active && selectedPos.row === rowIdx && selectedPos.col === 0
          const rightSelected = active && selectedPos.row === rowIdx && selectedPos.col === 1
          const leftDimmed = !leftSelected && !isCore && modifiersDisabled
          const rightDimmed = !rightSelected && modifiersDisabled

          return (
            <Box key={rowIdx} flexDirection="column">
              <Box justifyContent="space-between" paddingY={0}>
                {/* Left cell: notation + description */}
                <Box gap={1} flexGrow={1}>
                  {leftSelected ? (
                    <Text bold color="cyan">
                      {left.notation}
                      {'notationSuffix' in left ? left.notationSuffix : ''}
                    </Text>
                  ) : (
                    <Text bold dimColor={leftDimmed}>
                      {left.notation}
                      {'notationSuffix' in left ? left.notationSuffix : ''}
                    </Text>
                  )}
                  <Text dimColor={!leftSelected || leftDimmed}>{left.description}</Text>
                </Box>

                {/* Right cell: description + notation (mirrored) */}
                <Box gap={1} justifyContent="flex-end" flexGrow={1}>
                  <Text dimColor={!rightSelected || rightDimmed}>{right.description}</Text>
                  {rightSelected ? (
                    <Text bold color="cyan">
                      {right.notation}
                      {'notationSuffix' in right ? right.notationSuffix : ''}
                    </Text>
                  ) : (
                    <Text bold dimColor={rightDimmed}>
                      {right.notation}
                      {'notationSuffix' in right ? right.notationSuffix : ''}
                    </Text>
                  )}
                </Box>
              </Box>

              {/* Row separator (not after the last row) */}
              {rowIdx < GRID_ROWS.length - 1 && (
                <Text dimColor>{'─'.repeat(separatorWidth)}</Text>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Modifier doc panel */}
      {showDoc && selectedDoc !== undefined && (
        <Box
          flexDirection="column"
          marginTop={1}
          borderStyle="single"
          borderColor="cyan"
          paddingX={1}
        >
          <Text bold color="cyan">
            {selectedDoc.title}
          </Text>
          <Text dimColor>{selectedDoc.description}</Text>
          {selectedDoc.forms.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {selectedDoc.forms.map((form, i) => (
                <Box key={i} gap={2}>
                  <Text color="yellow">{form.notation}</Text>
                  <Text dimColor>{form.note}</Text>
                </Box>
              ))}
            </Box>
          )}
          {selectedDoc.comparisons !== undefined && selectedDoc.comparisons.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              {selectedDoc.comparisons.map((comp, i) => (
                <Box key={i} gap={2}>
                  <Text color="yellow">{comp.operator}</Text>
                  <Text dimColor>{comp.note}</Text>
                </Box>
              ))}
            </Box>
          )}
          {selectedDoc.examples.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text dimColor bold>
                Examples
              </Text>
              {selectedDoc.examples.map((ex, i) => (
                <Box key={i} gap={2}>
                  <Text color="green">{ex.notation}</Text>
                  <Text dimColor>{ex.description}</Text>
                </Box>
              ))}
            </Box>
          )}
          <Box marginTop={1}>
            <Text dimColor>Enter/a to add  Enter again to close</Text>
          </Box>
        </Box>
      )}

      {active && !showDoc && (
        <Box marginTop={1}>
          <Text dimColor>Enter to see modifier details</Text>
        </Box>
      )}
    </Box>
  )
}
```

**Step 2: Run tests**

```bash
bun test
```

Expected: All pass.

**Step 3: Commit**

```bash
git add src/tui/components/NotationReference.tsx
git commit -m "feat(cli): full-width modifier reference with row separators, no center divider"
```

---

## Task 5: Rewrite `App.tsx` — new layout, header with live tokens, overlay result

This is the largest change. It:
- Removes all history state
- Adds `viewMode: 'reference' | 'result'`
- Adds the tokenized `roll('...')` header
- Wires `useCursorPosition` → `activeTokenIdx` → header + description row
- Switches main panel between `NotationReference` and `RollResultPanel`

**Files:**
- Modify: `src/tui/App.tsx`

**Step 1: Rewrite App.tsx**

```typescript
import { Box, Text, render, useInput, useStdout } from 'ink'
import { useMemo, useState } from 'react'
import type { RollRecord } from '@randsum/roller'
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import { formatResult, isFormattedError } from '@randsum/roller'
import { tokenize } from '@randsum/notation'
import type { Token } from '@randsum/notation'
import { NotationInput } from './components/NotationInput'
import { NotationReference } from './components/NotationReference'
import { NotationDescriptionRow } from './components/NotationDescriptionRow'
import { RollResultPanel } from './components/RollResultPanel'
import { useCursorPosition } from './hooks/useCursorPosition'

// Token type → Ink color mapping (mirrors NotationDescriptionRow)
const TOKEN_COLORS: Partial<Record<Token['type'], string>> = {
  core: 'cyan',
  dropLowest: 'yellow',
  dropHighest: 'yellow',
  keepHighest: 'green',
  keepLowest: 'green',
  explode: 'magenta',
  compound: 'magenta',
  penetrate: 'magenta',
  reroll: 'blue',
  cap: 'blue',
  replace: 'blue',
  unique: 'blue',
  countSuccesses: 'green',
  dropCondition: 'yellow',
  plus: 'cyan',
  minus: 'cyan',
  multiply: 'cyan',
  multiplyTotal: 'cyan',
  unknown: 'gray'
}

type FocusZone = 'input' | 'reference'
type ViewMode = 'reference' | 'result'

function App(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')
  const [viewMode, setViewMode] = useState<ViewMode>('reference')
  const [lastResult, setLastResult] = useState<readonly RollRecord[] | null>(null)

  const tokens = useMemo(() => tokenize(input), [input])
  const isValid = input.trim().length > 0 && isDiceNotation(input.trim())

  // Track cursor position for bidirectional token ↔ description highlighting
  const { activeTokenIdx } = useCursorPosition(input, tokens, focus === 'input')

  useInput((_input, key) => {
    if (key.tab) {
      // Tab only switches to reference when in reference view mode
      if (viewMode === 'reference') {
        setFocus(prev => (prev === 'input' ? 'reference' : 'input'))
      }
    }
    // Escape or any key while in result view + input focus → back to reference
    if (key.escape && viewMode === 'result') {
      setViewMode('reference')
      setLastResult(null)
    }
  })

  const handleSubmit = (value: string): void => {
    const trimmed = value.trim()
    if (trimmed === '') return

    const validation = validateNotation(trimmed)
    if (!validation.valid) return

    const result = roll(...validation.notation)
    const formatted = formatResult(result)
    if (isFormattedError(formatted)) return

    setLastResult(result.rolls)
    setViewMode('result')
    setFocus('input')
  }

  const handleInputChange = (value: string): void => {
    setInput(value)
    // Typing while viewing result → return to reference view
    if (viewMode === 'result') {
      setViewMode('reference')
      setLastResult(null)
    }
  }

  const handleAddModifier = (notation: string): void => {
    setInput(prev => prev + notation)
    setFocus('input')
    if (viewMode === 'result') {
      setViewMode('reference')
      setLastResult(null)
    }
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      {/* Header: roll('notation') with live token colors */}
      <Box marginBottom={0}>
        <Text bold>roll</Text>
        <Text color="gray">(</Text>
        {input.length === 0 ? (
          <Text color="gray">)</Text>
        ) : (
          <>
            <Text color="gray">&apos;</Text>
            {tokens.length > 0 ? (
              tokens.map((token, i) => (
                <Text
                  key={`${token.type}-${token.start}`}
                  color={TOKEN_COLORS[token.type] ?? 'gray'}
                  bold={i === activeTokenIdx}
                  inverse={i === activeTokenIdx}
                >
                  {token.text}
                </Text>
              ))
            ) : (
              <Text color="gray">{input}</Text>
            )}
            <Text color="gray">&apos;</Text>
            <Text color="gray">)</Text>
          </>
        )}
      </Box>

      {/* Description row: token descriptions with active highlight */}
      <NotationDescriptionRow
        notation={input}
        tokens={tokens}
        isValid={isValid}
        activeTokenIdx={activeTokenIdx}
      />

      {/* Main panel: modifier reference OR roll result */}
      {viewMode === 'reference' ? (
        <NotationReference
          active={focus === 'reference'}
          modifiersDisabled={!isValid}
          onAddModifier={handleAddModifier}
        />
      ) : (
        <Box flexDirection="column">
          {lastResult !== null && <RollResultPanel records={lastResult} />}
          <Box marginTop={1} paddingX={1}>
            <Text dimColor>type to return to reference</Text>
          </Box>
        </Box>
      )}

      {/* Input */}
      <NotationInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        active={focus === 'input'}
      />

      {/* Footer hint */}
      {viewMode === 'reference' && (
        <Box paddingX={1}>
          <Text dimColor>Tab: switch focus  Enter: roll  Ctrl+C: quit</Text>
        </Box>
      )}
    </Box>
  )
}

export function launchTui(): void {
  if (!process.stdin.isTTY) {
    console.error(
      'Interactive mode requires a TTY. Run directly: cd apps/cli && bun run src/index.ts -i'
    )
    process.exit(1)
  }
  render(<App />)
}
```

**Step 2: Run the app manually to check it renders**

```bash
bun run dev -- -i
```

Expected: App launches, shows `roll()` header, modifier reference below, input at bottom.

**Step 3: Type notation and observe**

Type `4d6L` and verify:
- Header changes to `roll('4d6L')` with `4d6` in cyan, `L` in yellow
- Description row shows "Roll 4 6-sided dice, drop 1 lowest"
- Cursor movement (left/right arrows) highlights the corresponding token in header and description

**Step 4: Roll and observe**

Press Enter. Verify:
- Main panel switches to result breakdown
- Hint "type to return to reference" appears
- Typing a character returns to reference mode

**Step 5: Run tests**

```bash
bun test
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/tui/App.tsx
git commit -m "feat(cli): rewrite App with overlay result view, tokenized header, cursor highlighting"
```

---

## Task 6: Style `RollResultPanel` to match Playground result overlay

The Playground's result view has clean rows: label left, value right, with no outer border (the outer container border is enough). Remove the outer `borderStyle` from `RollResultPanel` so it blends into the App container.

**Files:**
- Modify: `src/tui/components/RollResultPanel.tsx`

**Step 1: Remove outer border, align to Playground style**

Change line 189 — remove `borderStyle="single"` and `borderColor="gray"` from the outer `<Box>`, add a top separator instead:

```typescript
// Before:
<Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
  <Text bold dimColor>
    Result Breakdown
  </Text>

// After:
<Box flexDirection="column" paddingX={1} marginTop={1}>
  <Box marginBottom={1}>
    <Text dimColor>{'─'.repeat(40)}</Text>
  </Box>
```

Also update the "Total" label row to use bold styling matching the Playground's result hero:

In the `!hasModifiers` case, make the total value bold and cyan:
```typescript
// Before:
<Text bold>{record.total}</Text>

// After:
<Text bold color="cyan">{record.total}</Text>
```

**Step 2: Run tests**

```bash
bun test
```

**Step 3: Commit**

```bash
git add src/tui/components/RollResultPanel.tsx
git commit -m "feat(cli): style RollResultPanel to match Playground result overlay"
```

---

## Task 7: Final polish pass — verify visual fidelity

**Step 1: Test simple roll (no modifiers)**

```bash
bun run dev -- -i
```

Type `1d6`, press Enter. Verify result shows `Total` with bold cyan value, no outer box.

**Step 2: Test with modifiers**

Type `4d6L`, press Enter. Verify:
- Steps show: "Rolled", "Drop Lowest 1", "Final"
- Removed dice are red strikethrough
- Final row sums correctly

**Step 3: Test token navigation**

Type `1d20+5`. Use left arrow to move cursor into `1d20` — verify the `core` description chip highlights (bold/inverse). Move cursor to `+5` — verify the `plus` chip highlights.

**Step 4: Test Tab navigation**

Press Tab to switch focus to modifier reference. Verify:
- Arrow keys navigate the grid
- Selected row shows cyan notation
- Enter shows modifier docs

**Step 5: Run full test suite**

```bash
bun test
```

Expected: All pass.

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat(cli): TUI playground parity — full redesign complete"
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/tui/App.tsx` | Full rewrite — new layout, header, viewMode |
| `src/tui/components/NotationReference.tsx` | Full-width, row separators, no `│` |
| `src/tui/components/NotationDescriptionRow.tsx` | Add `activeTokenIdx` prop + highlight |
| `src/tui/components/RollResultPanel.tsx` | Remove outer border, style to match overlay |
| `src/tui/hooks/useCursorPosition.ts` | New — cursor tracking + token index |
| `__tests__/tui/useCursorPosition.test.ts` | New — tests for tokenCursorIndex |
| `src/tui/components/RollHistory.tsx` | Deleted |
| `src/tui/hooks/useRollHistory.ts` | Deleted |
| `src/tui/components/DiceToolbar.tsx` | Deleted |
| `src/tui/helpers/incrementDiceQuantity.ts` | Deleted |
| `__tests__/tui/useRollHistory.test.ts` | Deleted |
| `__tests__/tui/incrementDiceQuantity.test.ts` | Deleted |
