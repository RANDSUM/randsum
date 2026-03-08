// apps/cli/src/tui/components/fields/BooleanField.tsx
import { Box, Text } from 'ink'

interface BooleanFieldProps {
  readonly label: string
  readonly value: boolean
  readonly focused: boolean
}

export function BooleanField({ label, value, focused }: BooleanFieldProps): React.JSX.Element {
  const labelColor = focused ? 'cyan' : 'gray'

  return (
    <Box gap={1}>
      <Text color={value ? 'green' : 'gray'}>{value ? '[ON]' : '[OFF]'}</Text>
      <Text color={labelColor} bold={focused}>
        {label}
      </Text>
      {focused && <Text dimColor>{'(Space to toggle)'}</Text>}
    </Box>
  )
}
