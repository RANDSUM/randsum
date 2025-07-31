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
  | 'Crawler Deterioration'
  | 'Crawler Damage'
  | 'Crawler Destruction'
  | 'Keepsake'
  | 'Motto'
  | 'Pilot Appearance'
  | 'AI Personality'
  | 'Quirks'
  | 'Mech Appearance'
  | 'Mech Pattern Names'
  | 'Crawler Name'
  | 'Mechapult'

export interface SalvageUnionTableListing {
  label: string
  description: string
  hit: SalvageUnionHit
}

export type SalvageUnionTableType = Record<SalvageUnionHit, SalvageUnionTableListing>
export type SalvageUnionNumericTable = Record<number, string>
export interface SalvageUnionRollRecord {
  hit: string
  label: SalvageUnionTableListing['label']
  description: SalvageUnionTableListing['description']
  tableName: SalvageUnionTableName
  table: SalvageUnionTableType | SalvageUnionNumericTable
  roll: number
}
