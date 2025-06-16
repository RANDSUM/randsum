import { D20 } from '@randsum/dice'
import { AllRollTables } from './tables'
import type { SUHit, SUTableName, SUTableResult } from './types'

/**
 * Interprets a d20 roll result according to Salvage Union rules
 *
 * @param result - The d20 roll result (1-20)
 * @returns Salvage Union hit category
 * @internal
 */
function interpretHit(result: number): SUHit {
  switch (true) {
    case result === 20:
      return 'Nailed It'
    case result >= 11 && result <= 19:
      return 'Success'
    case result >= 6 && result <= 10:
      return 'Tough Choice'
    case result >= 2 && result <= 5:
      return 'Failure'
    default:
      return 'Cascade Failure'
  }
}

/**
 * Rolls dice using Salvage Union mechanics with roll tables
 *
 * This function implements the d20 system used in Salvage Union,
 * where results are interpreted according to specific outcome categories
 * and then cross-referenced with contextual roll tables to provide
 * narrative outcomes for different scenarios.
 *
 * @param tableName - The roll table to use for interpreting results (default: 'Core Mechanic')
 *
 * @returns A tuple containing:
 *   - The complete table result with hit category, description, and metadata
 *   - The raw d20 roll value
 *
 * @example
 * // Basic core mechanic roll
 * const [result, roll] = rollSU()
 * // result contains hit category, description, and table info
 * // roll is the raw d20 value (1-20)
 *
 * @example
 * // Specific table roll
 * const [result] = rollSU('Mech Salvage')
 * // Uses the Mech Salvage table for interpretation
 *
 * @example
 * // Check the hit category
 * const [result] = rollSU()
 * console.log(result.hit) // 'Nailed It', 'Success', 'Tough Choice', 'Failure', or 'Cascade Failure'
 */
export function rollSU(
  tableName: SUTableName = 'Core Mechanic'
): [SUTableResult, number] {
  const total = D20.roll()
  const hit = interpretHit(total)
  const table = AllRollTables[tableName]
  const result = table[hit]
  return [{ ...result, hit, table, tableName, roll: total }, total]
}
