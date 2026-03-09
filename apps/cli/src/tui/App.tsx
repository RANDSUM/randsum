import { Box, Text, render, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useMemo, useState } from 'react'
import type { RollRecord } from '@randsum/roller'
import {
  formatResult,
  isDiceNotation,
  isFormattedError,
  roll,
  validateNotation
} from '@randsum/roller'
import { tokenize } from '@randsum/notation'
import { NotationReference } from './components/NotationReference'
import { NotationDescriptionRow } from './components/NotationDescriptionRow'
import { RollResultPanel } from './components/RollResultPanel'
import { useCursorPosition } from './hooks/useCursorPosition'

type FocusZone = 'input' | 'reference' | 'roll'
type ViewMode = 'reference' | 'result'

function App(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')
  const [viewMode, setViewMode] = useState<ViewMode>('reference')
  const [lastResult, setLastResult] = useState<readonly RollRecord[] | null>(null)

  const tokens = useMemo(() => tokenize(input), [input])
  const isValid = input.trim().length > 0 && isDiceNotation(input.trim())

  const { activeTokenIdx } = useCursorPosition(input, tokens, focus === 'input', () => {
    setFocus('roll')
  })

  useInput((_input, key) => {
    if (focus === 'roll') {
      if (key.return) {
        handleSubmit(input)
      } else if (key.rightArrow) {
        setFocus('input')
      } else if (_input && !key.ctrl && !key.meta) {
        setInput(prev => prev + _input)
        setFocus('input')
      }
      return
    }

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
      {/* Header: roll(...) with inline input — full width */}
      <Box width="100%">
        <Text color="yellow" bold inverse={focus === 'roll'}>
          roll
        </Text>
        <Text dimColor>(</Text>
        <TextInput
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          focus={focus === 'input'}
          placeholder="4d6L"
        />
        <Text dimColor>)</Text>
      </Box>

      {/* Description row — no border */}
      <Box>
        <NotationDescriptionRow
          notation={input}
          tokens={tokens}
          isValid={isValid}
          activeTokenIdx={activeTokenIdx}
        />
      </Box>

      {/* Hint below description */}
      {viewMode === 'reference' && (
        <Box paddingX={1}>
          <Text dimColor>Tab: switch focus Enter: roll Ctrl+C: quit</Text>
        </Box>
      )}

      {/* Main panel: modifier reference (bordered) OR roll result */}
      {viewMode === 'reference' ? (
        <Box borderStyle="single" borderColor="cyan">
          <NotationReference
            active={focus === 'reference'}
            modifiersDisabled={!isValid}
            onAddModifier={handleAddModifier}
          />
        </Box>
      ) : (
        <Box flexDirection="column">
          {lastResult !== null && <RollResultPanel records={lastResult} />}
          <Box paddingX={1} marginTop={1}>
            <Text dimColor>type to return to reference</Text>
          </Box>
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
