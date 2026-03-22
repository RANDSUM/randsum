import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { HistoryEntry } from '../../components/HistoryEntry'
import { useHistory } from '../../hooks/useHistory'
import { useTheme } from '../../hooks/useTheme'
import type { RollHistoryEntry } from '../../lib/types'
import { useState } from 'react'

export default function HistoryScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const { entries, isLoading, deleteEntry, clearHistory } = useHistory()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function handleToggle(id: string): void {
    setExpandedId(prev => (prev === id ? null : id))
  }

  function handleClearAll(): void {
    Alert.alert('Clear History', 'Remove all roll history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          setExpandedId(null)
          clearHistory().catch(() => undefined)
        }
      }
    ])
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tokens.bg
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border
    },
    headerTitle: {
      fontSize: fontSizes.lg,
      fontWeight: '600',
      color: tokens.text
    },
    clearButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      minHeight: 44,
      justifyContent: 'center'
    },
    clearButtonText: {
      fontSize: fontSizes.sm,
      color: tokens.error
    },
    clearButtonDisabled: {
      opacity: 0.4
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32
    },
    emptyText: {
      fontSize: fontSizes.base,
      color: tokens.textMuted,
      textAlign: 'center'
    },
    loadingText: {
      fontSize: fontSizes.base,
      color: tokens.textDim,
      textAlign: 'center'
    }
  })

  function renderItem({ item }: { item: RollHistoryEntry }): React.JSX.Element {
    return (
      <HistoryEntry
        entry={item}
        isExpanded={expandedId === item.id}
        onToggle={() => handleToggle(item.id)}
        onDelete={id => {
          deleteEntry(id).catch(() => undefined)
        }}
      />
    )
  }

  const isEmpty = entries.length === 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity
          style={[styles.clearButton, isEmpty ? styles.clearButtonDisabled : undefined]}
          onPress={handleClearAll}
          disabled={isEmpty}
          accessibilityRole="button"
          accessibilityLabel="Clear all history"
          accessibilityState={{ disabled: isEmpty }}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No rolls yet. Head to the Roll tab to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={entries as RollHistoryEntry[]}
          keyExtractor={item => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  )
}
