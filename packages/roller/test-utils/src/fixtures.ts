import type { RollOptions, RollParams } from '../../src/types'

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
 * Create RollParams with defaults and optional overrides
 */
export function createRollParams(overrides: Partial<RollParams> = {}): RollParams {
  const defaults: RollParams = {
    sides: 6,
    quantity: 1,
    description: ['Roll 1d6'],
    argument: '1d6',
    arithmetic: 'add',
    notation: '1d6',
    modifiers: {},
    key: 'Roll 1'
  }

  return {
    ...defaults,
    ...overrides
  }
}
