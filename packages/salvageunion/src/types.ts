export type SalvageUnionHit =
  | 'Nailed It'
  | 'Success'
  | 'Tough Choice'
  | 'Failure'
  | 'Cascade Failure'

export type SalvageUnionTableName =
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

export interface SalvageUnionTableListing {
  label: string
  description: string
  hit: SalvageUnionHit
}

export type SalvageUnionTableType = Record<SalvageUnionHit, SalvageUnionTableListing>
export interface SalvageUnionRollRecord {
  hit: SalvageUnionHit
  label: SalvageUnionTableListing['label']
  description: SalvageUnionTableListing['description']
  tableName: SalvageUnionTableName
  table: SalvageUnionTableType
  roll: number
}
