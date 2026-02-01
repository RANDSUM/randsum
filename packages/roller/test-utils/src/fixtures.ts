import type {
  DiceNotation,
  NumericRollBonus,
  RequiredNumericRollParameters,
  RollOptions,
  RollParams
} from '../../src/types'

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

/**
 * Create a NumericRollBonus with defaults and optional overrides
 */
export function createNumericRollBonus(
  overrides: Partial<NumericRollBonus> = {}
): NumericRollBonus {
  return {
    rolls: [5, 10, 15],
    simpleMathModifier: 0,
    logs: [],
    ...overrides
  }
}

/**
 * Create RollOptions with defaults and optional overrides
 */
export function createRollOptions(overrides: Partial<RollOptions> = {}): RollOptions {
  return {
    sides: 20,
    quantity: 1,
    ...overrides
  }
}

/**
 * Create RequiredNumericRollParameters with defaults and optional overrides
 */
export function createRequiredNumericRollParameters(
  overrides: Partial<RequiredNumericRollParameters> = {}
): RequiredNumericRollParameters {
  return {
    sides: 6,
    quantity: 1,
    ...overrides
  }
}

/**
 * Create RollParams with defaults and optional overrides
 */
export function createRollParams(overrides: Partial<RollParams> = {}): RollParams {
  const defaults: RollParams = {
    sides: 6,
    quantity: 1,
    description: ['Roll 1d6'],
    argument: '1d6' as DiceNotation,
    arithmetic: 'add',
    notation: '1d6' as DiceNotation,
    modifiers: {},
    key: 'Roll 1'
  }

  return {
    ...defaults,
    ...overrides
  }
}

/**
 * Create a mock rollOne function that returns a fixed value
 */
export function createMockRollOne(returnValue = 4): () => number {
  return (): number => returnValue
}
