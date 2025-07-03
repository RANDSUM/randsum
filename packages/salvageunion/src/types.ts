export type SUHit =
  | 'Nailed It'
  | 'Success'
  | 'Tough Choice'
  | 'Failure'
  | 'Cascade Failure'

export type SUTableName =
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

export interface SUTableListing {
  label: string
  description: string
}

export type SUTableResult = {
  hit: SUHit
  tableName: SUTableName
  table: SUTableType
  roll: number
} & SUTableListing

export type SUTableType = Record<SUHit, SUTableListing>
