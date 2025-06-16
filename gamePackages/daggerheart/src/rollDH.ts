import { type NumericRollOptions, roll } from '@randsum/dice'
import type {
  AdvantageDisadvantageDH,
  RollArgumentDH,
  RollResultDH,
  RollResultDHType
} from './types'

/**
 * Generates roll arguments based on Daggerheart mechanics
 *
 * @param options - Roll configuration with modifiers and amplification
 * @returns Array of roll options for hope and fear dice
 * @internal
 */
function rollArg({ modifier = 0, amplifyHope = false, amplifyFear = false }: RollArgumentDH): NumericRollOptions[] {
  if (amplifyHope && amplifyFear) {
    return [{
      quantity: 2,
      sides: 20,
      modifiers: { plus: modifier }
    }]
  }
  if (amplifyHope) {
    return [{
      quantity: 1,
      sides: 20,
      modifiers: { plus: modifier }
    },
    {
      quantity: 1,
      sides: 12,
      modifiers: { plus: modifier }
    }]
  }
  if (amplifyFear) {
    return [{
      quantity: 1,
      sides: 12,
      modifiers: { plus: modifier }
    },
    {
      quantity: 1,
      sides: 12,
      modifiers: { plus: modifier }
    }]
  }
  return [{
    quantity: 2,
    sides: 12,
    modifiers: { plus: modifier }
  }]
}

/**
 * Rolls dice using Daggerheart mechanics
 *
 * This function implements the Hope and Fear dice system used in Daggerheart,
 * where players roll two dice (typically d12s) representing Hope and Fear.
 * The higher die determines success, and when both dice show the same value,
 * it results in a critical hope outcome.
 *
 * @param options - Roll configuration object
 * @param options.modifier - Numeric modifier to add to the roll (default: 0)
 * @param options.rollingWith - Advantage/disadvantage state (adds/subtracts d6)
 * @param options.amplifyHope - Whether to amplify hope (use d20 instead of d12)
 * @param options.amplifyFear - Whether to amplify fear (use two d12s for fear)
 *
 * @returns Detailed roll result with type, total, and individual dice values
 *
 * @example
 * // Standard Daggerheart roll
 * rollDH({ modifier: 3 })
 * // Returns: { type: 'hope'|'fear'|'critical hope', total: number, rolls: {...} }
 *
 * @example
 * // Roll with advantage
 * rollDH({ modifier: 2, rollingWith: 'Advantage' })
 *
 * @example
 * // Amplified hope roll
 * rollDH({ modifier: 1, amplifyHope: true })
 */
export function rollDH({
  modifier = 0,
  rollingWith,
  amplifyHope = false,
  amplifyFear = false
}: RollArgumentDH): RollResultDH {
  const {
    result: [hope, fear],
    total
  } = roll(...rollArg({ modifier, amplifyHope, amplifyFear }))
  if (hope === undefined || fear === undefined) {
    throw new Error('Failed to roll hope and fear')
  }

  const [totalWithAdvantage, advantage] = calculateTotal(total, rollingWith)

  return {
    type: calculateType(hope, fear),
    total: totalWithAdvantage,
    rolls: {
      hope,
      advantage,
      fear,
      modifier
    }
  }
}

function calculateType(hope: number, fear: number): RollResultDHType {
  if (hope === fear) {
    return 'critical hope'
  }
  if (hope > fear) {
    return 'hope'
  }
  return 'fear'
}

function calculateTotal(
  total: number,
  rollingWith: AdvantageDisadvantageDH | undefined
): [number, number | undefined] {
  if (rollingWith) {
    const advantage = advantageDie()
    if (rollingWith === 'Advantage') {
      return [total + advantage, advantage]
    }
    return [total - advantage, -advantage]
  }
  return [total, undefined]
}

function advantageDie(): number {
  return roll({
    quantity: 1,
    sides: 6
  }).total
}
