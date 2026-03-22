import type { RollArgument } from '@randsum/roller'
import { SafeAreaView, StyleSheet, View } from 'react-native'

import { ActionRow } from '../../components/ActionRow'
import { DiceGrid } from '../../components/DiceGrid'
import { PoolDisplay } from '../../components/PoolDisplay'
import { RollButton } from '../../components/RollButton'
import { useRoll } from '../../hooks/useRoll'
import { useTheme } from '../../hooks/useTheme'
import { usePoolStore } from '../../lib/stores/poolStore'

export default function RollScreen(): React.JSX.Element {
  const { tokens } = useTheme()
  const pool = usePoolStore(s => s.pool)
  const isEmpty = usePoolStore(s => s.isEmpty)
  const increment = usePoolStore(s => s.increment)
  const decrement = usePoolStore(s => s.decrement)
  const clear = usePoolStore(s => s.clear)
  const toArguments = usePoolStore(s => s.toArguments)
  const toNotation = usePoolStore(s => s.toNotation)
  const { roll } = useRoll()

  const notation = toNotation()

  function handleRoll(): void {
    if (isEmpty) return
    const args = toArguments()
    roll(...(args as RollArgument[]))
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tokens.bg }]}>
      <View style={styles.container}>
        <View style={styles.top}>
          <PoolDisplay notation={notation} />
        </View>

        <View style={styles.middle}>
          <DiceGrid pool={pool} onIncrement={increment} onDecrement={decrement} />
          <View style={styles.actionRow}>
            <ActionRow onClear={clear} isSaveEnabled={!isEmpty} />
          </View>
        </View>

        <View style={styles.bottom}>
          <RollButton enabled={!isEmpty} onPress={handleRoll} />
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
  }
})
