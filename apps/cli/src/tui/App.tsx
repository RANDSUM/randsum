import { Box, Text, render } from 'ink'
import { RollHistory } from './components/RollHistory'
import { useRollHistory } from './hooks/useRollHistory'

function App(): React.JSX.Element {
  const { history } = useRollHistory()

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

      {/* Dice toolbar placeholder - Task 5/6 */}

      <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Box>
          <Text color="green">{'> '}</Text>
          <Text> </Text>
        </Box>
      </Box>
    </Box>
  )
}

export function launchTui(): void {
  render(<App />)
}
