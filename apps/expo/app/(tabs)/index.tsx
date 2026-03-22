import type { RollArgument } from '@randsum/roller'
import { NotationRoller, QuickReferenceGrid } from '@randsum/dice-ui'
import type { RollResult } from '@randsum/dice-ui'
import { SafeAreaView, StyleSheet, View } from 'react-native'

import { ActionRow } from '../../components/ActionRow'
import { DiceGrid } from '../../components/DiceGrid'
import { PoolDisplay } from '../../components/PoolDisplay'
import { RollButton } from '../../components/RollButton'
import { useRoll } from '../../hooks/useRoll'
import { useTheme } from '../../hooks/useTheme'
import { useNotationStore } from '../../lib/stores/notationStore'
import { usePoolStore } from '../../lib/stores/poolStore'
import { useRollModeStore } from '../../lib/stores/rollModeStore'

export default function RollScreen(): React.JSX.Element {
  const { tokens } = useTheme()
  const mode = useRollModeStore(s => s.mode)

  const pool = usePoolStore(s => s.pool)
  const isEmpty = usePoolStore(s => s.isEmpty)
  const increment = usePoolStore(s => s.increment)
  const decrement = usePoolStore(s => s.decrement)
  const clear = usePoolStore(s => s.clear)
  const toArguments = usePoolStore(s => s.toArguments)

  const notation = useNotationStore(s => s.notation)
  const isValid = useNotationStore(s => s.isValid)
  const setNotation = useNotationStore(s => s.setNotation)

  const { roll } = useRoll()

  const poolNotation = usePoolStore(s => s.toNotation)()

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
        <View style={styles.advancedContainer}>
          <View style={styles.rollerWrap}>
            <NotationRoller
              notation={notation}
              onChange={setNotation}
              onRoll={(result: RollResult) => {
                roll(result.notation as RollArgument)
              }}
            />
          </View>
          <View style={styles.referenceWrap}>
            <QuickReferenceGrid onAdd={handleAppendNotation} notation={notation} />
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
            <ActionRow onClear={clear} isSaveEnabled={!isEmpty} />
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
  advancedContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12
  },
  rollerWrap: {
    gap: 0
  },
  referenceWrap: {
    flex: 1
  }
})
