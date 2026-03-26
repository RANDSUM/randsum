import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'

import { useTheme } from '../hooks/useTheme'
import type { ParsedRollResult } from '../lib/parseRollResult'

interface RollResultViewProps {
  readonly result: ParsedRollResult
}

export function RollResultView({ result }: RollResultViewProps): React.JSX.Element {
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
    <ScrollView style={[styles.container, { backgroundColor: tokens.bg }]}>
      <View
        style={[
          styles.totalRow,
          {
            backgroundColor: tokens.surfaceAlt,
            borderBottomWidth: 1,
            borderBottomColor: tokens.border
          }
        ]}
      >
        <View style={[styles.totalBadge, { borderColor: `${tokens.accent}40` }]}>
          {isAnimating ? (
            <ActivityIndicator size="small" color={tokens.accent} />
          ) : (
            <Text
              style={[styles.totalText, { color: tokens.accent, fontSize: fontSizes['3xl'] }]}
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
      </View>

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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12
  },
  totalBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50
  },
  totalText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '700'
  },
  notation: {
    fontFamily: 'JetBrainsMono_400Regular',
    flex: 1
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
  }
})
