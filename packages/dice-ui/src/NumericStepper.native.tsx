import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from './useTheme'

export interface NumericStepperProps {
  readonly value: number
  readonly onValueChange: (value: number) => void
  readonly min?: number
  readonly max?: number
  readonly label?: string
  readonly accentColor?: string
}

const TOKENS = {
  dark: {
    text: '#fafafa',
    textMuted: '#a1a1aa',
    surface: '#18181b',
    surfaceAlt: '#27272a',
    border: '#3f3f46'
  },
  light: {
    text: '#18181b',
    textMuted: '#3f3f46',
    surface: '#f4f4f5',
    surfaceAlt: '#e4e4e7',
    border: '#a1a1aa'
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2
  },
  label: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonTop: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4
  },
  buttonBottom: {
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600'
  },
  valueContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40
  },
  valueText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  }
})

export function NumericStepper({
  value,
  onValueChange,
  min = 1,
  max = 99,
  label,
  accentColor
}: NumericStepperProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]

  return (
    <View style={styles.container}>
      {label !== undefined && (
        <Text style={[styles.label, { color: tokens.textMuted }]}>{label}</Text>
      )}
      <Pressable
        style={[
          styles.button,
          styles.buttonTop,
          {
            backgroundColor: tokens.surfaceAlt,
            borderColor: tokens.border
          }
        ]}
        onPress={() => {
          if (value < max) onValueChange(value + 1)
        }}
        accessibilityLabel={`Increase${label !== undefined ? ` ${label}` : ''}`}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: tokens.textMuted }]}>{'+'}</Text>
      </Pressable>
      <View
        style={[
          styles.valueContainer,
          {
            backgroundColor: tokens.surface,
            borderColor: tokens.border
          }
        ]}
      >
        <Text style={[styles.valueText, { color: accentColor ?? tokens.text }]}>{value}</Text>
      </View>
      <Pressable
        style={[
          styles.button,
          styles.buttonBottom,
          {
            backgroundColor: tokens.surfaceAlt,
            borderColor: tokens.border
          }
        ]}
        onPress={() => {
          if (value > min) onValueChange(value - 1)
        }}
        accessibilityLabel={`Decrease${label !== undefined ? ` ${label}` : ''}`}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, { color: tokens.textMuted }]}>{'\u2212'}</Text>
      </Pressable>
    </View>
  )
}
