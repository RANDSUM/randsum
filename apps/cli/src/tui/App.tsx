import { Box, Text, render, useInput, useStdout } from 'ink'
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

const WIDE_BREAKPOINT = 80

function App(): React.JSX.Element {
  const { history, addRoll } = useRollHistory()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')
  const { stdout } = useStdout()
  const isWide = stdout.columns >= WIDE_BREAKPOINT

  useInput((_input, key) => {
    if (key.tab) {
      setFocus(prev => (prev === 'input' ? 'toolbar' : 'input'))
    }
  })

  const handleSubmit = (value: string): void => {
    const trimmed = value.trim()
    if (trimmed === '') return

    try {
      const result = roll(trimmed as RollArgument)
      setError('')
      addRoll({
        notation: trimmed,
        total: result.total,
        rolls: result.rolls.map(r => r.rolls),
        description: `Total: ${result.total}`
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
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

      {isWide ? (
        <Box>
          {/* Left column: history, description, toolbar */}
          <Box flexDirection="column" width="33%">
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

            <DiceToolbar active={focus === 'toolbar'} onSelect={handleDiceSelect} />
          </Box>

          {/* Right column: notation reference */}
          <NotationReference />
        </Box>
      ) : (
        <Box flexDirection="column">
          <RollHistory history={history} />

          <NotationReference />

          <Box paddingX={1} marginTop={1}>
            <Text dimColor>Type notation and press Enter to roll, or use the dice buttons.</Text>
          </Box>

          <DiceToolbar active={focus === 'toolbar'} onSelect={handleDiceSelect} />
        </Box>
      )}

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
  if (!process.stdin.isTTY) {
    console.error(
      'Interactive mode requires a TTY. Run directly: cd apps/cli && bun run src/index.ts -i'
    )
    process.exit(1)
  }
  render(<App />)
}
