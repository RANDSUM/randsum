// Core functions - specific exports for better tree-shaking
export { roll } from './roll'
export { validateNotation } from './validateNotation'
export { isDiceNotation } from './isDiceNotation'

export type {
  ComparisonOptions,
  DiceNotation,
  DropOptions,
  InvalidValidationResult,
  ModifierConfig,
  ModifierLog,
  ModifierOptions,
  NumericRollBonus,
  ReplaceOptions,
  RerollOptions,
  RequiredNumericRollParameters,
  RollArgument,
  RollOptions,
  RollParams,
  RollRecord,
  RollResult,
  RollerRollResult,
  UniqueOptions,
  ValidValidationResult,
  ValidationResult
} from './types'
