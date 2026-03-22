import type { RollArgument } from '@randsum/roller'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { RollResultView } from '../components/RollResultView'
import { useRoll } from '../hooks/useRoll'
import { useRollResultStore } from '../lib/stores/rollResultStore'

export default function ResultScreen(): React.JSX.Element | null {
  const router = useRouter()
  const pending = useRollResultStore(s => s.pending)
  const clear = useRollResultStore(s => s.clear)
  const { roll } = useRoll()

  // Clear result from store on unmount
  useEffect(() => {
    return () => {
      clear()
    }
  }, [clear])

  if (pending === null) {
    // No result in store — navigate back (e.g. direct deep link with no result)
    router.back()
    return null
  }

  function handleRollAgain(): void {
    roll(pending!.notation as RollArgument)
  }

  return (
    <View style={styles.container}>
      <RollResultView
        result={pending}
        onRollAgain={handleRollAgain}
        onSaveAsTemplate={() => undefined}
        onShare={() => undefined}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
