import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

interface NotationInputProps {
  readonly value: string
  readonly error: string
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
}

export function NotationInput({
  value,
  error,
  onChange,
  onSubmit
}: NotationInputProps): React.JSX.Element {
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
      {error !== '' && <Text color="red">{error}</Text>}
      <Box>
        <Text color="green">{'> '}</Text>
        <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
      </Box>
    </Box>
  )
}
