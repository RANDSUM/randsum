import type { System, Table } from 'salvageunion-reference'

export type SalvageUnionTableName =
  | 'NPC Action'
  | 'Reaction Roll'
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
}

export interface SalvageUnionRollRecord {
  label: string
  description: string
  tableName: SalvageUnionTableName
  table: Table['rollTable'] | System['rollTable']
  roll: number
}
