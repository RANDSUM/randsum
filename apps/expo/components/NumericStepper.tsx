import * as Haptics from 'expo-haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface NumericStepperProps {
  readonly value: number
  readonly min: number
  readonly max: number
  readonly onChange: (value: number) => void
  readonly label?: string
  readonly disabled?: boolean
}

export function NumericStepper({
  value,
  min,
  max,
  onChange,
  label,
  disabled = false
}: NumericStepperProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()

  const atMin = value <= min
  const atMax = value >= max

  async function handleDecrement(): Promise<void> {
    if (atMin || disabled) return
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light)
    } catch {
      // no-op on web
    }
    onChange(value - 1)
  }

  async function handleIncrement(): Promise<void> {
    if (atMax || disabled) return
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light)
    } catch {
      // no-op on web
    }
    onChange(value + 1)
  }

  const dimColor = tokens.textDim
  const activeColor = tokens.text

  return (
    <View style={styles.wrapper}>
      {label !== undefined ? (
        <Text style={[styles.label, { color: tokens.textMuted, fontSize: fontSizes.sm }]}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.row, { backgroundColor: tokens.surfaceAlt, borderRadius: 8 }]}>
        <Pressable
          onPress={handleDecrement}
          disabled={atMin || disabled}
          accessibilityLabel={`Decrease ${label ?? 'value'}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: atMin || disabled }}
          style={styles.button}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: atMin || disabled ? dimColor : activeColor,
                fontSize: fontSizes.xl
              }
            ]}
          >
            -
          </Text>
        </Pressable>
        <View style={styles.valueContainer}>
          <Text
            accessibilityLabel={`${value}`}
            style={[
              styles.value,
              {
                color: disabled ? dimColor : activeColor,
                fontSize: fontSizes.lg,
                fontFamily: 'JetBrainsMono_400Regular'
              }
            ]}
          >
            {value}
          </Text>
        </View>
        <Pressable
          onPress={handleIncrement}
          disabled={atMax || disabled}
          accessibilityLabel={`Increase ${label ?? 'value'}`}
          accessibilityRole="button"
          accessibilityState={{ disabled: atMax || disabled }}
          style={styles.button}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: atMax || disabled ? dimColor : activeColor,
                fontSize: fontSizes.xl
              }
            ]}
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4
  },
  label: {
    marginLeft: 4
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  buttonText: {
    fontWeight: '600'
  },
  valueContainer: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  value: {
    fontWeight: '600',
    textAlign: 'center'
  }
})
