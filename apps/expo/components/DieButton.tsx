import * as Haptics from 'expo-haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'

interface DieButtonProps {
  readonly sides: number
  readonly count: number
  readonly onPress: () => void
  readonly onLongPress: () => void
  readonly disabled?: boolean
}

export function DieButton({
  sides,
  count,
  onPress,
  onLongPress,
  disabled = false
}: DieButtonProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const scale = useRef(new Animated.Value(1)).current

  const isActive = count > 0

  function handlePressIn(): void {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 50 }).start()
  }

  function handlePressOut(): void {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
  }

  async function handlePress(): Promise<void> {
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light)
    } catch {
      // no-op on web
    }
    onPress()
  }

  async function handleLongPress(): Promise<void> {
    try {
      await Haptics.impactAsync(ImpactFeedbackStyle.Light)
    } catch {
      // no-op on web
    }
    onLongPress()
  }

  const containerStyle = {
    backgroundColor: disabled ? tokens.surface : isActive ? tokens.surfaceAlt : 'transparent',
    borderColor: tokens.border,
    borderWidth: 1
  }

  const labelColor = disabled ? tokens.textDim : isActive ? tokens.text : tokens.textDim

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityLabel={`D${sides}, ${count} in pool`}
        accessibilityHint="Tap to add, long press to remove"
        style={[styles.button, containerStyle]}
      >
        <Text
          style={[
            styles.label,
            { color: labelColor, fontFamily: 'JetBrainsMono_400Regular', fontSize: fontSizes.lg }
          ]}
        >
          D{sides}
        </Text>
        {isActive && !disabled && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: tokens.accent,
                minWidth: 20,
                height: 20,
                borderRadius: 10
              }
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: tokens.text,
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize: fontSizes.sm
                }
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: 'relative'
  },
  label: {
    fontWeight: '400',
    textAlign: 'center'
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    fontWeight: '700',
    lineHeight: 16
  }
})
