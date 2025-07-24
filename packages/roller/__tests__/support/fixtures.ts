import type {
  NumericRollBonus,
  RequiredNumericRollParameters,
  RollOptions,
  RollParams
} from '../../src'

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

export function createRollOptions(overrides: Partial<RollOptions> = {}): RollOptions {
  return {
    sides: 20,
    quantity: 1,
    ...overrides
  }
}

export function createRequiredNumericRollParameters(
  overrides: Partial<RequiredNumericRollParameters> = {}
): RequiredNumericRollParameters {
  return {
    sides: 6,
    quantity: 1,
    ...overrides
  }
}

export function createRollParams(overrides: Partial<RollParams> = {}): RollParams {
  return {
    sides: 6,
    quantity: 1,
    description: ['Roll 1d6'],
    argument: '1d6',
    arithmetic: 'add',
    notation: '1d6',
    modifiers: {},
    ...overrides
  }
}

export function createMockRollOne(returnValue = 4): () => number {
  return (): number => returnValue
}
