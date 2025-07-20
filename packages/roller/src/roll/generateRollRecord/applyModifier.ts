import type { ModifierOptions, NumericRollBonus } from '../../types'
import { type ModifierContext, ModifierDispatcher } from './ModifierDispatcher'

export function applyModifier(
  key: keyof ModifierOptions,
  modifiers: ModifierOptions,
  currentBonuses: NumericRollBonus,
  context: ModifierContext
): NumericRollBonus {
  const modifierValue = modifiers[key]
  if (modifierValue === undefined) {
    return currentBonuses
  }

  return ModifierDispatcher.dispatch(
    key,
    modifierValue,
    currentBonuses,
    context
  )
}
