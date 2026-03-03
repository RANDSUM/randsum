import { Box, Text } from 'ink'

const REFERENCE_ENTRIES = [
  ['NdS', '4d6', 'Roll N dice with S sides'],
  ['+X', '2d6+3', 'Add X to total'],
  ['-X', '2d6-1', 'Subtract X from total'],
  ['L', '4d6L', 'Drop lowest roll'],
  ['H', '4d6H', 'Drop highest roll'],
  ['K', '4d6K', 'Keep highest roll'],
  ['R{<N}', '4d20R{<3}', 'Reroll dice below N'],
  ['C{>N}', '4d20C{>18}', 'Clamp values above N'],
  ['V{N=M}', 'd6V{1=6}', 'Replace N with M'],
  ['S{N}', '5d10S{7}', 'Count successes ≥ N'],
  ['!', '3d6!', 'Max adds new die to pool'],
  ['!!', '3d6!!', 'Max adds to same die'],
  ['!p', '3d6!p', 'Max adds roll-1 to die'],
  ['U', '4d6U', 'Reroll duplicates'],
  ['*N', '2d6*3', 'Multiply sum before +/-'],
  ['**N', '2d6**2', 'Multiply final total']
] as const

const EXPLODE_TIPS = [
  ['!  Explode', '[6,4,6] → [6,4,6,5,3] (new dice)'],
  ['!! Compound', '[6,4,6] → [11,4,9] (same dice)'],
  ['!p Penetrate', '[6,4,6] → [10,4,8] (same, -1 each)']
] as const

const midpoint = Math.ceil(REFERENCE_ENTRIES.length / 2)
const LEFT_COLUMN = REFERENCE_ENTRIES.slice(0, midpoint)
const RIGHT_COLUMN = REFERENCE_ENTRIES.slice(midpoint)

function ReferenceColumn({
  entries
}: {
  readonly entries: readonly (readonly [string, string, string])[]
}): React.JSX.Element {
  return (
    <Box flexDirection="column" flexGrow={1}>
      {entries.map(([modifier, example, description]) => (
        <Box key={modifier} gap={1}>
          <Text dimColor bold>
            {modifier.padEnd(7)}
          </Text>
          <Text dimColor>{example.padEnd(12)}</Text>
          <Text color="gray">{description}</Text>
        </Box>
      ))}
    </Box>
  )
}

function ColumnSeparator({ height }: { readonly height: number }): React.JSX.Element {
  return (
    <Box flexDirection="column">
      {Array.from({ length: height }, (_, i) => (
        <Text key={i} dimColor>
          │
        </Text>
      ))}
    </Box>
  )
}

export function NotationReference(): React.JSX.Element {
  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="gray" paddingX={1}>
      <Text bold dimColor>
        Dice Notation
      </Text>
      <Box marginTop={1} gap={2}>
        <ReferenceColumn entries={LEFT_COLUMN} />
        <ColumnSeparator height={LEFT_COLUMN.length} />
        <ReferenceColumn entries={RIGHT_COLUMN} />
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold dimColor>
          Explosion Types (3d6 example)
        </Text>
        {EXPLODE_TIPS.map(([label, example]) => (
          <Box key={label} gap={1}>
            <Text dimColor bold>
              {label.padEnd(14)}
            </Text>
            <Text color="gray">{example}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
