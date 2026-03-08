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
      {overflow > 0 && <Text dimColor>{`(${overflow} more)`}</Text>}
      <Text dimColor>{'[Ctrl+L to clear]'}</Text>
    </Box>
  )
}
