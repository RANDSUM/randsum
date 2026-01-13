/**
 * Common dice notation patterns for testing
 */
export const commonNotations = {
  advantage: '2d20H',
  disadvantage: '2d20L',
  abilityScore: '4d6L',
  damage: '1d8+3',
  skillCheck: '1d20+5',
  basic: '2d6',
  percentile: '1d100',
  exploding: '3d6!',
  reroll: '4d6R{1}',
  cap: '4d20C{>18}'
} as const

/**
 * Common roll options for testing
 */
export const commonRollOptions = {
  d20: { sides: 20, quantity: 1 },
  d6x2: { sides: 6, quantity: 2 },
  d6x4: { sides: 6, quantity: 4 },
  advantage: { sides: 20, quantity: 2, modifiers: { drop: { highest: 1 } } },
  disadvantage: { sides: 20, quantity: 2, modifiers: { drop: { lowest: 1 } } }
} as const

