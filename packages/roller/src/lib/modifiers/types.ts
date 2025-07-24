import type { ModifierOptions, NumericRollBonus, RequiredNumericRollParameters } from '../../types'

export type ModifierHandler = (
  bonus: NumericRollBonus,
  options: ModifierOptions[keyof ModifierOptions],
  rollOne?: () => number,
  context?: RequiredNumericRollParameters
) => NumericRollBonus

export type DescriptionHandler = (
  options: ModifierOptions[keyof ModifierOptions]
) => string[] | undefined

export type NotationHandler = (
  options: ModifierOptions[keyof ModifierOptions]
) => string | undefined
