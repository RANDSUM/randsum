import { roll5e } from './roll5e'
import type { RollArgument5e } from './types'

export function meetOrBeat5e(
  difficultyClass: number,
  rollArg: RollArgument5e
): boolean {
  return roll5e(rollArg).total >= difficultyClass
}
