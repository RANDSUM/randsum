import { formDicePools } from '@randsum/core'
import type { CustomRollResult, CustomRollArgument } from './types'
import { argumentToCustomRollParameters } from './utils/argumentToCustomRollParameters'

export function roll(...args: CustomRollArgument[]): CustomRollResult {
  const dicePools = formDicePools(args, argumentToCustomRollParameters)

  const rawRolls = Object.fromEntries(
    Object.keys(dicePools).map((key) => {
      const {
        die,
        config: { quantity }
      } = dicePools[key]
      return [key, die.rollMany(quantity)]
    })
  )

  const result = Object.values(rawRolls).flat()

  return {
    dicePools,
    rawRolls,
    result
  }
}
