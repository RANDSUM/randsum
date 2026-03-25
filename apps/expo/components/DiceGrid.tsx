import { StyleSheet, View } from 'react-native'

import { DieButton } from './DieButton'

const ROW1 = [4, 6, 8] as const
const ROW2 = [10, 12, 20] as const
const PERCENTILE = 100

interface DiceGridProps {
  readonly onDiePress: (sides: number) => void
  readonly onPercentilePress: () => void
}

export function DiceGrid({ onDiePress, onPercentilePress }: DiceGridProps): React.JSX.Element {
  return (
    <View style={styles.grid}>
      <View style={styles.row}>
        {ROW1.map(sides => (
          <DieButton key={sides} sides={sides} onPress={() => onDiePress(sides)} />
        ))}
      </View>
      <View style={styles.row}>
        {ROW2.map(sides => (
          <DieButton key={sides} sides={sides} onPress={() => onDiePress(sides)} />
        ))}
      </View>
      <View style={styles.row}>
        <DieButton sides={PERCENTILE} label="d%" onPress={onPercentilePress} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center'
  },
  row: {
    flexDirection: 'row',
    gap: 10
  }
})
