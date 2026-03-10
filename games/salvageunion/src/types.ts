import type { SURefObjectTable } from 'salvageunion-reference'
import { SalvageUnionReference } from 'salvageunion-reference'

export const SALVAGE_UNION_TABLE_NAMES: readonly string[] = Object.freeze(
  SalvageUnionReference.RollTables.all()
    .filter(t => t.indexable)
    .map(t => t.name)
)

// Note: SalvageUnionTableName resolves to `string` at the type level because
// table names are derived from the runtime salvageunion-reference dependency
// and cannot be narrowed to a string literal union. Runtime validation in roll()
// ensures only valid table names are accepted.
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
