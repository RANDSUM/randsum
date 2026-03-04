import { Input, XStack, YStack, Text, Button } from 'tamagui'
import type { NotationState } from '../hooks/useNotation'

type Props = {
  notation: NotationState
  onChange: (value: string) => void
  onClear: () => void
}

export function NotationInput({ notation, onChange, onClear }: Props) {
  const borderColor = !notation.raw
    ? '$borderColor'
    : notation.isValid
    ? '$green8'
    : '$red8'

  return (
    <YStack gap="$2">
      <XStack gap="$2" alignItems="center">
        <Input
          flex={1}
          value={notation.raw}
          onChangeText={onChange}
          placeholder="4d6L+2"
          placeholderTextColor="$placeholderColor"
          color="$color"
          backgroundColor="$backgroundStrong"
          borderColor={borderColor}
          borderWidth={1}
          borderRadius="$3"
          paddingHorizontal="$3"
          fontFamily="$mono"
          fontSize="$5"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {notation.raw ? (
          <Button
            size="$3"
            circular
            backgroundColor="$backgroundMuted"
            onPress={onClear}
          >
            <Text color="$colorMuted">✕</Text>
          </Button>
        ) : null}
      </XStack>
      {notation.description ? (
        <Text color="$colorMuted" fontSize="$3" paddingHorizontal="$1">
          {notation.description}
        </Text>
      ) : null}
      {notation.error ? (
        <Text color="$red8" fontSize="$3" paddingHorizontal="$1">
          {notation.error}
        </Text>
      ) : null}
    </YStack>
  )
}
