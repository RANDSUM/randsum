import { Box, Text } from 'ink'
import type { HistoryEntry } from '../hooks/useRollHistory'

interface RollHistoryProps {
  readonly history: readonly HistoryEntry[]
}

export function RollHistory({ history }: RollHistoryProps): React.JSX.Element {
  if (history.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor italic>
          No rolls yet.
        </Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {history.map(entry => (
        <Box key={entry.id} flexDirection="column">
          <Text color="cyan">{`> ${entry.notation}`}</Text>
          <Text>{`  ${entry.description}`}</Text>
        </Box>
      ))}
    </Box>
  )
}
