import { formDicePools, rollDicePools } from '@randsum/core'
import type { CustomRollResult, CustomRollArgument } from './types'
import { argumentToCustomRollParameters } from './utils/argumentToCustomRollParameters'

export function roll(...args: CustomRollArgument[]): CustomRollResult {
  const dicePools = formDicePools(args, argumentToCustomRollParameters)
  const rawRolls = rollDicePools(dicePools)

  return {
    dicePools,
    rawRolls,
    result: Object.values(rawRolls).flat()
  }
}
