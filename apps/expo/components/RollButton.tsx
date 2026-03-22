import * as Haptics from 'expo-haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface RollButtonProps {
  readonly enabled: boolean
  readonly onPress: () => void
  readonly label?: string
}

export function RollButton({
  enabled,
  onPress,
  label = 'Roll'
}: RollButtonProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn(): void {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()
  }

  function handlePressOut(): void {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  async function handlePress(): Promise<void> {
    if (!enabled) return
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Medium)
    } catch {
      // no-op on web
    }
    onPress()
  }

  const bgColor = enabled ? tokens.accent : tokens.surfaceAlt
  const textColor = enabled ? tokens.text : tokens.textDim

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled }}
        style={[styles.button, { backgroundColor: bgColor }]}
      >
        <Text style={[styles.label, { color: textColor, fontSize: fontSizes.lg }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  label: {
    fontWeight: '600'
  }
})
