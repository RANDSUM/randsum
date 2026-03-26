import type { RollResult } from '@randsum/dice-ui'
import { NotationRoller, QuickReferenceGrid } from '@randsum/dice-ui'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '../hooks/useTheme'
import { buildNotationUrl, copyLink } from '../lib/sharing'
import type { ParsedRollResult } from '../lib/parseRollResult'
import { useNotationStore } from '../lib/stores/notationStore'

export default function IndexScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const notation = useNotationStore(s => s.notation)
  const setNotation = useNotationStore(s => s.setNotation)
  const [result, setResult] = useState<ParsedRollResult | null>(null)

  // Seed notation from ?n= on web (runs once on mount)
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const params = new URLSearchParams(window.location.search)
    const initial = params.get('n')
    if (initial !== null && initial.length > 0) {
      setNotation(initial)
    }
  }, [setNotation])

  // Debounced URL sync — update ?n= as user types (web only)
  const urlSyncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (Platform.OS !== 'web') return
    urlSyncTimer.current = setTimeout(() => {
      const next =
        notation.length > 0
          ? `${window.location.pathname}${buildNotationUrl(notation)}`
          : window.location.pathname
      history.replaceState({}, '', next)
    }, 300)
    return () => {
      if (urlSyncTimer.current !== undefined) {
        clearTimeout(urlSyncTimer.current)
      }
    }
  }, [notation])

  function handleRoll(rollResult: RollResult): void {
    setResult({
      total: rollResult.total,
      records: rollResult.records,
      notation: rollResult.notation
    })
  }

  function handleClearResult(): void {
    setResult(null)
  }

  function handleAddFragment(fragment: string): void {
    setNotation(notation + fragment)
  }

  function handleCopyLink(): void {
    void copyLink(notation)
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.rollerWrap}>
          <NotationRoller notation={notation} onChange={setNotation} onRoll={handleRoll} />
        </View>

        {result !== null && (
          <View
            style={[
              styles.resultCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border }
            ]}
          >
            <Pressable
              onPress={handleClearResult}
              style={styles.resultClose}
              accessibilityRole="button"
              accessibilityLabel="Dismiss result"
            >
              <Text
                style={[
                  styles.resultCloseText,
                  { color: tokens.textMuted, fontSize: fontSizes.sm }
                ]}
              >
                ✕
              </Text>
            </Pressable>
            <Text
              style={[styles.resultTotal, { color: tokens.accent, fontSize: fontSizes['3xl'] }]}
            >
              {result.total}
            </Text>
            <Text
              style={[styles.resultNotation, { color: tokens.textMuted, fontSize: fontSizes.sm }]}
            >
              {result.notation}
            </Text>
          </View>
        )}

        {Platform.OS === 'web' && (
          <View style={styles.webActions}>
            <Pressable
              onPress={handleCopyLink}
              style={[styles.webButton, { borderColor: tokens.border }]}
              accessibilityRole="button"
              accessibilityLabel="Copy link to this notation"
            >
              <Text style={[styles.webButtonText, { color: tokens.text, fontSize: fontSizes.sm }]}>
                Copy Link
              </Text>
            </Pressable>
          </View>
        )}

        <QuickReferenceGrid onAdd={handleAddFragment} notation={notation} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16
  },
  rollerWrap: {
    paddingBottom: 4
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4
  },
  resultClose: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 4
  },
  resultCloseText: {
    fontFamily: 'JetBrainsMono_400Regular'
  },
  resultTotal: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontWeight: '700'
  },
  resultNotation: {
    fontFamily: 'JetBrainsMono_400Regular'
  },
  webActions: {
    flexDirection: 'row',
    gap: 8
  },
  webButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8
  },
  webButtonText: {
    fontFamily: 'JetBrainsMono_400Regular'
  }
})
