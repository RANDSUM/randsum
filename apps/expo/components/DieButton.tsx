import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '../hooks/useTheme'

type MaterialCommunityIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name']

const DIE_ICONS: Readonly<Record<number, MaterialCommunityIconName>> = {
  4: 'dice-d4-outline',
  6: 'dice-d6-outline',
  8: 'dice-d8-outline',
  10: 'dice-d10-outline',
  12: 'dice-d12-outline',
  20: 'dice-d20-outline',
  100: 'percent-outline'
}

interface DieButtonProps {
  readonly sides: number
  readonly label?: string
  readonly onPress: () => void
}

export function DieButton({ sides, label, onPress }: DieButtonProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const scale = useRef(new Animated.Value(1)).current
  const iconName = DIE_ICONS[sides] ?? 'dice-multiple-outline'

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

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Add ${label ?? `D${sides}`} to notation`}
        style={[
          styles.button,
          {
            backgroundColor: tokens.surfaceAlt,
            borderColor: tokens.border
          }
        ]}
      >
        <MaterialCommunityIcons name={iconName} size={28} color={tokens.accent} />
        <Text
          style={[
            styles.label,
            { color: tokens.text, fontFamily: 'JetBrainsMono_400Regular', fontSize: fontSizes.sm }
          ]}
        >
          {label ?? `D${sides}`}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    gap: 4
  },
  label: {
    fontWeight: '500',
    textAlign: 'center'
  }
})
