import { AllRollTables } from '../tables'
import type {
  SalvageUnionRollRecord,
  SalvageUnionTableListing,
  SalvageUnionTableName,
  SalvageUnionTableType
} from '../types'
import type { RollRecord, RollResult } from '@randsum/roller'
import { rollWrapper } from '@randsum/roller'
import { customTableFaces } from './customTableFaces'

const rollTable: (
  tableName?: SalvageUnionTableName
) => RollResult<SalvageUnionRollRecord, RollRecord<SalvageUnionTableListing>> =
  rollWrapper({
    validateInput: (tableName: SalvageUnionTableName = 'Core Mechanic') => {
      if (!(AllRollTables[tableName] as undefined | SalvageUnionTableType)) {
        const availableTables = Object.keys(AllRollTables).join(', ')
        throw new Error(
          `Invalid Salvage Union table name: "${tableName}". Available tables: ${availableTables}`
        )
      }
      return tableName
    },
    toArg: (tableName: SalvageUnionTableName = 'Core Mechanic') => [
      {
        sides: customTableFaces.map((face) => AllRollTables[tableName][face])
      }
    ],
    validateResult: ({
      rolls,
      result: [result],
      total
    }): {
      rolls: RollRecord<SalvageUnionTableListing>[]
      result: SalvageUnionTableListing
      total: number
    } => {
      if (!result) {
        throw new Error('Failed to properly roll.')
      }
      return {
        rolls,
        result,
        total
      }
    },
    toValidatedResult: (
      { rolls, result, total },
      tableName = 'Core Mechanic'
    ) => {
      return {
        rolls,
        result: {
          ...result,
          table: AllRollTables[tableName],
          tableName,
          roll: total
        }
      }
    }
  })
export { rollTable }
