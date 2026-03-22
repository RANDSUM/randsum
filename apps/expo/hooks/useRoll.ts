import type { RollArgument } from '@randsum/roller'
import { roll as executeRoll } from '@randsum/roller'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import { storage } from '../lib/storage'
import { useRollResultStore } from '../lib/stores/rollResultStore'
import type { RollHistoryEntry } from '../lib/types'

interface UseRollOptions {
  readonly templateId?: string
  readonly gameId?: string
}

interface UseRollReturn {
  readonly roll: (...args: readonly RollArgument[]) => void
  readonly isPending: boolean
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useRoll(options?: UseRollOptions): UseRollReturn {
  const router = useRouter()
  const setPending = useRollResultStore(s => s.setPending)
  const [isPending, setIsPending] = useState(false)

  function roll(...args: readonly RollArgument[]): void {
    const result = executeRoll(...(args as RollArgument[]))

    const notation = result.rolls.map(r => r.notation).join('+')
    const parsed = {
      total: result.total,
      records: result.rolls,
      notation
    }

    // Write result to store before navigating so result.tsx can read it
    setPending(parsed)
    router.push('/result')

    // Append to history async — does not block the overlay from appearing
    setIsPending(true)
    const entry: RollHistoryEntry = {
      id: generateId(),
      notation,
      total: result.total,
      rolls: result.rolls,
      createdAt: new Date().toISOString(),
      ...(options?.gameId !== undefined ? { gameId: options.gameId } : {}),
      ...(options?.templateId !== undefined ? { templateId: options.templateId } : {})
    }
    storage
      .appendHistory(entry)
      .catch(() => {
        // Storage failures are silent — the overlay has already opened
      })
      .finally(() => {
        setIsPending(false)
      })
  }

  return { roll, isPending }
}
