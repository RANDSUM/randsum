import { roll as baseRoll, type RollResult } from '@randsum/tower'
import * as DnD5ETypes from './types'

function roll(
  bonus: number = 0,
  mod: DnD5ETypes.RollMods
): [number, RollResult] {
  const isAdvantage = DnD5ETypes.RollMods.Advantage === mod
  const isDisadvantage = DnD5ETypes.RollMods.Disadvantage === mod
  const rollResult = baseRoll({
    sides: 20,
    quantity: isAdvantage || isDisadvantage ? 2 : 1,
    modifiers: {
      add: bonus,
      ...(isAdvantage ? { drop: { lowest: 1 } } : {}),
      ...(isDisadvantage ? { drop: { highest: 1 } } : {})
    }
  })

  return [rollResult.result, rollResult]
}

export const FifthEd = { roll }
