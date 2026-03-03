import { Box, Text } from 'ink'

const REFERENCE_LEFT = [
  ['NdS', '4d6'],
  ['+X', '2d6+3'],
  ['-X', '2d6-1'],
  ['L', '4d6L'],
  ['H', '4d6H'],
  ['K', '4d6K'],
  ['R{<N}', '4d20R{<3}'],
  ['C{>N}', '4d20C{>18}'],
  ['V{N=M}', 'd6V{1=6}'],
  ['S{N}', '5d10S{7}']
] as const

const REFERENCE_RIGHT = [
  ['!', '3d6!'],
  ['!!', '3d6!!'],
  ['!p', '3d6!p'],
  ['U', '4d6U'],
  ['*N', '2d6*3'],
  ['**N', '2d6**2']
] as const

function ReferenceColumn({
  entries
}: {
  readonly entries: readonly (readonly [string, string])[]
}): React.JSX.Element {
  return (
    <Box flexDirection="column">
      {entries.map(([modifier, example]) => (
        <Box key={modifier} gap={1}>
          <Text dimColor bold>
            {modifier.padEnd(7)}
          </Text>
          <Text dimColor>{example}</Text>
        </Box>
      ))}
    </Box>
  )
}

export function NotationReference(): React.JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
      <Text bold dimColor>
        Dice Notation
      </Text>
      <Box gap={2} marginTop={1}>
        <ReferenceColumn entries={REFERENCE_LEFT} />
        <ReferenceColumn entries={REFERENCE_RIGHT} />
      </Box>
    </Box>
  )
}
