import { roll } from '@randsum/roller'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'

export default function App() {
  const d20 = roll(20)
  const fourD6DropLowest = roll('4d6L')

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RANDSUM Dice Roller</Text>
      <Text style={styles.result}>d20: {d20.total}</Text>
      <Text style={styles.result}>4d6 drop lowest: {fourD6DropLowest.total}</Text>
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  result: {
    fontSize: 18
  }
})
