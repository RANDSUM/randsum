import { useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '../hooks/useTheme'
import type { RollHistoryEntry } from '../lib/types'

interface HistoryEntryProps {
  readonly entry: RollHistoryEntry
  readonly isExpanded: boolean
  readonly onToggle: () => void
  readonly onDelete: (id: string) => void
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function HistoryEntry({
  entry,
  isExpanded,
  onToggle,
  onDelete
}: HistoryEntryProps): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const animatedHeight = useRef(new Animated.Value(isExpanded ? 1 : 0)).current
  const [showDeleteButton, setShowDeleteButton] = useState(false)

  const handleToggle = (): void => {
    Animated.spring(animatedHeight, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: false,
      speed: 20,
      bounciness: 0
    }).start()
    onToggle()
  }

  const handleLongPress = (): void => {
    setShowDeleteButton(prev => !prev)
  }

  const handleDelete = (): void => {
    setShowDeleteButton(false)
    onDelete(entry.id)
  }

  const allDice = entry.rolls.flatMap(record => {
    const keptSet = new Set(record.rolls)
    return record.initialRolls.map(v => ({
      value: v,
      dropped: !keptSet.has(v)
    }))
  })

  const styles = StyleSheet.create({
    row: {
      backgroundColor: tokens.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border
    },
    mainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      minHeight: 44
    },
    left: {
      flex: 1
    },
    notation: {
      fontSize: fontSizes.sm,
      fontFamily: 'JetBrainsMono_400Regular',
      color: tokens.textMuted
    },
    meta: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 2
    },
    metaText: {
      fontSize: fontSizes.xs,
      color: tokens.textDim
    },
    total: {
      fontSize: fontSizes.xl,
      fontFamily: 'JetBrainsMono_400Regular',
      color: tokens.text,
      marginLeft: 8
    },
    deleteButton: {
      backgroundColor: tokens.error,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 8,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center'
    },
    deleteText: {
      color: tokens.text,
      fontSize: fontSizes.sm
    },
    breakdown: {
      overflow: 'hidden'
    },
    breakdownInner: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      maxHeight: 300
    },
    breakdownLabel: {
      fontSize: fontSizes.sm,
      color: tokens.textMuted,
      marginBottom: 6
    },
    pills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6
    },
    pill: {
      backgroundColor: tokens.surfaceAlt,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    pillDropped: {
      opacity: 0.4
    },
    pillText: {
      fontSize: fontSizes.base,
      fontFamily: 'JetBrainsMono_400Regular',
      color: tokens.text
    },
    pillTextDropped: {
      textDecorationLine: 'line-through',
      color: tokens.textDim
    }
  })

  const expandedHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(allDice.length * 10 + 80, 80)]
  })

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={handleToggle}
        onLongPress={handleLongPress}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityLabel={`Roll: ${entry.notation}, total ${entry.total}. Tap to ${isExpanded ? 'collapse' : 'expand'}. Long press for delete.`}
        activeOpacity={0.7}
      >
        <View style={styles.mainContent}>
          <View style={styles.left}>
            <Text style={styles.notation}>{entry.notation}</Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{formatRelativeTime(entry.createdAt)}</Text>
              {entry.gameId !== undefined && <Text style={styles.metaText}>{entry.gameId}</Text>}
            </View>
          </View>
          <Text style={styles.total}>{entry.total}</Text>
          {showDeleteButton && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete this roll"
            >
              <Text style={styles.deleteText}>Del</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.breakdown, { height: expandedHeight }]}>
        {allDice.length > 0 && (
          <View style={styles.breakdownInner}>
            <Text style={styles.breakdownLabel}>Dice</Text>
            <View style={styles.pills}>
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
          </View>
        )}
      </Animated.View>
    </View>
  )
}
