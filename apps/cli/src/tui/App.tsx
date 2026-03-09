import { Box, Text, render, useInput } from 'ink'
import { useMemo, useState } from 'react'
import type { RollRecord } from '@randsum/roller'
import { isDiceNotation, roll, validateNotation, formatResult, isFormattedError } from '@randsum/roller'
import { tokenize } from '@randsum/notation'
import type { Token } from '@randsum/notation'
import { NotationInput } from './components/NotationInput'
import { NotationReference } from './components/NotationReference'
import { NotationDescriptionRow } from './components/NotationDescriptionRow'
import { RollResultPanel } from './components/RollResultPanel'
import { useCursorPosition } from './hooks/useCursorPosition'

/**
 * Token type → Ink color mapping.
 * Matches Playground CSS token families (dark mode).
 * SYNC: packages/component-library/src/components/RollerPlayground/RollerPlayground.css
 */
const TOKEN_COLORS: Partial<Record<Token['type'], string>> = {
  core: 'blue',            // #60a5fa
  dropLowest: 'magenta',   // #f060d0
  dropHighest: 'magenta',  // #b858b0
  keepHighest: 'yellow',   // #ffab70
  keepLowest: 'yellow',    // #d4845a
  explode: 'yellow',       // #e5c07b
  compound: 'yellow',      // #e08040
  penetrate: 'green',      // #b8d858
  reroll: 'magenta',       // #c792ea
  cap: 'cyan',             // #89ddff
  replace: 'green',        // #c3e88d
  unique: 'cyan',          // #80cbc4
  countSuccesses: 'blue',  // #82aaff
  dropCondition: 'magenta',// #d860c0
  plus: 'green',           // #98c379
  minus: 'green',          // #6b9e52
  multiply: 'yellow',      // #ffcb6b
  multiplyTotal: 'yellow', // #e8a93a
  unknown: 'red'           // #f97583
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

  const { activeTokenIdx } = useCursorPosition(input, tokens, focus === 'input')

  useInput((_input, key) => {
    if (key.tab && viewMode === 'reference') {
      setFocus(prev => (prev === 'input' ? 'reference' : 'input'))
    }
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
      <Box>
        <Text color="yellow" bold>roll</Text>
        <Text dimColor>(</Text>
        {input.length === 0 ? (
          <Text dimColor>)</Text>
        ) : (
          <>
            <Text color="green">&apos;</Text>
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
              <Text dimColor>{input}</Text>
            )}
            <Text color="green">&apos;</Text>
            <Text dimColor>)</Text>
          </>
        )}
      </Box>

      {/* Description row */}
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
          <Box paddingX={1} marginTop={1}>
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
