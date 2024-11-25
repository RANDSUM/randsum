import type { RollArgument, RollResult } from './types'
import { argumentToRollParameters } from './utils/argumentToRollParameters'
import { applyModifiers, calculateTotal } from './utils/applyModifiers'
import { formDicePools } from '@randsum/core'

export function roll(...args: RollArgument[]): RollResult {
  const dicePools = formDicePools(args, argumentToRollParameters)

  const rawRolls = Object.fromEntries(
    Object.keys(dicePools).map((key) => {
      const {
        die,
        config: { quantity }
      } = dicePools[key]
      return [key, die.rollMany(quantity || 1)]
    })
  )

  const modifiedRolls = Object.fromEntries(
    Object.keys(dicePools).map((key) => {
      const modified = applyModifiers(dicePools[key], rawRolls[key])
      return [
        key,
        {
          rolls: modified.rolls,
          total: calculateTotal(modified.rolls, modified.simpleMathModifier)
        }
      ]
    })
  )

  const modifiedValues = Object.values(modifiedRolls)

  return {
    dicePools,
    rawRolls,
    modifiedRolls,
    rawResult: Object.values(rawRolls).flat(),
    result: calculateTotal(modifiedValues.map((pool) => pool.total))
  }
}
