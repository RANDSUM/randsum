import { roll } from './roll'
import type { RollArgument } from './types'

export function meetOrBeat(
  difficultyClass: number,
  rollArg: RollArgument
): boolean {
  return roll(rollArg).total >= difficultyClass
}
