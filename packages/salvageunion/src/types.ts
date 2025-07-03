export type Hit =
  | 'Nailed It'
  | 'Success'
  | 'Tough Choice'
  | 'Failure'
  | 'Cascade Failure'

export type TableName =
  | 'NPC Action'
  | 'Reaction'
  | 'Morale'
  | 'Core Mechanic'
  | 'Group Initiative'
  | 'Retreat'
  | 'Critical Damage'
  | 'Critical Injury'
  | 'Reactor Overload'
  | 'Area Salvage'
  | 'Mech Salvage'

export interface TableListing {
  label: string
  description: string
}

export type TableType = Record<Hit, TableListing>

export type TableResult = {
  hit: Hit
  tableName: TableName
  table: TableType
  roll: number
} & TableListing
