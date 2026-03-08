import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { useValidation } from '../hooks/useValidation'

interface NotationInputProps {
  readonly value: string
  readonly active: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
}

export function NotationInput({
  value,
  onChange,
  onSubmit,
  active
}: NotationInputProps): React.JSX.Element {
  const { validationError } = useValidation(value)
  const hasError = validationError !== ''

  const hasInput = value.trim() !== ''
  const isValid = hasInput && !hasError
  const borderColor = hasError ? 'red' : isValid ? 'green' : 'gray'
  const promptColor = hasError ? 'red' : isValid ? 'green' : 'gray'

  return (
    <Box borderStyle="single" borderColor={borderColor} paddingX={1} flexDirection="column">
      <Box>
        <Text color={promptColor}>{'> '}</Text>
        <TextInput value={value} onChange={onChange} onSubmit={onSubmit} focus={active} />
      </Box>
      {hasError && <Text color="red">{validationError}</Text>}
    </Box>
  )
}
