import type { ModifierOptions } from '@randsum/roller'
import type { FifthAdvantageDisadvantage } from '../types'

export function generateModifiers({
  advantage,
  disadvantage
}: FifthAdvantageDisadvantage = {}): Pick<ModifierOptions, 'drop'> {
  if ((advantage && disadvantage) || (!advantage && !disadvantage)) {
    return { drop: {} }
  }

  return {
    drop: advantage ? { lowest: 1 } : { highest: 1 }
  }
}
