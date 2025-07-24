import type { ModifierOptions, NumericRollBonus, RequiredNumericRollParameters } from '../../types'
import { MODIFIER_HANDLERS } from './transformers/modifierHandlers'

export function applyModifiers(
  type: keyof ModifierOptions,
  options: ModifierOptions[keyof ModifierOptions],
  bonus: NumericRollBonus,
  context?: RequiredNumericRollParameters,
  rollOne?: () => number
): NumericRollBonus {
  if (options === undefined) {
    return bonus
  }

  const handler = MODIFIER_HANDLERS.get(type)
  if (!handler) {
    throw new Error(`Unknown modifier type: ${type}`)
  }

  return handler(bonus, options, rollOne, context)
}
