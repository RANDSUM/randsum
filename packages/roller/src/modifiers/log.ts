import type { ModifierConfig, ModifierLog } from '../types'

export function createArithmeticLog(
  modifier: string,
  options: ModifierConfig | undefined
): ModifierLog {
  return {
    modifier,
    options,
    added: [],
    removed: []
  }
}

/**
 * Creates a ModifierLog by computing the multiset difference between
 * initialRolls and newRolls.
 *
 * Values appearing more in newRolls -> added[]
 * Values appearing less in newRolls (more in initialRolls) -> removed[]
 *
 * Example: [1, 3, 3] -> [3, 3, 5]: added=[5], removed=[1]
 *
 * Implementation: sort both arrays and walk in parallel. Two allocations
 * (the sorted copies) vs the previous three (two Maps + a Set), no Map
 * lookups in the hot loop. Consumers that care about ordering of
 * `added`/`removed` should sort them on the read side — this function
 * treats both as multisets.
 */
export function createModifierLog(
  modifier: string,
  options: ModifierConfig | undefined,
  initialRolls: number[],
  newRolls: number[],
  replacements?: readonly { readonly from: number; readonly to: number }[]
): ModifierLog {
  const baseLog = { modifier, options }

  if (initialRolls === newRolls) {
    return { ...baseLog, added: [], removed: [] }
  }

  if (initialRolls.length === 0) {
    return { ...baseLog, added: [...newRolls], removed: [] }
  }

  if (newRolls.length === 0) {
    return { ...baseLog, added: [], removed: [...initialRolls] }
  }

  const sortedInitial = [...initialRolls].sort((a, b) => a - b)
  const sortedNew = [...newRolls].sort((a, b) => a - b)

  const added: number[] = []
  const removed: number[] = []

  // Walk both sorted arrays with index cursors held on a mutable object
  // (const binding, mutable field — the lint rule bans `let` but allows this).
  // Unchecked index access returns `T | undefined`, so we narrow before use.
  const cursor = { i: 0, j: 0 }
  while (cursor.i < sortedInitial.length || cursor.j < sortedNew.length) {
    const a = sortedInitial[cursor.i]
    const b = sortedNew[cursor.j]
    if (a === undefined && b !== undefined) {
      added.push(b)
      cursor.j++
    } else if (b === undefined && a !== undefined) {
      removed.push(a)
      cursor.i++
    } else if (a !== undefined && b !== undefined) {
      if (a === b) {
        cursor.i++
        cursor.j++
      } else if (a < b) {
        removed.push(a)
        cursor.i++
      } else {
        added.push(b)
        cursor.j++
      }
    }
  }

  const log: ModifierLog = { ...baseLog, added, removed }
  if (replacements !== undefined && replacements.length > 0) {
    log.replacements = replacements
  }
  return log
}
