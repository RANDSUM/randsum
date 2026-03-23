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
  readonly onSaveAsTemplate: () => void
  readonly onShare: () => void
  readonly archivedAt?: string | null
}

export function RollResultView({
  result,
  onRollAgain,
  onSaveAsTemplate,
  onShare,
  archivedAt
}: RollResultViewProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const animatedValue = useRef(new Animated.Value(0)).current
  const isArchived = archivedAt !== undefined && archivedAt !== null
  const [isAnimating, setIsAnimating] = useState(!isArchived)

  useEffect(() => {
    if (isArchived) {
      setIsAnimating(false)
      return
    }
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
  }, [result.total, animatedValue, isArchived])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg,
      paddingTop: 12
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: tokens.border,
      alignSelf: 'center',
      marginBottom: 16
    },
    archivedBanner: {
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: tokens.textDim
    },
    archivedLabel: {
      color: tokens.textMuted,
      fontSize: fontSizes.sm,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1
    },
    archivedTime: {
      color: tokens.textDim,
      fontSize: fontSizes.xs,
      fontFamily: 'JetBrainsMono_400Regular'
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
      fontSize: fontSizes['3xl'],
      fontFamily: 'JetBrainsMono_400Regular',
      fontWeight: 'bold',
      color: tokens.text
    },
    notation: {
      fontSize: fontSizes.sm,
      fontFamily: 'JetBrainsMono_400Regular',
      color: tokens.textMuted,
      textAlign: 'center',
      marginBottom: 24
    },
    breakdownLabel: {
      fontSize: fontSizes.sm,
      color: tokens.textMuted,
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
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 6
    },
    pillDropped: {
      opacity: 0.4
    },
    pillText: {
      fontSize: fontSizes.base,
      fontFamily: 'JetBrainsMono_400Regular',
      color: tokens.text,
      textDecorationLine: 'none'
    },
    pillTextDropped: {
      textDecorationLine: 'line-through',
      color: tokens.textDim
    },
    actions: {
      paddingHorizontal: 16,
      gap: 12,
      paddingBottom: 32
    },
    primaryButton: {
      backgroundColor: tokens.accent,
      borderRadius: 10,
      height: 52,
      alignItems: 'center',
      justifyContent: 'center'
    },
    primaryButtonText: {
      color: tokens.text,
      fontSize: fontSizes.lg,
      fontWeight: '600'
    },
    secondaryButton: {
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 10,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center'
    },
    secondaryButtonText: {
      color: tokens.textMuted,
      fontSize: fontSizes.base
    }
  })

  // Flatten all dice across all records for breakdown display
  const allDice: { value: number; dropped: boolean }[] = result.records.flatMap(record => {
    const keptSet = new Set(record.rolls)
    return record.initialRolls.map(v => ({
      value: v,
      dropped: !keptSet.has(v)
    }))
  })

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.handle} accessibilityRole="none" />

      {isArchived && (
        <View style={styles.archivedBanner}>
          <Text style={styles.archivedLabel}>Archived Roll</Text>
          <Text style={styles.archivedTime}>
            {new Date(archivedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </Text>
        </View>
      )}

      <View style={styles.totalContainer}>
        {isAnimating ? (
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={tokens.accent} />
          </View>
        ) : (
          <Text style={styles.total} accessibilityLabel={`Total: ${result.total}`}>
            {result.total}
          </Text>
        )}
      </View>

      <Text style={styles.notation} accessibilityRole="text">
        {result.notation}
      </Text>

      {allDice.length > 0 && (
        <>
          <Text style={styles.breakdownLabel}>Dice</Text>
          <View style={styles.breakdown}>
            {allDice.map((die, i) => (
              <View
                key={i}
                style={[styles.pill, die.dropped ? styles.pillDropped : undefined]}
                accessibilityLabel={die.dropped ? `${die.value} dropped` : String(die.value)}
              >
                <Text style={[styles.pillText, die.dropped ? styles.pillTextDropped : undefined]}>
                  {die.value}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onRollAgain}
          accessibilityRole="button"
          accessibilityLabel="Roll again"
        >
          <Text style={styles.primaryButtonText}>Roll Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onSaveAsTemplate}
          accessibilityRole="button"
          accessibilityLabel="Save as template"
        >
          <Text style={styles.secondaryButtonText}>Save as Template</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Text style={styles.secondaryButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}
