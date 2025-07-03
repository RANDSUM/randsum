import { roll } from './roll'
import type { RollArgument5e } from './types'

export function meetOrBeat5e(
  difficultyClass: number,
  rollArg: RollArgument5e
): boolean {
  return roll(rollArg).total >= difficultyClass
}
