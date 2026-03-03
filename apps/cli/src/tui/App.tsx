import { Box, Text, render, useInput } from 'ink'
import { useState } from 'react'
import type { RollArgument } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { RollHistory } from './components/RollHistory'
import { NotationInput } from './components/NotationInput'
import { DiceToolbar } from './components/DiceToolbar'
import { NotationReference } from './components/NotationReference'
import { useRollHistory } from './hooks/useRollHistory'
import { incrementDiceQuantity } from './helpers/incrementDiceQuantity'

type FocusZone = 'input' | 'toolbar'

function App(): React.JSX.Element {
  const { history, addRoll } = useRollHistory()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')

  useInput((_input, key) => {
    if (key.tab) {
      setFocus(prev => (prev === 'input' ? 'toolbar' : 'input'))
    }
  })

  const handleSubmit = (value: string): void => {
    const trimmed = value.trim()
    if (trimmed === '') return

    const result = roll(trimmed as RollArgument)
    if (result.error) {
      setError(result.error.message)
    } else {
      setError('')
      addRoll(trimmed, result)
    }
    setInput('')
  }

  const handleDiceSelect = (notation: string): void => {
    const sides = Number(notation.replace(/\D/g, ''))
    setInput(prev => incrementDiceQuantity(prev, sides))
    setFocus('input')
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          RANDSUM
        </Text>
      </Box>

      <Box>
        {/* Left column: history, description, toolbar */}
        <Box flexDirection="column" flexGrow={1}>
          <Box flexDirection="column" flexGrow={1}>
            <RollHistory history={history} />
          </Box>

          <Box marginY={1}>
            <Text dimColor>{'─'.repeat(30)}</Text>
          </Box>

          <Box paddingX={1}>
            <Text dimColor>Type notation and press Enter to roll, or use the dice buttons.</Text>
          </Box>

          <Box marginY={1}>
            <Text dimColor>{'─'.repeat(30)}</Text>
          </Box>

          <Box borderStyle="single" borderColor={focus === 'toolbar' ? 'cyan' : 'gray'}>
            <DiceToolbar active={focus === 'toolbar'} onSelect={handleDiceSelect} />
          </Box>
        </Box>

        {/* Right column: notation reference */}
        <NotationReference />
      </Box>

      <NotationInput
        value={input}
        error={error}
        onChange={setInput}
        onSubmit={handleSubmit}
        active={focus === 'input'}
      />
    </Box>
  )
}

export function launchTui(): void {
  render(<App />)
}
