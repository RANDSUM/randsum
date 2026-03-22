import { useState } from 'react'
import type { RollArgument } from '@randsum/roller'
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native'

import { ActionRow } from '../../components/ActionRow'
import { DiceGrid } from '../../components/DiceGrid'
import { NotationInput } from '../../components/NotationInput'
import { NotationReference } from '../../components/NotationReference'
import { PoolDisplay } from '../../components/PoolDisplay'
import { RollButton } from '../../components/RollButton'
import { useRoll } from '../../hooks/useRoll'
import { useTheme } from '../../hooks/useTheme'
import { useNotationStore } from '../../lib/stores/notationStore'
import { usePoolStore } from '../../lib/stores/poolStore'

type RollMode = 'advanced' | 'simple'

export default function RollScreen(): React.JSX.Element {
  const { tokens, fontSizes } = useTheme()
  const [mode, setMode] = useState<RollMode>('simple')

  const pool = usePoolStore(s => s.pool)
  const isEmpty = usePoolStore(s => s.isEmpty)
  const increment = usePoolStore(s => s.increment)
  const decrement = usePoolStore(s => s.decrement)
  const clear = usePoolStore(s => s.clear)
  const toArguments = usePoolStore(s => s.toArguments)
  const toNotation = usePoolStore(s => s.toNotation)

  const notation = useNotationStore(s => s.notation)
  const isValid = useNotationStore(s => s.isValid)
  const hasError = useNotationStore(s => s.hasError)
  const setNotation = useNotationStore(s => s.setNotation)

  const { roll } = useRoll()

  const poolNotation = toNotation()

  function handleSwitchToAdvanced(): void {
    const currentNotation = toNotation()
    if (currentNotation !== null) {
      setNotation(currentNotation)
    }
    setMode('advanced')
  }

  function handleSwitchToSimple(): void {
    setMode('simple')
  }

  function handleSimpleRoll(): void {
    if (isEmpty) return
    const args = toArguments()
    roll(...(args as RollArgument[]))
  }

  function handleAdvancedRoll(): void {
    if (!isValid) return
    roll(notation as RollArgument)
  }

  function handleAppendNotation(fragment: string): void {
    setNotation(notation + fragment)
  }

  if (mode === 'advanced') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
        <View style={styles.container}>
          <View style={styles.advancedHeader}>
            <Pressable
              onPress={handleSwitchToSimple}
              accessibilityRole="button"
              accessibilityLabel="Back to Simple Mode"
              style={[styles.backButton, { borderColor: tokens.border }]}
            >
              <Text style={[styles.backLabel, { color: tokens.text, fontSize: fontSizes.base }]}>
                Simple
              </Text>
            </Pressable>
          </View>

          <View style={styles.advancedContent}>
            <NotationInput
              notation={notation}
              isValid={isValid}
              hasError={hasError}
              onChangeNotation={setNotation}
            />
            <NotationReference onAppend={handleAppendNotation} />
          </View>

          <View style={styles.bottom}>
            <RollButton enabled={isValid} onPress={handleAdvancedRoll} />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <View style={styles.container}>
        <View style={styles.top}>
          <PoolDisplay notation={poolNotation} />
        </View>

        <View style={styles.middle}>
          <DiceGrid pool={pool} onIncrement={increment} onDecrement={decrement} />
          <View style={styles.actionRow}>
            <ActionRow
              onClear={clear}
              onNotation={handleSwitchToAdvanced}
              isSaveEnabled={!isEmpty}
            />
          </View>
        </View>

        <View style={styles.bottom}>
          <RollButton enabled={!isEmpty} onPress={handleSimpleRoll} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between'
  },
  top: {
    paddingBottom: 8
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    gap: 12
  },
  actionRow: {
    marginTop: 8
  },
  bottom: {
    paddingTop: 12,
    paddingBottom: 8
  },
  advancedHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingBottom: 8
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backLabel: {
    fontWeight: '500'
  },
  advancedContent: {
    flex: 1,
    gap: 16
  }
})
