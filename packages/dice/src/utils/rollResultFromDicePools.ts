import {
  CapModifier,
  DropModifier,
  ExplodeModifier,
  MinusModifier,
  type ModifierOptions,
  type NumericRollBonus,
  PlusModifier,
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

function applyModifier(
  key: keyof ModifierOptions,
  modifiers: ModifierOptions,
  currentBonuses: NumericRollBonus,
  rollParams: { sides: number; quantity: number; rollOne: () => number }
): NumericRollBonus {
  const modifierMap = {
    reroll: () =>
      new RerollModifier(modifiers.reroll).apply(
        currentBonuses,
        undefined,
        rollParams.rollOne
      ),
    unique: () =>
      new UniqueModifier(modifiers.unique).apply(
        currentBonuses,
        { sides: rollParams.sides, quantity: rollParams.quantity },
        rollParams.rollOne
      ),
    replace: () => new ReplaceModifier(modifiers.replace).apply(currentBonuses),
    cap: () => new CapModifier(modifiers.cap).apply(currentBonuses),
    drop: () => new DropModifier(modifiers.drop).apply(currentBonuses),
    explode: () =>
      new ExplodeModifier(modifiers.explode).apply(
        currentBonuses,
        { sides: rollParams.sides, quantity: rollParams.quantity },
        rollParams.rollOne
      ),
    plus: () => new PlusModifier(modifiers.plus).apply(currentBonuses),
    minus: () => new MinusModifier(modifiers.minus).apply(currentBonuses)
  }

  const modifier = modifierMap[key]
  //eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!modifier) {
    throw new Error(`Unknown modifier: ${key}`)
  }

  return modifier()
}

function generateModifiedRolls(
  dicePools: DicePool,
  rawRolls: RollResult['rawRolls']
): RollResult['modifiedRolls'] {
  return Object.fromEntries(
    Object.entries(dicePools.dicePools).map(([key, params]) => {
      const rolls = rawRolls[key] ?? []

      if (isCustomParameters(params)) {
        return [
          key,
          {
            total: calculateTotal(rolls),
            rolls
          }
        ]
      }

      const {
        options: { sides, quantity = 1, modifiers = {} }
      } = params

      const rollOne = (): number => coreRandom(sides)
      const modified = Object.keys(modifiers).reduce(
        (bonuses, modifierKey) =>
          applyModifier(
            modifierKey as keyof ModifierOptions,
            modifiers,
            bonuses,
            { sides, quantity, rollOne }
          ),
        {
          simpleMathModifier: 0,
          rolls: rolls as number[]
        }
      )

      return [
        key,
        {
          rolls: modified.rolls,
          total: calculateTotal(modified.rolls, modified.simpleMathModifier)
        }
      ]
    })
  )
}

function generateRawRolls(
  dicePools: DicePool['dicePools']
): RollResult['rawRolls'] {
  return Object.fromEntries(
    Object.entries(dicePools).map(([key, pool]) => {
      const { options } = pool
      const quantity = options.quantity ?? 1

      if (isNumericRollOptions(options)) {
        return [key, coreSpreadRolls<number>(quantity, options.sides)]
      }

      return [
        key,
        coreSpreadRolls(quantity, options.sides.length, options.sides)
      ]
    })
  ) as RollResult['rawRolls']
}
