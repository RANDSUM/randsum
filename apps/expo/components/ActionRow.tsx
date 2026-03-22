import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface ActionRowProps {
  readonly onClear: () => void
  readonly onNotation: () => void
  readonly isSaveEnabled: boolean
}

export function ActionRow({
  onClear,
  onNotation,
  isSaveEnabled
}: ActionRowProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  return (
    <View style={styles.row}>
      <Pressable
        disabled={!isSaveEnabled}
        accessibilityRole="button"
        accessibilityLabel="Save"
        accessibilityState={{ disabled: !isSaveEnabled }}
        style={[styles.button, { borderColor: tokens.border }]}
      >
        <Text
          style={[
            styles.label,
            {
              color: isSaveEnabled ? tokens.text : tokens.textDim,
              fontSize: fontSizes.base
            }
          ]}
        >
          Save
        </Text>
      </Pressable>

      <Pressable
        onPress={onNotation}
        accessibilityRole="button"
        accessibilityLabel="Notation"
        style={[styles.button, { borderColor: tokens.border }]}
      >
        <Text style={[styles.label, { color: tokens.text, fontSize: fontSizes.base }]}>
          Notation
        </Text>
      </Pressable>

      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Clear"
        style={[styles.button, { borderColor: tokens.border }]}
      >
        <Text style={[styles.label, { color: tokens.text, fontSize: fontSizes.base }]}>Clear</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8
  },
  label: {
    fontWeight: '500'
  }
})
