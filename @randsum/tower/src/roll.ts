import type { RollArgument, RollResult } from './types'
import { argumentToRollParameters } from './utils/argumentToRollParameters'
import { applyModifiers, calculateTotal } from './utils/applyModifiers'
import { formDicePools, rollDicePools } from '@randsum/core'

export function roll(...args: RollArgument[]): RollResult {
  const dicePools = formDicePools(args, argumentToRollParameters)
  const rawRolls = rollDicePools(dicePools)

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

  return {
    dicePools,
    rawRolls,
    modifiedRolls,
    rawResult: Object.values(rawRolls).flat(),
    result: calculateTotal(
      Object.values(modifiedRolls).map((pool) => pool.total)
    )
  }
}
