import type { SalvageUnionTableName, SalvageUnionTableType } from '../types'
import { NPCActionTable, NPCReactionTable, NPCTables, NPMoraleTable } from './npcTables'
import {
  AreaSalvageTable,
  CriticalDamageTable,
  CriticalInjuryTable,
  GroupInitiativeTable,
  MechSalvageTable,
  PCTables,
  ReactorOverloadTable,
  RetreatTable
} from './pcTables'

export const CoreMechanicTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Nailed It',
    description:
      'You have overcome the odds and managed an outstanding success. You may achieve an additional bonus of your choice to the action. When dealing damage, you can choose to double it or pick another appropriate bonus effect.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Success',
    description:
      'You have achieved your goal without any compromises. When attacking, you hit the target and deal standard damage.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Tough Choice',
    description:
      'You succeed in your action, but at a cost. The Mediator gives you a Tough Choice with some kind of Setback attached. When attacking, you hit, but must make a Tough Choice.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Failure',
    description:
      'You have failed at what you were attempting to do. You face a Setback of the Mediator’s choice. When attacking, you miss the target.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Cascade Failure',
    description:
      'Something has gone terribly wrong. You suffer a severe consequence of the Mediator’s choice. When attacking, you miss the target and suffer a Setback chosen by the Mediator.',
    hit: 'Cascade Failure'
  }
}

export const RollTables: {
  ['Core Mechanic']: SalvageUnionTableType
  pc: typeof PCTables
  npc: typeof NPCTables
} = {
  ['Core Mechanic']: CoreMechanicTable,
  pc: PCTables,
  npc: NPCTables
}

export const AllRollTables: Record<SalvageUnionTableName, SalvageUnionTableType> = {
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
  ['Mech Salvage']: MechSalvageTable
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
  MechSalvageTable
} from './pcTables'
