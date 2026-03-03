import { Box, Text, render } from 'ink'
import { useState } from 'react'
import type { RollArgument } from '@randsum/roller'
import { roll } from '@randsum/roller'
import { RollHistory } from './components/RollHistory'
import { NotationInput } from './components/NotationInput'
import { useRollHistory } from './hooks/useRollHistory'

function App(): React.JSX.Element {
  const { history, addRoll } = useRollHistory()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

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

      {/* Dice toolbar — Task 6 */}

      <NotationInput value={input} error={error} onChange={setInput} onSubmit={handleSubmit} />
    </Box>
  )
}

export function launchTui(): void {
  render(<App />)
}
