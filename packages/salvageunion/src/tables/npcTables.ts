import type { SalvageUnionTableName, SalvageUnionTableType } from '../types'

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

export const NPCTables: Partial<
  Record<SalvageUnionTableName, SalvageUnionTableType>
> = {
  ['NPC Action']: NPCActionTable,
  ['Reaction']: NPCReactionTable,
  ['Morale']: NPMoraleTable
}
