import type { SalvageUnionTableName, SalvageUnionTableType } from '../types'

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
    description: 'One of your Mech’s Modules chosen at random or by the Mediator is destroyed.',
    hit: 'Tough Choice'
  },
  ['Failure']: {
    label: 'System Overload',
    description: 'One of your Mech’s Systems chosen at random or by the Mediator is destroyed.',
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

export const PCTables: Partial<Record<SalvageUnionTableName, SalvageUnionTableType>> = {
  ['Group Initiative']: GroupInitiativeTable,
  ['Retreat']: RetreatTable,
  ['Critical Damage']: CriticalDamageTable,
  ['Critical Injury']: CriticalInjuryTable,
  ['Reactor Overload']: ReactorOverloadTable,
  ['Area Salvage']: AreaSalvageTable,
  ['Mech Salvage']: MechSalvageTable
}
