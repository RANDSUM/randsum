// apps/cli/src/tui/components/fields/NumberField.tsx
import { Box, Text } from 'ink'

interface NumberFieldProps {
  readonly label: string
  readonly value: number
  readonly min?: number
  readonly max?: number
  readonly focused: boolean
}

export function NumberField({
  label,
  value,
  min,
  max,
  focused
}: NumberFieldProps): React.JSX.Element {
  const color = focused ? 'cyan' : 'white'
  const labelColor = focused ? 'cyan' : 'gray'
  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max
  const rangeHint = focused && min !== undefined && max !== undefined ? ` (${min}..${max})` : ''

  return (
    <Box gap={1}>
      <Text color={labelColor} bold={focused}>
        {label}:
      </Text>
      <Text dimColor={atMin}>{'◄ '}</Text>
      <Text color={color} bold={focused}>
        {value}
      </Text>
      <Text dimColor={atMax}>{' ►'}</Text>
      {rangeHint !== '' && <Text dimColor>{rangeHint}</Text>}
    </Box>
  )
}
