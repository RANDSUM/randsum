import type { RollResult } from '@randsum/dice-ui'
import { NotationRoller, QuickReferenceGrid } from '@randsum/dice-ui'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '../hooks/useTheme'
import { buildNotationUrl, copyLink } from '../lib/sharing'
import { serializeRollResult } from '../lib/parseRollResult'
import { useNotationStore } from '../lib/stores/notationStore'

export default function IndexScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const router = useRouter()
  const notation = useNotationStore(s => s.notation)
  const setNotation = useNotationStore(s => s.setNotation)

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
    const data = serializeRollResult({
      total: rollResult.total,
      records: rollResult.records,
      notation: rollResult.notation
    })
    router.push({ pathname: '/result', params: { data } })
  }

  function handleAddFragment(fragment: string): void {
    setNotation(notation + fragment)
  }

  function handleCopyLink(): void {
    void copyLink(notation)
  }

  const isWeb = Platform.OS === 'web'

  const roller = (
    <View
      style={[
        styles.rollerWrap,
        isWeb
          ? { borderBottomWidth: 1, borderBottomColor: tokens.border }
          : { borderTopWidth: 1, borderTopColor: tokens.border }
      ]}
    >
      <NotationRoller notation={notation} onChange={setNotation} onRoll={handleRoll} />

      {isWeb && (
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
    </View>
  )

  const grid = (
    <QuickReferenceGrid onAdd={handleAddFragment} notation={notation} inverted={!isWeb} />
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <View style={styles.content}>
        {isWeb ? (
          <>
            {roller}
            {grid}
          </>
        ) : (
          <>
            {grid}
            {roller}
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingTop: 8,
    gap: 16
  },
  rollerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8
  },
  webActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
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
