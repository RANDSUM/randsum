import { ModifierEngine } from '../../lib/modifiers'
import type { ModifierOptions, NumericRollBonus } from '../../types/modifiers'

interface ModifierContext {
  sides: number
  quantity: number
  rollOne: () => number
}

export function applyModifier(
  key: keyof ModifierOptions,
  modifiers: ModifierOptions,
  currentBonuses: NumericRollBonus,
  context: ModifierContext
): NumericRollBonus {
  const modifierValue = modifiers[key]

  return ModifierEngine.apply(
    key,
    modifierValue,
    currentBonuses,
    { sides: context.sides, quantity: context.quantity },
    context.rollOne
  )
}
