import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  type ModifierOptions,
  type NumericRollBonus,
  ReplaceModifier,
  RerollModifier,
  UniqueModifier
} from '@randsum/core'
import { isNumericRollOptions } from '../guards/isNumericRollOptions'
import type {
  CustomRollParams,
  DicePool,
  RollParams,
  RollResult
} from '../types'
import { calculateTotal } from './calculateTotal'
import { coreRandom } from './coreRandom'
import { coreSpreadRolls } from './coreSpreadRolls'

export function rollResultFromDicePools(dicePools: DicePool): RollResult {
  const rawRolls = generateRawRolls(dicePools.dicePools)
  const modifiedRolls = generateModifiedRolls(dicePools, rawRolls)
  const modifiedValues = Object.values(modifiedRolls)

  return {
    ...dicePools,
    rawRolls,
    modifiedRolls,
    rawResult: Object.values(rawRolls).flat(),
    result: modifiedValues.map((pool) => pool.rolls).flat(),
    type: calculateDicePoolType(dicePools.dicePools),
    total: calculateTotal(modifiedValues.map((pool) => pool.total))
  } as RollResult
}

function calculateDicePoolType(
  dicePools: DicePool['dicePools']
): RollResult['type'] {
  const pools = Object.values(dicePools)

  if (pools.every((pool) => typeof pool.options.sides === 'number')) {
    return 'numerical'
  }

  if (pools.every((pool) => Array.isArray(pool.options.sides))) {
    return 'custom'
  }

  return 'mixed'
}

function isCustomParameters(
  poolParameters: RollParams
): poolParameters is CustomRollParams {
  return Array.isArray(poolParameters.options.sides)
}

/**
 * Apply a modifier to the current roll bonuses
 *
 * This optimized implementation avoids unnecessary object creation and function calls
 * by directly applying modifiers based on their type.
 *
 * @param key - The modifier key to apply
 * @param modifiers - All available modifiers
 * @param currentBonuses - The current roll bonuses to modify
 * @param rollParams - Parameters for the roll
 * @returns Modified roll bonuses
 */
function applyModifier(
  key: keyof ModifierOptions,
  modifiers: ModifierOptions,
  currentBonuses: NumericRollBonus,
  rollParams: { sides: number; quantity: number; rollOne: () => number }
): NumericRollBonus {
  const modifierValue = modifiers[key]
  if (modifierValue === undefined) {
    return currentBonuses
  }

  switch (key) {
    case 'plus':
      return {
        ...currentBonuses,
        simpleMathModifier: Number(modifierValue)
      }

    case 'minus':
      return {
        ...currentBonuses,
        simpleMathModifier: -(Number(modifierValue))
      }

    case 'reroll':
      return new RerollModifier(modifiers.reroll).apply(
        currentBonuses,
        undefined,
        rollParams.rollOne
      )

    case 'unique':
      return new UniqueModifier(modifiers.unique).apply(
        currentBonuses,
        { sides: rollParams.sides, quantity: rollParams.quantity },
        rollParams.rollOne
      )

    case 'replace':
      return new ReplaceModifier(modifiers.replace).apply(currentBonuses)

    case 'cap':
      return new CapModifier(modifiers.cap).apply(currentBonuses)

    case 'drop':
      return new DropModifier(modifiers.drop).apply(currentBonuses)

    case 'explode':
      return new ExplodeModifier(modifiers.explode).apply(
        currentBonuses,
        { sides: rollParams.sides, quantity: rollParams.quantity },
        rollParams.rollOne
      )

    default:
      throw new Error(`Unknown modifier: ${String(key)}`)
  }
}

/**
 * Generate modified roll results by applying modifiers to raw rolls
 *
 * This optimized implementation reduces unnecessary object creation and improves
 * performance by optimizing the modifier application order and using more efficient
 * data structures.
 *
 * @param dicePools - The dice pools to process
 * @param rawRolls - The raw roll results
 * @returns Modified roll results
 */
function generateModifiedRolls(
  dicePools: DicePool,
  rawRolls: RollResult['rawRolls']
): RollResult['modifiedRolls'] {
  const result: RollResult['modifiedRolls'] = {}

  for (const [key, params] of Object.entries(dicePools.dicePools)) {
    const rolls = rawRolls[key] ?? []

    if (isCustomParameters(params)) {
      result[key] = {
        total: calculateTotal(rolls),
        rolls
      }
      continue
    }

    const { sides, quantity = 1, modifiers = {} } = params.options

    if (Object.keys(modifiers).length === 0) {
      result[key] = {
        total: calculateTotal(rolls),
        rolls: rolls.map((Number))
      }
      continue
    }

    const rollOne = (): number => coreRandom(sides)

    const initialBonuses: NumericRollBonus = {
      simpleMathModifier: 0,
      rolls: rolls.map((Number))
    }

    let bonuses = initialBonuses

    if (modifiers.reroll) {
      bonuses = applyModifier('reroll', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.replace) {
      bonuses = applyModifier('replace', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.cap) {
      bonuses = applyModifier('cap', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.explode) {
      bonuses = applyModifier('explode', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.unique) {
      bonuses = applyModifier('unique', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.drop) {
      bonuses = applyModifier('drop', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.plus) {
      bonuses = applyModifier('plus', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    if (modifiers.minus) {
      bonuses = applyModifier('minus', modifiers, bonuses, {
        sides,
        quantity,
        rollOne
      })
    }

    result[key] = {
      rolls: bonuses.rolls,
      total: calculateTotal(bonuses.rolls, bonuses.simpleMathModifier)
    }
  }

  return result
}

/**
 * Generate raw roll results for all dice pools
 *
 * This optimized implementation reduces unnecessary object creation and improves
 * performance by using direct object property assignment instead of creating
 * intermediate arrays.
 *
 * @param dicePools - The dice pools to roll
 * @returns Raw roll results
 */
function generateRawRolls(
  dicePools: DicePool['dicePools']
): RollResult['rawRolls'] {
  const result: RollResult['rawRolls'] = {}

  for (const [key, pool] of Object.entries(dicePools)) {
    const { options } = pool
    const quantity = options.quantity ?? 1

    if (isNumericRollOptions(options)) {
      result[key] = coreSpreadRolls<number>(quantity, options.sides)
    } else {
      result[key] = coreSpreadRolls(
        quantity,
        options.sides.length,
        options.sides
      )
    }
  }

  return result
}
