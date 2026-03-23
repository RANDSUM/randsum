import type { RollArgument } from '@randsum/roller'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import { RollResultView } from '../components/RollResultView'
import { useRoll } from '../hooks/useRoll'
import { shareRollResult } from '../lib/sharing'
import { useRollResultStore } from '../lib/stores/rollResultStore'

export default function ResultScreen(): React.JSX.Element | null {
  const router = useRouter()
  const pending = useRollResultStore(s => s.pending)
  const archivedAt = useRollResultStore(s => s.archivedAt)
  const clear = useRollResultStore(s => s.clear)
  const { roll } = useRoll()
  const rerollNotation = useRef<string | null>(null)

  // Clear result from store on unmount — and trigger re-roll if queued
  useEffect(() => {
    return () => {
      clear()
      if (rerollNotation.current !== null) {
        const notation = rerollNotation.current
        rerollNotation.current = null
        // Small delay to let modal fully close before re-opening
        setTimeout(() => {
          roll(notation as RollArgument)
        }, 150)
      }
    }
  }, [clear, roll])

  if (pending === null) {
    router.back()
    return null
  }

  function handleRollAgain(): void {
    // Queue the re-roll notation, then close the modal
    rerollNotation.current = pending!.notation
    router.back()
  }

  return (
    <View style={styles.container}>
      <RollResultView
        result={pending}
        onRollAgain={handleRollAgain}
        onSaveAsTemplate={() => undefined}
        onShare={() => shareRollResult(pending)}
        archivedAt={archivedAt}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})
