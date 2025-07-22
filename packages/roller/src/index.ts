export { roll } from './roll'
export { validateNotation } from './validateNotation'
export { isDiceNotation } from './isDiceNotation'

export type {
  DiceNotation,
  RollArgument,
  RollOptions,
  RequiredNumericRollParameters
} from './types/core'

export type {
  ComparisonOptions,
  DropOptions,
  ModifierConfig,
  ModifierLog,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  UniqueOptions
} from './types/modifiers'

export type {
  RollParams,
  RollRecord,
  RollResult,
  RollerRollResult
} from './types/roll'

export type {
  InvalidValidationResult,
  ValidValidationResult,
  ValidationResult
} from './types/validation'
