import type {
  ErrorContext,
  RollBonus,
  RequiredRollParameters,
  RollOptions
} from '../../src'

export function createRollBonus(overrides: Partial<RollBonus> = {}): RollBonus {
  return {
    rolls: [5, 10, 15],
    simpleMathModifier: 0,
    logs: [],
    ...overrides
  }
}

export function createRollOptions(
  overrides: Partial<RollOptions> = {}
): RollOptions {
  return {
    sides: 20,
    quantity: 1,
    ...overrides
  }
}

export function createRequiredRollParameters(
  overrides: Partial<RequiredRollParameters> = {}
): RequiredRollParameters {
  return {
    sides: 6,
    quantity: 1,
    ...overrides
  }
}

export function createErrorContext(
  overrides: Partial<ErrorContext> = {}
): ErrorContext {
  return {
    input: 'test-input',
    expected: 'test-expected',
    location: 'test-location',
    ...overrides
  }
}

export function createMockRollOne(returnValue = 4): () => number {
  return (): number => returnValue
}
