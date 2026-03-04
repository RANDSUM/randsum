import type { RollerRollResult } from '@randsum/roller'
import type { HistoryEntry, RollGroup } from '../types'
import { describeNotation } from './describeNotation'

export function getDroppedIndices(
  initialRolls: number[],
  modifiedRolls: number[]
): number[] {
  const remaining = [...modifiedRolls]
  const dropped: number[] = []
  // Iterate in reverse so that when duplicates exist, later indices are
  // matched first — leaving earlier (lower-priority) indices as dropped.
  const matched = new Array<boolean>(initialRolls.length).fill(false)
  for (let i = initialRolls.length - 1; i >= 0; i--) {
    const val = initialRolls[i]!
    const pos = remaining.lastIndexOf(val)
    if (pos !== -1) {
      remaining.splice(pos, 1)
      matched[i] = true
    }
  }
  for (let i = 0; i < initialRolls.length; i++) {
    if (!matched[i]) {
      dropped.push(i)
    }
  }
  return dropped
}

export function buildHistoryEntry(
  notation: string,
  result: RollerRollResult
): HistoryEntry {
  const groups: RollGroup[] = result.rolls.map(record => {
    const initialRolls = record.modifierHistory.initialRolls
    const modifiedRolls = record.modifierHistory.modifiedRolls
    return {
      notation: record.parameters.notation,
      initialRolls,
      modifiedRolls,
      droppedIndices: getDroppedIndices(initialRolls, modifiedRolls),
      groupTotal: record.total,
    }
  })
  return {
    id: crypto.randomUUID(),
    notation,
    description: describeNotation(notation),
    total: result.total,
    groups,
    timestamp: Date.now(),
  }
}
