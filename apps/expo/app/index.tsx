import type { RollResult } from '@randsum/dice-ui'
import {
  DocModal,
  NotationRoller,
  QuickReferenceGrid,
  RollResultPanel,
  tokenColor
} from '@randsum/dice-ui'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import { useEffect, useRef, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { RollResultView } from '../components/RollResultView'
import { WebHeader } from '../components/WebHeader'
import { useTheme } from '../hooks/useTheme'
import { buildNotationUrl } from '../lib/sharing'
import type { ParsedRollResult } from '../lib/parseRollResult'
import { useNotationStore } from '../lib/stores/notationStore'

export default function IndexScreen(): React.JSX.Element {
  const { tokens } = useTheme()
  const notation = useNotationStore(s => s.notation)
  const setNotation = useNotationStore(s => s.setNotation)
  const [result, setResult] = useState<ParsedRollResult | null>(null)
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null)

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

  function handleDocSelect(key: string): void {
    setSelectedDocKey(prev => (prev === key ? null : key))
  }

  function handleCloseDoc(): void {
    setSelectedDocKey(null)
  }

  const isWeb = Platform.OS === 'web'
  const { width } = useWindowDimensions()
  const isDesktop = isWeb && width >= 768

  const roller = (
    <View
      style={[
        styles.rollerWrap,
        isWeb
          ? ({
              borderBottomWidth: 1,
              borderBottomColor: tokens.border,
              position: 'sticky',
              top: 0,
              zIndex: 10000,
              backgroundColor: tokens.bg
            } as object)
          : { borderTopWidth: 1, borderTopColor: tokens.border }
      ]}
    >
      <NotationRoller notation={notation} onChange={setNotation} onRoll={handleRoll} />
    </View>
  )

  const grid = (
    <QuickReferenceGrid
      onAdd={handleAddFragment}
      notation={notation}
      inverted={!isWeb}
      suppressModal={isWeb}
      selectedEntry={isWeb ? selectedDocKey : undefined}
      onSelect={isWeb ? handleDocSelect : undefined}
    />
  )

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <WebHeader />
      <View style={styles.content}>
        {isWeb ? (
          <View
            style={[
              styles.webShell,
              isDesktop
                ? ({
                    width: '62.5%',
                    maxWidth: 1200,
                    alignSelf: 'center',
                    overflowY: 'auto'
                  } as object)
                : ({ overflowY: 'auto', paddingHorizontal: 12 } as object)
            ]}
          >
            {roller}
            {grid}
          </View>
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
              {isWeb ? (
                <RollResultPanel
                  total={result.total}
                  records={result.records}
                  notation={result.notation}
                  onClose={handleCloseResult}
                />
              ) : (
                <RollResultView result={result} />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {isWeb &&
        selectedDocKey !== null &&
        (() => {
          const doc = NOTATION_DOCS[selectedDocKey]
          if (doc === undefined) return null
          const accentColor =
            tokenColor(doc, tokens.bg === '#09090b' ? 'dark' : 'light') ?? tokens.accent
          return (
            <DocModal
              doc={doc}
              accentColor={accentColor}
              notation={notation}
              onClose={handleCloseDoc}
              onAdd={handleAddFragment}
            />
          )
        })()}
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
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8
  },
  webShell: {
    flex: 1
  },
  webGridWrap: {
    flex: 1
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
