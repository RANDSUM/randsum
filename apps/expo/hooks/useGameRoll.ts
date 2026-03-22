import { roll as rollBlades } from '@randsum/games/blades'
import { roll as rollDaggerheart } from '@randsum/games/daggerheart'
import { roll as rollFifth } from '@randsum/games/fifth'
import { roll as rollPbta } from '@randsum/games/pbta'
import { roll as rollRootRpg } from '@randsum/games/root-rpg'
import { roll as rollSalvageunion } from '@randsum/games/salvageunion'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'

import type { RollRecord } from '@randsum/roller'

import { generateId } from '../lib/generateId'
import type { SupportedGameId } from '../lib/gameConfig'
import { useRollResultStore } from '../lib/stores/rollResultStore'
import { storage } from '../lib/storage'
import type { RollHistoryEntry } from '../lib/types'

const GAME_ROLL_MAP: Readonly<
  Record<
    SupportedGameId,
    (inputs: Record<string, unknown>) => {
      readonly total: number
      readonly result: unknown
      readonly rolls: readonly RollRecord[]
    }
  >
> = {
  blades: inputs => rollBlades(inputs as { rating?: number }),
  fifth: inputs =>
    rollFifth(
      inputs as { modifier?: number; rollingWith?: 'Advantage' | 'Disadvantage'; crit?: boolean }
    ),
  daggerheart: inputs =>
    rollDaggerheart(
      inputs as {
        modifier?: number
        amplifyHope?: boolean
        amplifyFear?: boolean
        rollingWith?: 'Advantage' | 'Disadvantage'
      }
    ),
  pbta: inputs =>
    rollPbta(
      inputs as {
        stat: number
        forward?: number
        ongoing?: number
        rollingWith?: 'Advantage' | 'Disadvantage'
      }
    ),
  'root-rpg': inputs => rollRootRpg(inputs as { bonus: number }),
  salvageunion: inputs => rollSalvageunion(inputs as { tableName: string })
}

interface UseGameRollReturn {
  readonly roll: (inputs: Record<string, unknown>) => void
  readonly isPending: boolean
}

export function useGameRoll(gameId: SupportedGameId): UseGameRollReturn {
  const router = useRouter()
  const setPending = useRollResultStore(s => s.setPending)
  const [isPending, setIsPending] = useState(false)
  const inFlight = useRef(false)

  const roll = useCallback(
    (inputs: Record<string, unknown>): void => {
      if (inFlight.current) return
      inFlight.current = true

      try {
        const rollFn = GAME_ROLL_MAP[gameId]
        const result = rollFn(inputs)

        const notation = `${gameId} roll`
        const parsed = {
          total: result.total,
          records: result.rolls,
          notation
        }

        setPending(parsed)
        router.push('/result')

        setIsPending(true)
        const entry: RollHistoryEntry = {
          id: generateId(),
          notation,
          total: result.total,
          rolls: result.rolls,
          createdAt: new Date().toISOString(),
          gameId
        }
        storage
          .appendHistory(entry)
          .catch(() => {
            // Storage failures are silent
          })
          .finally(() => {
            setIsPending(false)
            inFlight.current = false
          })
      } catch (error) {
        inFlight.current = false
        throw error
      }
    },
    [gameId, router, setPending]
  )

  return { roll, isPending }
}
