import { AllRollTables } from '../tables'
import type {
  SalvageUnionTableName,
  SalvageUnionTableResult,
  SalvageUnionTableType
} from '../types'
import { rollWrapper } from '@randsum/roller'
import { customTableFaces } from './customTableFaces'

const rollTable: (
  tableName?: SalvageUnionTableName
) => SalvageUnionTableResult = rollWrapper({
  toArg: (tableName: SalvageUnionTableName = 'Core Mechanic') => {
    if (!(AllRollTables[tableName] as undefined | SalvageUnionTableType)) {
      const availableTables = Object.keys(AllRollTables).join(', ')
      throw new Error(
        `Invalid Salvage Union table name: "${tableName}". Available tables: ${availableTables}`
      )
    }
    return {
      sides: customTableFaces.map((face) => AllRollTables[tableName][face])
    }
  },
  toResult: (
    { rolls, result: [result], total },
    tableName = 'Core Mechanic'
  ) => {
    if (!result) {
      throw new Error('Failed to properly roll.')
    }

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
