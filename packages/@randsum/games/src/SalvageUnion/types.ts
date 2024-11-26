export enum Hit {
  nailedIt = 'Nailed It',
  success = 'Success',
  toughChoice = 'Tough Choice',
  failure = 'Failure',
  cascadeFailure = 'Cascade Failure'
}

export enum TableName {
  npcAction = 'NPC Action',
  npcReaction = 'Reaction',
  npcMorale = 'Morale',
  coreMechanic = 'Core Mechanic',
  groupInitiative = 'Group Initiative',
  retreat = 'Retreat',
  criticalDamage = 'Critical Damage',
  criticalInjury = 'Critical Injury',
  reactorOverload = 'Reactor Overload',
  areaSalvage = 'Area Salvage',
  mechSalvage = 'Mech Salvage'
}

export type TableListing = {
  label: string
  description: string
}

export type TableResult = {
  hit: Hit
  tableName: TableName
  table: TableType
  roll: number
} & TableListing

export type TableType = {
  [key in Hit]: TableListing
}
