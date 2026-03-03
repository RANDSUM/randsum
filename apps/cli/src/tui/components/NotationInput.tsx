import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { useValidation } from '../hooks/useValidation'

interface NotationInputProps {
  readonly value: string
  readonly error: string
  readonly active: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
}

export function NotationInput({
  value,
  error,
  onChange,
  onSubmit,
  active
}: NotationInputProps): React.JSX.Element {
  const { validationError } = useValidation(value)
  const displayError = error !== '' ? error : validationError
  const isInvalid = displayError !== ''

  const borderColor = isInvalid ? 'red' : active ? 'green' : 'gray'
  const promptColor = isInvalid ? 'red' : 'green'

  return (
    <Box borderStyle="single" borderColor={borderColor} paddingX={1} flexDirection="column">
      <Box>
        <Text color={promptColor}>{'> '}</Text>
        <TextInput value={value} onChange={onChange} onSubmit={onSubmit} focus={active} />
      </Box>
      {displayError !== '' && <Text color="red">{displayError}</Text>}
    </Box>
  )
}
