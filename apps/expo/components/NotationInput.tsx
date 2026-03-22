import { StyleSheet, Text, TextInput, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface NotationInputProps {
  readonly notation: string
  readonly isValid: boolean
  readonly hasError: boolean
  readonly onChangeNotation: (notation: string) => void
}

export function NotationInput({
  notation,
  isValid,
  hasError,
  onChangeNotation
}: NotationInputProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  const borderColor = hasError ? tokens.error : isValid ? tokens.success : tokens.border

  return (
    <View style={styles.container}>
      <TextInput
        value={notation}
        onChangeText={onChangeNotation}
        placeholder="4d6L, 1d20+5, 2d8..."
        placeholderTextColor={tokens.textDim}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Dice notation input"
        accessibilityHint="Enter dice notation like 4d6L or 1d20+5"
        style={[
          styles.input,
          {
            color: tokens.text,
            backgroundColor: tokens.surface,
            borderColor,
            fontSize: fontSizes.lg,
            fontFamily: 'JetBrainsMono_400Regular'
          }
        ]}
      />
      {hasError ? (
        <Text
          accessibilityRole="text"
          accessibilityLabel="Invalid notation"
          style={[styles.errorText, { color: tokens.error, fontSize: fontSizes.sm }]}
        >
          Invalid dice notation
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 4
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52
  },
  errorText: {
    paddingHorizontal: 4
  }
})
