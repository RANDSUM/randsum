import { useLocalSearchParams, useRouter } from 'expo-router'

import { RollResultView } from '../components/RollResultView'
import { parseRollResult } from '../lib/parseRollResult'
import { shareRollResult } from '../lib/sharing'

export default function ResultScreen(): React.JSX.Element | null {
  const router = useRouter()
  const { data } = useLocalSearchParams<{ data: string }>()
  const result = parseRollResult(data)

  if (result === null) {
    router.back()
    return null
  }

  function handleRollAgain(): void {
    router.back()
  }

  function handleShare(): void {
    if (result !== null) {
      void shareRollResult(result)
    }
  }

  return <RollResultView result={result} onRollAgain={handleRollAgain} onShare={handleShare} />
}
