import type { SURefObjectTable } from 'salvageunion-reference'
import { SalvageUnionReference } from 'salvageunion-reference'

// Extract table names from RollTables
export const SALVAGE_UNION_TABLE_NAMES: readonly string[] =
  SalvageUnionReference.RollTables.all().map(t => t.name) as readonly string[]

export type SalvageUnionTableName = (typeof SALVAGE_UNION_TABLE_NAMES)[number]

export interface SalvageUnionTableListing {
  label: string
  description: string
}

export interface SalvageUnionRollRecord {
  label: string
  key: string
  description: string
  tableName: SalvageUnionTableName
  table: SURefObjectTable
  roll: number
}
