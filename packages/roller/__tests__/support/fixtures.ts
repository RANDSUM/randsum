import type {
  CustomRollOptions,
  NumericRollBonus,
  NumericRollOptions,
  RequiredNumericRollParameters
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

export function createNumericRollOptions(
  overrides: Partial<NumericRollOptions> = {}
): NumericRollOptions {
  return {
    sides: 20,
    quantity: 1,
    ...overrides
  }
}

export function createCustomRollOptions(
  overrides: Partial<CustomRollOptions> = {}
): CustomRollOptions {
  return {
    sides: ['Heads', 'Tails'],
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

export function createMockRollOne(returnValue = 4): () => number {
  return (): number => returnValue
}
