import type { ComparisonOptions } from '../../../types'
import { applyCap } from './applyCap'

export function applyCapping(rolls: number[], options: ComparisonOptions): number[] {
  return rolls.map(roll => applyCap(roll, options))
}
