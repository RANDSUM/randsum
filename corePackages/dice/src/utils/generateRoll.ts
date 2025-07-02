import { isNumericRollOptions } from '@randsum/core'
import type {
  NumericRollOptions,
  RollParams,
  SingleCustomRollResult,
  SingleNumericRollResult,
  SingleRollResult
} from '../types'
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
import { coreSpreadRolls } from './coreSpreadRolls'
import { isCustomRollParams } from '../guards/isCustomRollParams'
import { calculateTotal } from './calculateTotal'
import { coreRandom } from './coreRandom'
import { isNumericRollParams } from '../guards/isNumericRollParams'

function generateRoll(parameters: RollParams): SingleRollResult {
  const rawRolls = generateRawRolls(parameters)
  const modifiedRolls = generateModifiedRolls(parameters, rawRolls)
  const rawResult = calculateTotal(rawRolls)
  if (
    rawRolls.every((n) => typeof n === 'number') &&
    modifiedRolls.rolls.every((n) => typeof n === 'number') &&
    typeof rawResult === 'number' &&
    isNumericRollParams(parameters)
  ) {
    return {
      parameters,
      rawResult,
      rawRolls,
      modifiedRolls,
      total: modifiedRolls.total,
      type: 'numeric'
    } as SingleNumericRollResult
  }
  if (
    rawRolls.every((n) => typeof n === 'string') &&
    modifiedRolls.rolls.every((n) => typeof n === 'string') &&
    typeof rawResult === 'string' &&
    isCustomRollParams(parameters)
  ) {
    return {
      parameters,
      rawResult,
      rawRolls,
      modifiedRolls,
      total: calculateTotal(modifiedRolls.rolls),
      type: 'custom'
    } as SingleCustomRollResult
  }
  throw new Error('Mixed rolls are not supported yet')
}

function generateRawRolls({
  options
}: RollParams): SingleRollResult['rawRolls'] {
  const quantity = options.quantity ?? 1

  if (isNumericRollOptions(options)) {
    return coreSpreadRolls<number>(quantity, options.sides)
  } else {
    return coreSpreadRolls(quantity, options.sides.length, options.sides)
  }
}

export { generateRoll }

function generateModifiedRolls(
  parameters: RollParams,
  rolls: SingleRollResult['rawRolls']
): SingleRollResult['modifiedRolls'] {
  if (
    isCustomRollParams(parameters) &&
    rolls.every((n) => typeof n === 'string')
  ) {
    return {
      total: calculateTotal(rolls),
      rolls
    } as SingleCustomRollResult['modifiedRolls']
  }

  if (!rolls.every((n) => typeof n === 'number')) {
    throw new Error('Mixed rolls are not supported yet')
  }

  const {
    sides,
    quantity = 1,
    modifiers = {}
  } = parameters.options as NumericRollOptions

  if (Object.keys(modifiers).length === 0) {
    return {
      total: calculateTotal(rolls),
      rolls: rolls.map((n) => Number(n))
    } as SingleNumericRollResult['modifiedRolls']
  }

  const rollOne = (): number => coreRandom(sides)

  const initialBonuses: NumericRollBonus = {
    simpleMathModifier: 0,
    rolls: rolls.map((n) => Number(n))
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

  return {
    rolls: bonuses.rolls,
    total: calculateTotal(bonuses.rolls, bonuses.simpleMathModifier)
  } as SingleNumericRollResult['modifiedRolls']
}

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
        simpleMathModifier: -Number(modifierValue)
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
