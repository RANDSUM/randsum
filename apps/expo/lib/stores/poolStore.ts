import type { DiceNotation, RollArgument } from '@randsum/roller'
import { create } from 'zustand'

type DicePool = {
  readonly [sides: number]: number
}

interface PoolState {
  readonly pool: DicePool
  readonly isEmpty: boolean
  increment(sides: number): void
  decrement(sides: number): void
  clear(): void
  toNotation(): string | null
  toArguments(): readonly RollArgument[]
}

function computeIsEmpty(pool: DicePool): boolean {
  return Object.keys(pool).length === 0
}

export const usePoolStore = create<PoolState>()((set, get) => ({
  pool: {},
  isEmpty: true,

  increment(sides: number) {
    set(state => {
      const current = state.pool[sides] ?? 0
      const pool = { ...state.pool, [sides]: current + 1 }
      return { pool, isEmpty: computeIsEmpty(pool) }
    })
  },

  decrement(sides: number) {
    set(state => {
      const current = state.pool[sides]
      if (current === undefined || current <= 0) return state
      const pool = { ...state.pool }
      if (current === 1) {
        delete pool[sides]
      } else {
        pool[sides] = current - 1
      }
      return { pool, isEmpty: computeIsEmpty(pool) }
    })
  },

  clear() {
    set({ pool: {}, isEmpty: true })
  },

  toNotation(): string | null {
    const pool = get().pool
    const sides = Object.keys(pool)
      .map(Number)
      .sort((a, b) => a - b)
    if (sides.length === 0) return null
    return sides.map(s => `${pool[s]}d${s}`).join('+')
  },

  toArguments(): readonly RollArgument[] {
    const pool = get().pool
    const sides = Object.keys(pool)
      .map(Number)
      .sort((a, b) => a - b)
    return sides.map(s => `${pool[s]}d${s}` as DiceNotation)
  }
}))
