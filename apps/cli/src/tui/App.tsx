import { Box, Text, render, useInput, useStdout } from 'ink'
import { useMemo, useState } from 'react'
import { isDiceNotation, roll, validateNotation } from '@randsum/roller'
import { RollHistory } from './components/RollHistory'
import { NotationInput } from './components/NotationInput'
import { NotationReference } from './components/NotationReference'
import { NotationDescriptionRow } from './components/NotationDescriptionRow'
import { useRollHistory } from './hooks/useRollHistory'
import { formatResult, isFormattedError } from './helpers/formatResult'
import { tokenize } from './helpers/tokenize'

type FocusZone = 'input' | 'reference'

const WIDE_BREAKPOINT = 80

function App(): React.JSX.Element {
  const { history, addRoll, clearHistory } = useRollHistory()
  const [input, setInput] = useState('')
  const [focus, setFocus] = useState<FocusZone>('input')
  const { stdout } = useStdout()
  const isWide = stdout.columns >= WIDE_BREAKPOINT

  useInput((_input, key) => {
    if (key.tab) {
      setFocus(prev => (prev === 'input' ? 'reference' : 'input'))
    }
    if (key.ctrl && _input === 'l') {
      clearHistory()
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

    addRoll({
      notation: trimmed,
      total: formatted.total,
      rolls: formatted.rolls,
      description: formatted.description
    })
    setInput('')
  }

  const handleAddModifier = (notation: string): void => {
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

      {isWide ? (
        <Box>
          {/* Left column: history */}
          <Box flexDirection="column" width="33%">
            <Box flexDirection="column" flexGrow={1}>
              <RollHistory history={history} />
            </Box>

            <Box marginY={1}>
              <Text dimColor>{'─'.repeat(30)}</Text>
            </Box>

            <Box paddingX={1}>
              <Text dimColor>Tab to switch focus. Type notation and press Enter to roll.</Text>
            </Box>
          </Box>

          {/* Right column: modifier reference */}
          <NotationReference
            active={focus === 'reference'}
            modifiersDisabled={!isValid}
            onAddModifier={handleAddModifier}
          />
        </Box>
      ) : (
        <Box flexDirection="column">
          <RollHistory history={history} />

          <NotationReference
            active={focus === 'reference'}
            modifiersDisabled={!isValid}
            onAddModifier={handleAddModifier}
          />

          <Box paddingX={1} marginTop={1}>
            <Text dimColor>Tab to switch focus. Type notation and press Enter to roll.</Text>
          </Box>
        </Box>
      )}

      <NotationInput
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        active={focus === 'input'}
      />

      <NotationDescriptionRow notation={input} tokens={tokens} isValid={isValid} />
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
