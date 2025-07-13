import { AllRollTables, customTableFaces } from '../tables'
import type { SalvageUnionTableName, SalvageUnionTableResult } from '../types'
import { rollCustom } from '@randsum/roller'

/**
 * Roll on a Salvage Union table to determine outcome.
 *
 * @param tableName - Name of the table to roll on (defaults to 'Core Mechanic')
 * @returns Table result with hit type, label, description, and roll value
 *
 * @throws {Error} When tableName is not a valid Salvage Union table
 *
 * @example
 * ```typescript
 * // Roll on default Core Mechanic table
 * const coreRoll = rollTable()
 *
 * // Roll on specific table
 * const moraleRoll = rollTable('Morale')
 * const damageRoll = rollTable('Critical Damage')
 *
 * // Check the result
 * switch (result.hit) {
 *   case 'Nailed It':       // 20
 *   case 'Success':         // 11-19
 *   case 'Tough Choice':    // 6-10
 *   case 'Failure':         // 2-5
 *   case 'Cascade Failure': // 1
 * }
 * ```
 */
export function rollTable(
  tableName: SalvageUnionTableName = 'Core Mechanic'
): SalvageUnionTableResult {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, security/detect-object-injection
  if (tableName && !AllRollTables[tableName]) {
    const availableTables = Object.keys(AllRollTables).join(', ')
    throw new Error(
      `Invalid Salvage Union table name: "${tableName}". Available tables: ${availableTables}`
    )
  }

  // eslint-disable-next-line security/detect-object-injection
  const table = AllRollTables[tableName]

  // eslint-disable-next-line security/detect-object-injection
  const faces = customTableFaces.map((face) => table[face])

  const rollResult = rollCustom(faces)

  return {
    ...rollResult.result,
    table,
    tableName,
    roll: rollResult.baseResult.total
  }
}
