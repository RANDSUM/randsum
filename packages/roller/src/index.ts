// Core functions - specific exports for better tree-shaking
export { roll } from './roll'
export { rollCustom } from './rollCustom'
export { validateNotation } from './validateNotation'
export { isDiceNotation } from './isDiceNotation'

// Type exports - specific exports for better tree-shaking
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
