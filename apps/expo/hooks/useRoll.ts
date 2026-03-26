import type { RollArgument } from '@randsum/roller'
import { roll as executeRoll } from '@randsum/roller'
import { useEffect, useRef, useState } from 'react'

import type { ParsedRollResult } from '../lib/parseRollResult'

interface UseRollReturn {
  readonly roll: (...args: readonly RollArgument[]) => void
  readonly result: ParsedRollResult | null
  readonly isPending: boolean
  readonly clearResult: () => void
}

export function useRoll(): UseRollReturn {
  const [result, setResult] = useState<ParsedRollResult | null>(null)
  const [isPending, setIsPending] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  function roll(...args: readonly RollArgument[]): void {
    setIsPending(true)

    try {
      const rollResult = executeRoll(...(args as RollArgument[]))
      const notation = rollResult.rolls.map(r => r.notation).join('+')
      const parsed: ParsedRollResult = {
        total: rollResult.total,
        records: rollResult.rolls,
        notation
      }
      if (isMounted.current) {
        setResult(parsed)
      }
    } finally {
      if (isMounted.current) {
        setIsPending(false)
      }
    }
  }

  function clearResult(): void {
    setResult(null)
  }

  return { roll, result, isPending, clearResult }
}
