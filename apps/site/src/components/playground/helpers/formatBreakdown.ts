import type { RollRecord } from '@randsum/roller'

export interface RollBreakdown {
  readonly notation: string
  readonly description: readonly string[]
  readonly rolled: readonly number[]
  readonly kept: readonly number[]
  readonly diceTotal: number
  readonly total: number
}

export function formatBreakdown(record: RollRecord): RollBreakdown {
  return {
    notation: record.notation,
    description: record.description,
    rolled: record.modifierHistory.initialRolls,
    kept: record.modifierHistory.modifiedRolls,
    diceTotal: record.modifierHistory.total,
    total: record.appliedTotal
  }
}
