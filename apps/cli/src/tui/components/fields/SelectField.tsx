// apps/cli/src/tui/components/fields/SelectField.tsx
import { Box, Text } from 'ink'

interface SelectFieldProps {
  readonly label: string
  readonly options: readonly string[]
  readonly value: string
  readonly focused: boolean
}

export function SelectField({
  label,
  options: _options,
  value,
  focused
}: SelectFieldProps): React.JSX.Element {
  const color = focused ? 'cyan' : 'white'
  const labelColor = focused ? 'cyan' : 'gray'
  const showArrows = focused

  return (
    <Box gap={1}>
      <Text color={labelColor} bold={focused}>
        {label}:
      </Text>
      <Text dimColor={!showArrows}>{'◄ '}</Text>
      <Text color={color} bold={focused}>
        {value}
      </Text>
      <Text dimColor={!showArrows}>{' ►'}</Text>
    </Box>
  )
}
