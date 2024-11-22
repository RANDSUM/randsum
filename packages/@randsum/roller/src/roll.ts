import type { DicePools, RollArgument, RollResult } from './types'
import { randomUUIDv7 as uuid } from 'bun'
import { argumentToRollParameters } from './utils/argumentToRollParameters'
import { applyModifiers, calculateTotal } from './utils/applyModifiers'

export function roll(...args: RollArgument[]): RollResult {
  const dicePools: DicePools = args.reduce(
    (acc, arg) => ({ ...acc, [uuid()]: argumentToRollParameters(arg) }),
    {}
  )

  const rawRolls = Object.fromEntries(
    Object.keys(dicePools).map((key) => {
      const {
        die,
        config: { quantity }
      } = dicePools[key]
      return [key, die.rollMultiple(quantity || 1)]
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
