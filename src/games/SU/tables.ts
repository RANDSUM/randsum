import { SUCoreMechanic, SUTable, SUTableType } from './types'

export const SUNPCActionTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: SUCoreMechanic.nailedIt,
    description:
      'The NPC succeeds spectacularly at their action. They get an additional bonus of the Mediator’s choice. If they are making an attack, they hit, and do double damage or get another bonus of the Mediator’s choice.'
  },
  [SUCoreMechanic.success]: {
    label: SUCoreMechanic.success,
    description:
      'The NPC achieves their action successfully. An attack hits and deals standard damage.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: SUCoreMechanic.toughChoice,
    description:
      'The NPC is successful, but faces a Tough Choice. The players give the Mediator a choice between two Setbacks. In combat, a weapon attack hits, but with a choice of Setback chosen by the players.'
  },
  [SUCoreMechanic.failure]: {
    label: SUCoreMechanic.failure,
    description:
      'The NPC has failed at their action. The players choose an appropriate Setback for failure. In combat, a weapon attack misses.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: SUCoreMechanic.cascadeFailure,
    description:
      'The NPC has catastrophically failed at their action. They suffer a Severe Setback of the player’s choice. A weapon attack misses, with a Severe Setback chosen by the players.'
  }
}

export const SUNPCReactionTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Actively Friendly and Helpful',
    description:
      'The NPCs are incredibly friendly and positive towards the group and will actively help them in any reasonable way they can.'
  },
  [SUCoreMechanic.success]: {
    label: 'Friendly',
    description:
      'The NPCs are friendly and willing to talk, trade, and offer information to the group; however, they will still ask for their fair share in return.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Unfriendly',
    description:
      'The NPCs react in an unfriendly manner to the group; they are difficult to talk or trade with and reluctant to offer any help to the Pilots.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Hostile',
    description:
      'The NPCs are actively hostile to the group. They will defend their area, make motions to attack, gesture and threaten, and be unwilling to help in any way.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Actively Hostile',
    description:
      'The NPCs will launch an attack on the group if appropriate or flee from them, barricade themselves in, and avoid contact as though they were hostile.'
  }
}

export const SUNPMoraleTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Fight to the Death',
    description:
      'The NPCs see this one through to the end. They hunker down and will not retreat from this fight under any circumstance.'
  },
  [SUCoreMechanic.success]: {
    label: 'Keep Fighting',
    description: 'The NPCs continue to fight this one out for now.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Fighting Retreat',
    description:
      'The NPCs retreat, but do so whilst continuing to fight. They will fight for one more round and then retreat.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Retreat',
    description: 'The NPCs flee the fight as quickly and safely as possible.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Surrender',
    description:
      'The NPCs surrender to whoever is attacking them. If there is nobody to surrender to, they will recklessly flee.'
  }
}

export const SUCoreMechanicTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: SUCoreMechanic.nailedIt,
    description:
      'You have overcome the odds and managed an outstanding success. You may achieve an additional bonus of your choice to the action. When dealing damage, you can choose to double it or pick another appropriate bonus effect.'
  },
  [SUCoreMechanic.success]: {
    label: SUCoreMechanic.success,
    description:
      'You have achieved your goal without any compromises. When attacking, you hit the target and deal standard damage.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: SUCoreMechanic.toughChoice,
    description:
      'You succeed in your action, but at a cost. The Mediator gives you a Tough Choice with some kind of Setback attached. When attacking, you hit, but must make a Tough Choice.'
  },
  [SUCoreMechanic.failure]: {
    label: SUCoreMechanic.failure,
    description:
      'You have failed at what you were attempting to do. You face a Setback of the Mediator’s choice. When attacking, you miss the target.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: SUCoreMechanic.cascadeFailure,
    description:
      'Something has gone terribly wrong. You suffer a severe conse- quence of the Mediator’s choice. When attacking, you miss the target and suffer a Setback chosen by the Mediator.'
  }
}

export const SUGroupInitiativeTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'You shot first',
    description:
      'Two Pilots chosen by the players act first. Play then passes to the NPC group and one NPC chosen by the Mediator acts next.'
  },
  [SUCoreMechanic.success]: {
    label: 'Quickdraw',
    description:
      'One Pilot chosen by the players acts first. Play then passes to the NPC group and one NPC chosen by the Mediator acts.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Wait and See',
    description:
      'One NPC chosen by the players acts first. Play then passes to the player group and one Pilot chosen by the players acts.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Fumble',
    description:
      'One NPC chosen by the Mediator acts first. Play then passes to the player group and one Pilot chosen by the players acts.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Ambush',
    description:
      'Two NPCs chosen by the Mediator act first. Play then passes to the player group and one Pilot is chosen by the players to act next.'
  }
}

export const SURetreatTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Perfect Escape',
    description:
      'The group makes a perfect escape from the situation to any location of their choice within the Region Map and cannot be pursued.'
  },
  [SUCoreMechanic.success]: {
    label: 'Escape',
    description:
      'The group makes a safe escape from the situation to any adjacent location of their choice within the Map and cannot be pursued.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Dangerous Escape',
    description:
      'The group escapes to any adjacent location of their choice within the Region Map, but at a cost. They must make a Tough Choice related to the situation.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Failed Escape',
    description:
      'The group fails to retreat from the situation and are pinned down. They cannot retreat and must fight it out to the end.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Disastrous Escape',
    description:
      'he group retreat to an adjacent location of their choice within the Region Map, but at a severe cost. They suffer a Severe Setback and may be pursued.'
  }
}

export const SUCriticalDamageTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Miraculous Survival',
    description:
      'Your Mech is somehow Intact. It has 1 SP and is still fully operational. Your Pilot is unharmed.'
  },
  [SUCoreMechanic.success]: {
    label: 'Core Damage',
    description:
      ' Your Mech Chassis is damaged and inoperable until repaired. All mounted Systems and Modules remain Intact. Your Pilot is reduced to 0 HP unless they have some means to escape the Mech.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Module Destruction',
    description:
      ' A Module mounted on your Mech is destroyed. This is chosen by the Mediator or at random. Your Mech Chassis is damaged and inoperable until repaired. Your Pilot is unharmed.'
  },
  [SUCoreMechanic.failure]: {
    label: 'System Destruction',
    description:
      'A System mounted on your Mech is destroyed. This is chosen by the Mediator or at random. Your Mech Chassis is damaged and inoperable until repaired. Your Pilot is unharmed.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Catastrophic Failure',
    description:
      'The Mech, as well as any mounted Systems and Modules as well as all Cargo, is destroyed. Your Pilot dies unless they have a means to escape the Mech.'
  }
}

export const SUCriticalInjuryTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Miraculous Survival',
    description:
      'You survive against the odds. You have 1 HP, remain conscious and can act normally.'
  },
  [SUCoreMechanic.success]: {
    label: 'Unconscious',
    description:
      'You are stable at 0 HP, but unconscious and cannot move or take actions until you gain at least 1 HP. You will regain consciousness naturally in 1 hour and get back up with 1 HP.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Minor Injury',
    description:
      'You suffer a Minor Injury such as a sprain, burns, or minor concussion. Your Max HP is reduced by 1 until healed in a Tech 3 - 4 Med Bay. In addition, you are Unconscious. Apply the result of 11 - 19.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Major Injury',
    description:
      'You suffer a Major Injury such as permanent scarring, broken ribs, or internal injuries. Your Max HP is reduced by 2 until healed in a Tech 5 - 6 Med Bay. In addition, you are Unconscious. Apply the result of 11-19.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Fatal Injury',
    description: 'Your Pilot suffers a fatal injury and dies.'
  }
}

export const SUReactorOverloadTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Reactor Overdrive',
    description:
      'Your Mech’s reactor goes into overdrive. Your Mech can take any additional action this turn or Push their next roll within 10 minutes for free.'
  },
  [SUCoreMechanic.success]: {
    label: 'Reactor Overheat',
    description:
      'Your Mech’s reactor has overheated. Your Mech shuts down and gains the Vulnerable Trait. Your Mech will re-activate at the end of your next turn. In addition, your Mech takes an amount of SP damage equal to your current Heat.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Module Overload',
    description:
      'One of your Mech’s Modules chosen at random or by the Mediator is destroyed.'
  },
  [SUCoreMechanic.failure]: {
    label: 'System Overload',
    description:
      'One of your Mech’s Systems chosen at random or by the Mediator is destroyed.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Reactor Overload',
    description:
      'Your Mech’s reactor goes into full meltdown and explodes. Your Mech, as well as any mounted Systems, Modules, and all Cargo, is destroyed in the explosion. Everything in Close Range of your Mech takes SP damage equal to your Mech’s Maximum Heat Capacity. They may take any Turn Action or Reaction in response to try to avoid this. Your Pilot dies unless they have a means to escape. The area your Mech was in becomes Irradiated.'
  }
}

export const SUAreaSalvageTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: 'Jackpot!',
    description:
      'You find a Mech Chassis, System, or Module at the Tech Level of the area. It is in the Damaged Condition. This can be randomised or chosen by the Mediator.'
  },
  [SUCoreMechanic.success]: {
    label: 'Winning',
    description: 'You find 3 Scrap of the Tech Level of the area.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Not Bad',
    description: 'You find 2 Scrap of the Tech Level of the area.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Better than nothing',
    description: 'You find 1 Scrap of the Tech Level of the area.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Nothing',
    description: 'You find nothing in this area.'
  }
}

export const SUMechSalvageTable: SUTableType = {
  [SUCoreMechanic.nailedIt]: {
    label: "Lion's Share",
    description:
      'You salvage the Mech Chassis, a System and a Module of your choice mounted on it. They both have the Damaged Condition. Anything else is considered destroyed.'
  },
  [SUCoreMechanic.success]: {
    label: 'Meat and Potatoes',
    description:
      'You salvage the Mech Chassis or a System or Module of your choice mounted on it. It has the Damaged Condition. Anything else is considered destroyed.'
  },
  [SUCoreMechanic.toughChoice]: {
    label: 'Bits and Pieces',
    description:
      'You salvage a System or Module of your choice mounted on the Mech. It has the Damaged Condition. Anything else is considered destroyed.'
  },
  [SUCoreMechanic.failure]: {
    label: 'Nuts and Bolts',
    description:
      'You salvage half of the Salvage Value of the Mech Chassis in Scrap of its Tech Level, to a minimum of 1. Everything else is considered destroyed.'
  },
  [SUCoreMechanic.cascadeFailure]: {
    label: 'Ashes and Dust',
    description:
      'The Mech is unsalvageable: its Chassis, Systems and Modules are all considered destroyed.'
  }
}
export const SUNPCTables = {
  [SUTable.npcAction]: SUNPCActionTable,
  [SUTable.npcReaction]: SUNPCReactionTable,
  [SUTable.npcMorale]: SUNPMoraleTable
}

export const SURollTables = {
  ...SUNPCTables,
  [SUTable.coreMechanic]: SUCoreMechanicTable,
  [SUTable.groupInitiative]: SUGroupInitiativeTable,
  [SUTable.retreat]: SURetreatTable
}
