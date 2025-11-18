// Main exports for the roller package

// Core roll function
export { roll } from './roll'

// Validation functions
export { isDiceNotation } from './isDiceNotation'
export { validateNotation } from './validateNotation'
export type { ValidateNotationResult } from './validateNotation'

// Type exports
export type {
  Arithmetic,
  ComparisonQuery,
  DropModifier,
  RerollModifier,
  CapModifier,
  ReplaceModifier,
  UniqueModifier,
  RollModifiers,
  RequiredNumericRollParameters,
  RollOptions,
  RollParams,
  ModifierLog,
  NumericRollBonus,
  ModifierHistory,
  RollRecord,
  RollResult
} from './types'

