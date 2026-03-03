import { Box, Text } from 'ink'
import type { RollerRollResult } from '@randsum/roller'
import { formatCompact } from '../../shared/format'

interface HistoryEntry {
  readonly notation: string
  readonly result: RollerRollResult
}

interface RollHistoryProps {
  readonly history: readonly HistoryEntry[]
}

export function RollHistory({ history }: RollHistoryProps): React.JSX.Element {
  if (history.length === 0) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text dimColor>Type notation and press Enter to roll, or use the dice buttons below.</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {history.map((entry, i) => (
        <Box key={i} flexDirection="column">
          <Text color="cyan">{`> ${entry.notation}`}</Text>
          <Text>{`  ${formatCompact(entry.result)}`}</Text>
        </Box>
      ))}
    </Box>
  )
}
