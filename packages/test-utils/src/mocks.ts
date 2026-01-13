import type { RollConfig, RollRecord, RollerRollResult } from '@randsum/roller'
import { notation, roll } from '@randsum/roller'
import { createSeededRandom } from './seededRandom'

/**
 * Creates a mock roll result with specified values.
 * Useful for testing game-specific logic without actual randomness.
 *
 * @param rolls - Array of roll values
 * @param total - Total value (defaults to sum of rolls)
 * @returns A mock RollerRollResult
 */
export function createMockRoll(rolls: number[], total?: number): RollerRollResult {
  const mockRollRecord: RollRecord = {
    description: ['Mock roll'],
    parameters: {
      sides: 20,
      quantity: rolls.length,
      arithmetic: 'add',
      modifiers: {},
      key: 'Mock roll',
      argument: { sides: 20, quantity: rolls.length },
      notation: notation(`${rolls.length}d20`),
      description: ['Mock roll']
    },
    rolls,
    modifierHistory: {
      logs: [],
      modifiedRolls: rolls,
      total: total ?? rolls.reduce((a, b) => a + b, 0),
      initialRolls: rolls
    },
    appliedTotal: total ?? rolls.reduce((a, b) => a + b, 0),
    total: total ?? rolls.reduce((a, b) => a + b, 0)
  }

  return {
    rolls: [mockRollRecord],
    result: rolls.map(String),
    total: total ?? rolls.reduce((a, b) => a + b, 0)
  }
}

/**
 * Creates a deterministic roll using a seeded random number generator.
 *
 * @param notation - Dice notation string
 * @param seed - Seed value for deterministic results
 * @returns A deterministic roll result
 */
export function createDeterministicRoll(notationStr: string, seed: number): RollerRollResult {
  const diceNotation = notation(notationStr)
  const config: RollConfig = { randomFn: createSeededRandom(seed) }
  return roll(diceNotation, config)
}
