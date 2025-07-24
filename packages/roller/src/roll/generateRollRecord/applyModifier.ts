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
  { sides, quantity, rollOne }: ModifierContext
): NumericRollBonus {
  const modifierValue = modifiers[key]

  return ModifierEngine.apply(key, modifierValue, currentBonuses, { sides, quantity }, rollOne)
}
