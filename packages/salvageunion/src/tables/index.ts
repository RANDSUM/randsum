import type {
  SalvageUnionNumericTable,
  SalvageUnionTableName,
  SalvageUnionTableType
} from '../types'
import {
  AIPersonalityTable,
  CrawlerNameTable,
  KeepsakeTable,
  MechAppearanceTable,
  MechPatternNamesTable,
  MottoTable,
  PilotAppearanceTable,
  QuirksTable
} from './genericTables'
import { NPCActionTable, NPCReactionTable, NPCTables, NPMoraleTable } from './npcTables'
import {
  AreaSalvageTable,
  CrawlerDamageTable,
  CrawlerDestructionTable,
  CrawlerDeteroriationTable,
  CriticalDamageTable,
  CriticalInjuryTable,
  GroupInitiativeTable,
  MechSalvageTable,
  PCTables,
  ReactorOverloadTable,
  RetreatTable
} from './pcTables'
import { Mechapult } from './systemModuleTables'
import { mechanicTableFactory } from './utils'

export const CoreMechanicTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'Nailed It',
    description:
      'You have overcome the odds and managed an outstanding success. You may achieve an additional bonus of your choice to the action. When dealing damage, you can choose to double it or pick another appropriate bonus effect.'
  },
  success: {
    label: 'Success',
    description:
      'You have achieved your goal without any compromises. When attacking, you hit the target and deal standard damage.'
  },
  toughChoice: {
    label: 'Tough Choice',
    description:
      'You succeed in your action, but at a cost. The Mediator gives you a Tough Choice with some kind of Setback attached. When attacking, you hit, but must make a Tough Choice.'
  },
  failure: {
    label: 'Failure',
    description:
      'You have failed at what you were attempting to do. You face a Setback of the Mediator’s choice. When attacking, you miss the target.'
  },
  cascadeFailure: {
    label: 'Cascade Failure',
    description:
      'Something has gone terribly wrong. You suffer a severe consequence of the Mediator’s choice. When attacking, you miss the target and suffer a Setback chosen by the Mediator.'
  }
})

export const RollTables: {
  ['Core Mechanic']: SalvageUnionTableType
  pc: typeof PCTables
  npc: typeof NPCTables
} = {
  ['Core Mechanic']: CoreMechanicTable,
  pc: PCTables,
  npc: NPCTables
}

export const AllRollTables: Record<
  SalvageUnionTableName,
  SalvageUnionTableType | SalvageUnionNumericTable
> = {
  ['Core Mechanic']: CoreMechanicTable,
  ['NPC Action']: NPCActionTable,
  ['Reaction']: NPCReactionTable,
  ['Morale']: NPMoraleTable,
  ['Group Initiative']: GroupInitiativeTable,
  ['Retreat']: RetreatTable,
  ['Critical Damage']: CriticalDamageTable,
  ['Critical Injury']: CriticalInjuryTable,
  ['Reactor Overload']: ReactorOverloadTable,
  ['Area Salvage']: AreaSalvageTable,
  ['Mech Salvage']: MechSalvageTable,
  ['Crawler Deterioration']: CrawlerDeteroriationTable,
  ['Crawler Damage']: CrawlerDamageTable,
  ['Crawler Destruction']: CrawlerDestructionTable,
  ['Keepsake']: KeepsakeTable,
  ['Motto']: MottoTable,
  ['Pilot Appearance']: PilotAppearanceTable,
  ['AI Personality']: AIPersonalityTable,
  ['Quirks']: QuirksTable,
  ['Mech Appearance']: MechAppearanceTable,
  ['Mech Pattern Names']: MechPatternNamesTable,
  ['Crawler Name']: CrawlerNameTable,
  ['Mechapult']: Mechapult
}

export { NPCTables, NPCActionTable, NPCReactionTable, NPMoraleTable } from './npcTables'

export {
  PCTables,
  GroupInitiativeTable,
  RetreatTable,
  CriticalDamageTable,
  CriticalInjuryTable,
  ReactorOverloadTable,
  AreaSalvageTable,
  MechSalvageTable,
  CrawlerDeteroriationTable,
  CrawlerDamageTable,
  CrawlerDestructionTable
} from './pcTables'
