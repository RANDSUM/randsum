import type { RollTable, System } from 'salvageunion-reference'

export const SALVAGE_UNION_TABLE_NAMES: readonly string[] = [
  'NPC Action',
  'Reaction Roll',
  'Morale',
  'Core Mechanic',
  'Group Initiative',
  'Retreat',
  'Critical Damage',
  'Critical Injury',
  'Reactor Overload',
  'Area Salvage',
  'Mech Salvage',
  'Crawler Deterioration',
  'Crawler Damage',
  'Crawler Destruction',
  'Keepsake',
  'Motto',
  'Pilot Appearance',
  'AI Personality',
  'Quirks',
  'Mech Appearance',
  'Mech Pattern Names',
  'Crawler Name',
  'Mechapult'
] as const

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
  table: RollTable['table'] | System['table']
  roll: number
}
