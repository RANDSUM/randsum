import { StyleSheet, Text, View } from 'react-native'

export default function ResultScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Result</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b'
  },
  text: {
    color: '#fafafa',
    fontSize: 18
  }
})
