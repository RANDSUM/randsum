import { formDicePools, rollDicePools } from '@randsum/core'
import type { CustomFacesRollResult, CustomFacesRollArgument } from './types'
import { argumentToCustomFacesRollParameters } from './utils/argumentToCustomFacesRollParameters'

export function rollCustomFaces(
  ...args: CustomFacesRollArgument[]
): CustomFacesRollResult {
  const dicePools = formDicePools(args, argumentToCustomFacesRollParameters)
  const rawRolls = rollDicePools(dicePools)

  return {
    dicePools,
    rawRolls,
    result: Object.values(rawRolls).flat()
  }
}
