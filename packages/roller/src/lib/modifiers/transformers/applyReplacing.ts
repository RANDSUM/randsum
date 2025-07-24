import type { ReplaceOptions } from '../../../types'
import { applyCap } from './applyCap'

export function applyReplacing(
  rolls: number[],
  options: ReplaceOptions | ReplaceOptions[]
): number[] {
  const replaceRules = Array.isArray(options) ? options : [options]
  let result = [...rolls]

  for (const { from, to } of replaceRules) {
    result = result.map(roll => {
      if (typeof from === 'object') {
        // Comparison-based replacement
        return applyCap(roll, from, to)
      } else {
        // Exact value replacement
        return roll === from ? to : roll
      }
    })
  }

  return result
}
