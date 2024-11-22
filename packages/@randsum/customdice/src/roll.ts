import type {
  CustomRollArgument,
  CustomDicePools,
  CustomRollResult
} from './types'
import { randomUUIDv7 as uuid } from 'bun'
import { argumentToCustomRollParameters } from './utils/agumentToCustomRollParameters'

export function roll(...args: CustomRollArgument[]): CustomRollResult {
  const dicePools: CustomDicePools = args.reduce(
    (acc, arg) => ({ ...acc, [uuid()]: argumentToCustomRollParameters(arg) }),
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
  const result = Object.values(rawRolls).flat()

  return {
    dicePools,
    rawRolls,
    result
  }
}
