import type { SalvageUnionTableName, SalvageUnionTableType } from '../types'
import { mechanicTableFactory } from './utils'

export const GroupInitiativeTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'You shot first',
    description:
      'Two Pilots chosen by the players act first. Play then passes to the NPC group and one NPC chosen by the Mediator acts next.'
  },
  success: {
    label: 'Quickdraw',
    description:
      'One Pilot chosen by the players acts first. Play then passes to the NPC group and one NPC chosen by the Mediator acts.'
  },
  toughChoice: {
    label: 'Wait and See',
    description:
      'One NPC chosen by the Mediator acts first. Play then passes to the player group and one Pilot chosen by the players acts.'
  },
  failure: {
    label: 'Fumble',
    description:
      'One NPC chosen by the players acts first. Play then passes to the player group and one Pilot chosen by the players acts.'
  },
  cascadeFailure: {
    label: 'Ambush',
    description:
      'Two NPCs chosen by the Mediator act first. Play then passes to the player group and one Pilot is chosen by the players to act next.'
  }
})

export const RetreatTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'Perfect Escape',
    description:
      'The group makes a perfect escape from the situation to any location of their choice within the Region Map and cannot be pursued.'
  },
  success: {
    label: 'Escape',
    description:
      'The group makes a safe escape from the situation to any adjacent location of their choice within the Map and cannot be pursued.'
  },
  toughChoice: {
    label: 'Dangerous Escape',
    description:
      'The group escapes to any adjacent location of their choice within the Region Map, but at a cost. They must make a Tough Choice related to the situation.'
  },
  failure: {
    label: 'Failed Escape',
    description:
      'The group fails to retreat from the situation and are pinned down. They cannot retreat and must fight it out to the end.'
  },
  cascadeFailure: {
    label: 'Disastrous Escape',
    description:
      'The group retreat to an adjacent location of their choice within the Region Map, but at a severe cost. They suffer a Severe Setback and may be pursued.'
  }
})

export const CriticalDamageTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'Miraculous Survival',
    description:
      'Your Mech is somehow Intact. It has 1 SP and is still fully operational. Your Pilot is unharmed.'
  },
  success: {
    label: 'Core Damage',
    description:
      'Your Mech Chassis is damaged and inoperable until repaired. All mounted Systems and Modules remain Intact. Your Pilot is unharmed.'
  },
  toughChoice: {
    label: 'Module Destruction',
    description:
      'A Module mounted on your Mech is destroyed. This is chosen by the Mediator or at random. Your Mech Chassis is damaged and inoperable until repaired. Your Pilot is unharmed.'
  },
  failure: {
    label: 'System Destruction',
    description:
      'A System mounted on your Mech is destroyed. This is chosen by the Mediator or at random. Your Mech Chassis is damaged and inoperable until repaired. Your Pilot is unharmed.'
  },
  cascadeFailure: {
    label: 'Catastrophic Failure',
    description:
      'The Mech, as well as any mounted Systems and Modules as well as all Cargo, is destroyed. Your Pilot dies unless they have a means to escape the Mech.'
  }
})

export const CriticalInjuryTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'Miraculous Survival',
    description:
      'You survive against the odds. You have 1 HP, remain conscious and can act normally.'
  },
  success: {
    label: 'Unconscious',
    description:
      'You are stable at 0 HP, but unconscious and cannot move or take actions until you gain at least 1 HP. You will regain consciousness naturally in 1 hour and get back up with 1 HP.'
  },
  toughChoice: {
    label: 'Minor Injury',
    description:
      'You suffer a Minor Injury such as a sprain, burns, or minor concussion. Your Max HP is reduced by 1 until healed in a Tech 3 - 4 Med Bay. In addition, you are Unconscious. Apply the result of 11 - 19.'
  },
  failure: {
    label: 'Major Injury',
    description:
      'You suffer a Major Injury such as permanent scarring, broken ribs, or internal injuries. Your Max HP is reduced by 2 until healed in a Tech 5 - 6 Med Bay. In addition, you are Unconscious. Apply the result of 11-19.'
  },
  cascadeFailure: {
    label: 'Fatal Injury',
    description: 'Your Pilot suffers a fatal injury and dies.'
  }
})

export const ReactorOverloadTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'Reactor Overdrive',
    description:
      'Your Mech’s reactor goes into overdrive. Your Mech can take any additional action this turn or Push their next roll within 10 minutes for free.'
  },
  success: {
    label: 'Reactor Overheat',
    description:
      'Your Mech’s reactor has overheated. Your Mech shuts down and gains the Vulnerable Trait. Your Mech will re-activate at the end of your next turn. In addition, your Mech takes an amount of SP damage equal to your current Heat.'
  },
  toughChoice: {
    label: 'Module Overload',
    description: 'One of your Mech’s Modules chosen at random or by the Mediator is destroyed.'
  },
  failure: {
    label: 'System Overload',
    description: 'One of your Mech’s Systems chosen at random or by the Mediator is destroyed.'
  },
  cascadeFailure: {
    label: 'Reactor Meltdown',
    description:
      'Your Mech’s reactor goes into full meltdown and explodes. Your Mech, as well as any mounted Systems, Modules, and all Cargo, is destroyed in the explosion. Everything in Close Range of your Mech takes SP damage equal to your Mech’s Maximum Heat Capacity. They may take any Turn Action or Reaction in response to try to avoid this. Your Pilot dies unless they have a means to escape. The area your Mech was in becomes Irradiated.'
  }
})

export const AreaSalvageTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: 'Jackpot!',
    description:
      'You find a Mech Chassis, System, or Module at the Tech Level of the area. It is in the Damaged Condition. This can be randomised or chosen by the Mediator.'
  },
  success: {
    label: 'Winning',
    description: 'You find 3 Scrap of the Tech Level of the area.'
  },
  toughChoice: {
    label: 'Not Bad',
    description: 'You find 2 Scrap of the Tech Level of the area.'
  },
  failure: {
    label: 'Better than nothing',
    description: 'You find 1 Scrap of the Tech Level of the area.'
  },
  cascadeFailure: {
    label: 'Nothing',
    description: 'You find nothing in this area.'
  }
})

export const MechSalvageTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    label: "Lion's Share",
    description:
      'You salvage the Mech Chassis, a System and a Module of your choice mounted on it. They both have the Damaged Condition. Anything else is considered destroyed.'
  },
  success: {
    label: 'Meat and Potatoes',
    description:
      'You salvage the Mech Chassis or a System or Module of your choice mounted on it. It has the Damaged Condition. Anything else is considered destroyed.'
  },
  toughChoice: {
    label: 'Bits and Pieces',
    description:
      'You salvage a System or Module of your choice mounted on the Mech. It has the Damaged Condition. Anything else is considered destroyed.'
  },
  failure: {
    label: 'Nuts and Bolts',
    description:
      'You salvage half of the Salvage Value of the Mech Chassis in Scrap of its Tech Level, to a minimum of 1. Everything else is considered destroyed.'
  },
  cascadeFailure: {
    label: 'Ashes and Dust',
    description:
      'The Mech is unsalvageable: its Chassis, Systems and Modules are all considered destroyed.'
  }
})

export const CrawlerDeteriorationTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    description: 'Your Union Crawler chugs along for now.'
  },
  success: {
    description: 'Your Union Crawler loses 5 Structure Points.'
  },
  toughChoice: {
    description:
      'Choose a Bay on your Union Crawler. It becomes Damaged and inoperable. You no longer benefit from any of its functions until it is repaired to the Intact Condition.'
  },
  failure: {
    description:
      'A Bay chosen at random on your Union Crawler is Damaged and inoperable. You no longer benefit from any of its functions until it is repaired to the Intact Condition.'
  },
  cascadeFailure: {
    description:
      'Your Union Crawler loses 5 Structure Points and a Bay chosen at random is Damaged until repaired to the Intact Condition.'
  }
})

export const CrawlerDamageTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    description: 'Your Union Crawler survives any significant damage this time.'
  },
  success: {
    description:
      'Your Union Crawler is inoperable and grounded. Its Bays are Intact, but inoperable.  You must pay your Union Crawler’s Upkeep Cost in order to repair it to be fully functioning again. Around 10% of your Union Crawler’s population are severely injured or killed.'
  },
  toughChoice: {
    description:
      'Choose a Bay on your Union Crawler. It is Damaged and inoperable. You no longer benefit from any of its functions until it is repaired to the Intact Condition. Around 5% of your Union Crawler’s population are severely injured or killed.'
  },
  failure: {
    description:
      'A Bay chosen at random on your Union Crawler is Damaged and inoperable. You no longer benefit from any of its functions until it is repaired to the Intact Condition.  Around 5% of your Union Crawler population are severely injured or die.'
  },
  cascadeFailure: {
    description:
      'Your Union Crawler is Destroyed as a mass series of malfunctions causes it to entirely collapse. Roll on the Union Crawler Destruction Table.'
  }
})

export const CrawlerDestructionTable: SalvageUnionTableType = mechanicTableFactory({
  nailedIt: {
    description:
      'There is hope. Everyone on board is somewhat battered and bruised, but manages to escape the Union Crawler safely. Your Union Crawler can be rebuilt from the wreckage for its current Upgrade Cost in Scrap of its Tech Level or higher.'
  },
  success: {
    description:
      'The Union Crawler is torn apart. All of its Bays are damaged. Around 25% of the Union Crawler’s population are severely injured or killed. Any Salvager Pilots on board must roll on the Critical Injury Table. The Union Crawler can be rebuilt for its current Upgrade Cost in Scrap of its Tech Level or higher.'
  },
  toughChoice: {
    description:
      'You must choose between saving the Union Crawler population and saving the Union Crawler itself. If you choose the population, the Union Crawler is entirely destroyed and cannot be rebuilt. If you choose the Union Crawler, assume all Bays are damaged.  It can be rebuilt for its current Upgrade Cost in Scrap of its Tech Level or higher, but you have to find new people to join it in the wastelands.'
  },
  failure: {
    description:
      'The Union Crawler is destroyed, and the majority of its population are killed or severely injured. The Salvager Pilots must roll on the Critical Injury Table. Any survivors must find a way to rebuild.'
  },
  cascadeFailure: {
    description:
      'The Union Crawler suffers critical damage, goes into a reactor meltdown, and explodes. The Union Crawler is destroyed beyond all recognition. It cannot be rebuilt.  Everyone and everything on board and within Medium Range takes 50 Structure Points of damage, and can be assumed destroyed or killed outright.'
  }
})

export const PCTables: Partial<Record<SalvageUnionTableName, SalvageUnionTableType>> = {
  ['Group Initiative']: GroupInitiativeTable,
  ['Retreat']: RetreatTable,
  ['Critical Damage']: CriticalDamageTable,
  ['Critical Injury']: CriticalInjuryTable,
  ['Reactor Overload']: ReactorOverloadTable,
  ['Area Salvage']: AreaSalvageTable,
  ['Mech Salvage']: MechSalvageTable,
  ['Crawler Deterioration']: CrawlerDeteriorationTable,
  ['Crawler Damage']: CrawlerDamageTable,
  ['Crawler Destruction']: CrawlerDestructionTable
}
