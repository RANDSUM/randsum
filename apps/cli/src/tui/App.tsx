import { Box, Text, render, useInput } from 'ink'
import { useState } from 'react'
import type { RollArgument } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { RollHistory } from './components/RollHistory'
import { NotationInput } from './components/NotationInput'
import { DiceToolbar } from './components/DiceToolbar'
import { useRollHistory } from './hooks/useRollHistory'

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
    setInput(prev => prev + notation)
    setFocus('input')
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">
          RANDSUM
        </Text>
      </Box>

      <Box flexDirection="column" flexGrow={1}>
        <RollHistory history={history} />
      </Box>

      <Box borderStyle="single" borderColor={focus === 'toolbar' ? 'cyan' : 'gray'}>
        <DiceToolbar active={focus === 'toolbar'} onSelect={handleDiceSelect} />
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
