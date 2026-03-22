import { StyleSheet, View } from 'react-native'

import { DieButton } from './DieButton'

const DIE_SIDES = [4, 6, 8, 10, 12, 20] as const

interface DiceGridProps {
  readonly pool: Readonly<Record<number, number>>
  readonly onIncrement: (sides: number) => void
  readonly onDecrement: (sides: number) => void
}

export function DiceGrid({ pool, onIncrement, onDecrement }: DiceGridProps): React.JSX.Element {
  const row1 = DIE_SIDES.slice(0, 3)
  const row2 = DIE_SIDES.slice(3)

  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {row1.map(sides => (
          <DieButton
            key={sides}
            sides={sides}
            count={pool[sides] ?? 0}
            onPress={() => onIncrement(sides)}
            onLongPress={() => onDecrement(sides)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {row2.map(sides => (
          <DieButton
            key={sides}
            sides={sides}
            count={pool[sides] ?? 0}
            onPress={() => onIncrement(sides)}
            onLongPress={() => onDecrement(sides)}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    gap: 8
  },
  row: {
    flexDirection: 'row',
    gap: 8
  }
})
