import { Box, Text, render, useInput } from 'ink'
import { useMemo, useState } from 'react'
import type { RollRecord } from '@randsum/roller'
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import { NotationInput } from './components/NotationInput'
import { NotationReference } from './components/NotationReference'
import { NotationDescriptionRow } from './components/NotationDescriptionRow'
import { RollResultPanel } from './components/RollResultPanel'
import { formatResult, isFormattedError } from '@randsum/roller'
import { tokenize } from '@randsum/notation'

type FocusZone = 'input' | 'reference'

function App(): React.JSX.Element {
  const [input, setInput] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')
  const [lastResult, setLastResult] = useState<readonly RollRecord[] | null>(null)

  useInput((_input, key) => {
    if (key.tab) {
      setFocus(prev => (prev === 'input' ? 'reference' : 'input'))
    }
  })

  const tokens = useMemo(() => tokenize(input), [input])
  const isValid = input.trim().length > 0 && isDiceNotation(input.trim())

  const handleSubmit = (value: string): void => {
    const trimmed = value.trim()
    if (trimmed === '') return

    const validation = validateNotation(trimmed)
    if (!validation.valid) return

    const result = roll(...validation.notation)
    const formatted = formatResult(result)
    if (isFormattedError(formatted)) return

    setLastResult(result.rolls)
    setInput('')
  }

  const handleInputChange = (value: string): void => {
    setInput(value)
    setLastResult(null)
  }

  const handleAddModifier = (notation: string): void => {
    setInput(prev => prev + notation)
    setLastResult(null)
    setFocus('input')
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold>roll</Text>
        <Text color="gray">()</Text>
      </Box>

      <Box flexDirection="column">
        <NotationReference
          active={focus === 'reference'}
          modifiersDisabled={!isValid}
          onAddModifier={handleAddModifier}
        />

        <Box paddingX={1} marginTop={1}>
          <Text dimColor>Tab to switch focus. Type notation and press Enter to roll.</Text>
        </Box>
      </Box>

      <NotationInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        active={focus === 'input'}
      />

      <NotationDescriptionRow notation={input} tokens={tokens} isValid={isValid} />

      {lastResult !== null && <RollResultPanel records={lastResult} />}
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
