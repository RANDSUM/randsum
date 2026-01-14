import type { ModifierOptions, NumericRollBonus, RequiredNumericRollParameters } from '../../types'
import { ModifierError } from '../../errors'
import { type ModifierContext, applyModifierHandler } from './handlers'

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

  const ctx: ModifierContext = {
    rollOne,
    context
  }

  try {
    return applyModifierHandler(type, options, bonus, ctx)
  } catch (error) {
    if (error instanceof Error) {
      throw new ModifierError(type, error.message)
    }
    throw new ModifierError(type, `Unknown error: ${String(error)}`)
  }
}
