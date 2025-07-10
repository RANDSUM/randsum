import type {
  SalvageUnionHit,
  SalvageUnionTableName,
  SalvageUnionTableType
} from './types'

export const NPCActionTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Nailed It',
    description:
      'The NPC succeeds spectacularly at their action. They get an additional bonus of the Mediator’s choice. If they are making an attack, they hit, and do double damage or get another bonus of the Mediator’s choice.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Success',
    description:
      'The NPC achieves their action successfully. An attack hits and deals standard damage.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Tough Choice',
    description:
      'The NPC is successful, but faces a Tough Choice. The players give the Mediator a choice between two Setbacks. In combat, a weapon attack hits, but with a choice of Setback chosen by the players.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Failure',
    description:
      'The NPC has failed at their action. The players choose an appropriate Setback for failure. In combat, a weapon attack misses.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Cascade Failure',
    description:
      'The NPC has catastrophically failed at their action. They suffer a Severe Setback of the player’s choice. A weapon attack misses, with a Severe Setback chosen by the players.',
    hit: 'Cascade Failure'
  }
}

export const NPCReactionTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Actively Friendly and Helpful',
    description:
      'The NPCs are incredibly friendly and positive towards the group and will actively help them in any reasonable way they can.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Friendly',
    description:
      'The NPCs are friendly and willing to talk, trade, and offer information to the group; however, they will still ask for their fair share in return.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Unfriendly',
    description:
      'The NPCs react in an unfriendly manner to the group; they are difficult to talk or trade with and reluctant to offer any help to the Pilots.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Hostile',
    description:
      'The NPCs are actively hostile to the group. They will defend their area, make motions to attack, gesture and threaten, and be unwilling to help in any way.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Actively Hostile',
    description:
      'The NPCs will launch an attack on the group if appropriate or flee from them, barricade themselves in, and avoid contact as though they were hostile.',
    hit: 'Cascade Failure'
  }
}

export const NPMoraleTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Fight to the Death',
    description:
      'The NPCs see this one through to the end. They hunker down and will not retreat from this fight under any circumstance.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Keep Fighting',
    description: 'The NPCs continue to fight this one out for now.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Fighting Retreat',
    description:
      'The NPCs retreat, but do so whilst continuing to fight. They will fight for one more round and then retreat.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Retreat',
    description: 'The NPCs flee the fight as quickly and safely as possible.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Surrender',
    description:
      'The NPCs surrender to whoever is attacking them. If there is nobody to surrender to, they will recklessly flee.',
    hit: 'Cascade Failure'
  }
}

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

export const GroupInitiativeTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'You shot first',
    description:
      'Two Pilots chosen by the players act first. Play then passes to the NPC group and one NPC chosen by the Mediator acts next.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Quickdraw',
    description:
      'One Pilot chosen by the players acts first. Play then passes to the NPC group and one NPC chosen by the Mediator acts.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Wait and See',
    description:
      'One NPC chosen by the players acts first. Play then passes to the player group and one Pilot chosen by the players acts.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Fumble',
    description:
      'One NPC chosen by the Mediator acts first. Play then passes to the player group and one Pilot chosen by the players acts.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Ambush',
    description:
      'Two NPCs chosen by the Mediator act first. Play then passes to the player group and one Pilot is chosen by the players to act next.',
    hit: 'Cascade Failure'
  }
}

export const RetreatTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Perfect Escape',
    description:
      'The group makes a perfect escape from the situation to any location of their choice within the Region Map and cannot be pursued.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Escape',
    description:
      'The group makes a safe escape from the situation to any adjacent location of their choice within the Map and cannot be pursued.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Dangerous Escape',
    description:
      'The group escapes to any adjacent location of their choice within the Region Map, but at a cost. They must make a Tough Choice related to the situation.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Failed Escape',
    description:
      'The group fails to retreat from the situation and are pinned down. They cannot retreat and must fight it out to the end.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Disastrous Escape',
    description:
      'he group retreat to an adjacent location of their choice within the Region Map, but at a severe cost. They suffer a Severe Setback and may be pursued.',
    hit: 'Cascade Failure'
  }
}

export const CriticalDamageTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Miraculous Survival',
    description:
      'Your Mech is somehow Intact. It has 1 SP and is still fully operational. Your Pilot is unharmed.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Core Damage',
    description:
      'Your Mech Chassis is damaged and inoperable until repaired. All mounted Systems and Modules remain Intact. Your Pilot is reduced to 0 HP unless they have some means to escape the Mech.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Module Destruction',
    description:
      'A Module mounted on your Mech is destroyed. This is chosen by the Mediator or at random. Your Mech Chassis is damaged and inoperable until repaired. Your Pilot is unharmed.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'System Destruction',
    description:
      'A System mounted on your Mech is destroyed. This is chosen by the Mediator or at random. Your Mech Chassis is damaged and inoperable until repaired. Your Pilot is unharmed.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Catastrophic Failure',
    description:
      'The Mech, as well as any mounted Systems and Modules as well as all Cargo, is destroyed. Your Pilot dies unless they have a means to escape the Mech.',
    hit: 'Cascade Failure'
  }
}

export const CriticalInjuryTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Miraculous Survival',
    description:
      'You survive against the odds. You have 1 HP, remain conscious and can act normally.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Unconscious',
    description:
      'You are stable at 0 HP, but unconscious and cannot move or take actions until you gain at least 1 HP. You will regain consciousness naturally in 1 hour and get back up with 1 HP.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Minor Injury',
    description:
      'You suffer a Minor Injury such as a sprain, burns, or minor concussion. Your Max HP is reduced by 1 until healed in a Tech 3 - 4 Med Bay. In addition, you are Unconscious. Apply the result of 11 - 19.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Major Injury',
    description:
      'You suffer a Major Injury such as permanent scarring, broken ribs, or internal injuries. Your Max HP is reduced by 2 until healed in a Tech 5 - 6 Med Bay. In addition, you are Unconscious. Apply the result of 11-19.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Fatal Injury',
    description: 'Your Pilot suffers a fatal injury and dies.',
    hit: 'Cascade Failure'
  }
}

export const ReactorOverloadTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Reactor Overdrive',
    description:
      'Your Mech’s reactor goes into overdrive. Your Mech can take any additional action this turn or Push their next roll within 10 minutes for free.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Reactor Overheat',
    description:
      'Your Mech’s reactor has overheated. Your Mech shuts down and gains the Vulnerable Trait. Your Mech will re-activate at the end of your next turn. In addition, your Mech takes an amount of SP damage equal to your current Heat.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Module Overload',
    description:
      'One of your Mech’s Modules chosen at random or by the Mediator is destroyed.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'System Overload',
    description:
      'One of your Mech’s Systems chosen at random or by the Mediator is destroyed.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Reactor Overload',
    description:
      'Your Mech’s reactor goes into full meltdown and explodes. Your Mech, as well as any mounted Systems, Modules, and all Cargo, is destroyed in the explosion. Everything in Close Range of your Mech takes SP damage equal to your Mech’s Maximum Heat Capacity. They may take any Turn Action or Reaction in response to try to avoid this. Your Pilot dies unless they have a means to escape. The area your Mech was in becomes Irradiated.',
    hit: 'Cascade Failure'
  }
}

export const AreaSalvageTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: 'Jackpot!',
    description:
      'You find a Mech Chassis, System, or Module at the Tech Level of the area. It is in the Damaged Condition. This can be randomised or chosen by the Mediator.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Winning',
    description: 'You find 3 Scrap of the Tech Level of the area.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Not Bad',
    description: 'You find 2 Scrap of the Tech Level of the area.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Better than nothing',
    description: 'You find 1 Scrap of the Tech Level of the area.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Nothing',
    description: 'You find nothing in this area.',
    hit: 'Cascade Failure'
  }
}

export const MechSalvageTable: SalvageUnionTableType = {
  ['Nailed It']: {
    label: "Lion's Share",
    description:
      'You salvage the Mech Chassis, a System and a Module of your choice mounted on it. They both have the Damaged Condition. Anything else is considered destroyed.',
    hit: 'Nailed It'
  },
  ['Success']: {
    label: 'Meat and Potatoes',
    description:
      'You salvage the Mech Chassis or a System or Module of your choice mounted on it. It has the Damaged Condition. Anything else is considered destroyed.',
    hit: 'Success'
  },
  ['Tough Choice']: {
    label: 'Bits and Pieces',
    description:
      'You salvage a System or Module of your choice mounted on the Mech. It has the Damaged Condition. Anything else is considered destroyed.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'Nuts and Bolts',
    description:
      'You salvage half of the Salvage Value of the Mech Chassis in Scrap of its Tech Level, to a minimum of 1. Everything else is considered destroyed.',
    hit: 'Failure'
  },
  ['Cascade Failure']: {
    label: 'Ashes and Dust',
    description:
      'The Mech is unsalvageable: its Chassis, Systems and Modules are all considered destroyed.',
    hit: 'Cascade Failure'
  }
}
export const NPCTables: Partial<
  Record<SalvageUnionTableName, SalvageUnionTableType>
> = {
  ['NPC Action']: NPCActionTable,
  ['Reaction']: NPCReactionTable,
  ['Morale']: NPMoraleTable
}

export const PCTables: Partial<
  Record<SalvageUnionTableName, SalvageUnionTableType>
> = {
  ['Group Initiative']: GroupInitiativeTable,
  ['Retreat']: RetreatTable,
  ['Critical Damage']: CriticalDamageTable,
  ['Critical Injury']: CriticalInjuryTable,
  ['Reactor Overload']: ReactorOverloadTable,
  ['Area Salvage']: AreaSalvageTable,
  ['Mech Salvage']: MechSalvageTable
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

export const AllRollTables: Record<
  SalvageUnionTableName,
  SalvageUnionTableType
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
  ['Mech Salvage']: MechSalvageTable
}

export const customTableFaces: SalvageUnionHit[] = [
  'Cascade Failure',
  'Failure',
  'Failure',
  'Failure',
  'Failure',
  'Tough Choice',
  'Tough Choice',
  'Tough Choice',
  'Tough Choice',
  'Tough Choice',
  'Success',
  'Success',
  'Success',
  'Success',
  'Success',
  'Success',
  'Success',
  'Success',
  'Success',
  'Nailed It'
]
