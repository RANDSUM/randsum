import type { RollResult } from '@randsum/dice-ui'
import { NotationRoller, QuickReferenceGrid } from '@randsum/dice-ui'
import { useEffect, useRef, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { RollResultView } from '../components/RollResultView'
import { WebHeader } from '../components/WebHeader'
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

  // Escape key handler — dismiss result modal on web
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setResult(null)
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [result])

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

  function handleCloseResult(): void {
    setResult(null)
  }

  function handleAddFragment(fragment: string): void {
    setNotation(notation + fragment)
  }

  function handleCopyLink(): void {
    void copyLink(notation)
  }

  const isWeb = Platform.OS === 'web'
  const { width } = useWindowDimensions()
  const isDesktop = isWeb && width >= 768

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
            <WebHeader />
            {isDesktop ? (
              <View testID="desktop-two-col" style={styles.webTwoCol}>
                <View style={styles.webLeftCol}>{roller}</View>
                <View
                  style={[
                    styles.webRightCol,
                    // Web-only CSS properties — position:sticky + independent scroll
                    // React Native Web passes these through to the DOM; the cast is
                    // required because RN's ViewStyle type does not include CSS-only props.
                    { position: 'sticky', maxHeight: '100vh', overflowY: 'auto' } as object
                  ]}
                >
                  {grid}
                </View>
              </View>
            ) : (
              <>
                {roller}
                <details open={false}>
                  <summary
                    style={{
                      color: 'var(--dui-color-text-muted)',
                      cursor: 'pointer',
                      paddingTop: 'var(--dui-space-sm)',
                      paddingBottom: 'var(--dui-space-sm)'
                    }}
                  >
                    Notation Reference
                  </summary>
                  {grid}
                </details>
              </>
            )}
          </>
        ) : (
          <>
            {grid}
            {roller}
          </>
        )}
      </View>

      {result !== null && (
        <Modal visible transparent animationType="fade" onRequestClose={handleCloseResult}>
          <Pressable
            style={[styles.modalBackdrop, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={handleCloseResult}
          >
            <Pressable
              style={[
                styles.modalContent,
                { backgroundColor: tokens.bg, borderColor: tokens.accent }
              ]}
              onPress={() => {}}
            >
              <RollResultView result={result} />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingTop: 8
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
  },
  webTwoCol: {
    flexDirection: 'row',
    flex: 1,
    gap: 24
  },
  webLeftCol: {
    flex: 1
  },
  webRightCol: {
    flex: 1,
    alignSelf: 'flex-start'
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden'
  }
})
