import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

import { useTheme } from '../hooks/useTheme'
import type { ParsedRollResult } from '../lib/parseRollResult'

interface RollResultViewProps {
  readonly result: ParsedRollResult
  readonly onRollAgain: () => void
  readonly onShare: () => void
}

export function RollResultView({
  result,
  onRollAgain,
  onShare
}: RollResultViewProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const animatedValue = useRef(new Animated.Value(0)).current
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    setIsAnimating(true)
    animatedValue.setValue(0)
    const animation = Animated.timing(animatedValue, {
      toValue: result.total,
      duration: 400,
      useNativeDriver: false
    })

    animation.start(({ finished }) => {
      if (finished) {
        setIsAnimating(false)
        AccessibilityInfo.announceForAccessibility(String(result.total))
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
      }
    })

    return () => {
      animation.stop()
    }
  }, [result.total, animatedValue])

  // Flatten all dice across all records for breakdown display
  const allDice: { value: number; dropped: boolean }[] = result.records.flatMap(record => {
    const keptSet = new Set(record.rolls)
    return record.initialRolls.map(v => ({
      value: v,
      dropped: !keptSet.has(v)
    }))
  })

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.bg }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.handle, { backgroundColor: tokens.border }]} accessibilityRole="none" />

      <View style={styles.totalContainer}>
        {isAnimating ? (
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={tokens.accent} />
          </View>
        ) : (
          <Text
            style={[styles.total, { color: tokens.text, fontSize: fontSizes['3xl'] }]}
            accessibilityLabel={`Total: ${result.total}`}
          >
            {result.total}
          </Text>
        )}
      </View>

      <Text
        style={[styles.notation, { color: tokens.textMuted, fontSize: fontSizes.sm }]}
        accessibilityRole="text"
      >
        {result.notation}
      </Text>

      {allDice.length > 0 && (
        <>
          <Text
            style={[styles.breakdownLabel, { color: tokens.textMuted, fontSize: fontSizes.sm }]}
          >
            Dice
          </Text>
          <View style={styles.breakdown}>
            {allDice.map((die, i) => (
              <View
                key={i}
                style={[
                  styles.pill,
                  { backgroundColor: tokens.surfaceAlt },
                  die.dropped ? styles.pillDropped : undefined
                ]}
                accessibilityLabel={die.dropped ? `${die.value} dropped` : String(die.value)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: tokens.text, fontSize: fontSizes.base },
                    die.dropped
                      ? { textDecorationLine: 'line-through', color: tokens.textDim }
                      : undefined
                  ]}
                >
                  {die.value}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: tokens.accent }]}
          onPress={onRollAgain}
          accessibilityRole="button"
          accessibilityLabel="Roll again"
        >
          <Text style={[styles.primaryButtonText, { fontSize: fontSizes.lg }]}>Roll Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { backgroundColor: tokens.surfaceAlt, borderColor: 'rgba(168, 85, 247, 0.15)' }
          ]}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: tokens.textMuted, fontSize: fontSizes.base }
            ]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12
  },
  contentContainer: {
    flexGrow: 1
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16
  },
  totalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 60
  },
  spinnerWrap: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  total: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: 'bold'
  },
  notation: {
    fontFamily: 'JetBrainsMono_400Regular',
    textAlign: 'center',
    marginBottom: 24
  },
  breakdownLabel: {
    marginBottom: 8,
    paddingHorizontal: 16
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 32
  },
  pill: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillDropped: {
    opacity: 0.4
  },
  pillText: {
    fontFamily: 'JetBrainsMono_400Regular'
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 32
  },
  primaryButton: {
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'JetBrainsMono_400Regular',
    letterSpacing: 1
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryButtonText: {
    fontFamily: 'JetBrainsMono_400Regular'
  }
})
