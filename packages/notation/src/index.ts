// Types
export type {
  ComparisonOptions,
  DropOptions,
  KeepOptions,
  RerollOptions,
  ReplaceOptions,
  UniqueOptions,
  SuccessCountOptions,
  ModifierConfig,
  ModifierOptions,
  DiceNotation,
  ParsedNotationOptions,
  RollOptions,
  ValidValidationResult,
  InvalidValidationResult,
  ValidationErrorInfo,
  ValidationResult
} from './types'

// Schema
export type { NotationSchema } from './schema'
export { defineNotationSchema } from './schema'

// Parsing
export { notationToOptions } from './parse/notationToOptions'
export { listOfNotations } from './parse/listOfNotations'
export { isDiceNotation, notation, NotationParseError } from './isDiceNotation'

// Validation
export { validateNotation } from './validateNotation'

// Transformers
export {
  optionsToNotation,
  optionsToDescription,
  optionsToSidesFaces,
  modifiersToNotation,
  modifiersToDescription
} from './transformers'

// Validation/suggestions
export { suggestNotationFix } from './suggestions'

// Core pattern
export { coreNotationPattern } from './coreNotationPattern'

// Comparison utilities
export {
  parseComparisonNotation,
  hasConditions,
  formatComparisonNotation,
  formatComparisonDescription
} from './comparison'

// Tokenization (for UI display)
export { tokenize } from './tokenize'
export type { Token, TokenType } from './tokenize'

// Format utility
export { formatHumanList } from './formatHumanList'

// All modifier schemas (for roller to register)
export {
  capSchema,
  dropSchema,
  keepSchema,
  replaceSchema,
  rerollSchema,
  explodeSchema,
  compoundSchema,
  penetrateSchema,
  uniqueSchema,
  countSuccessesSchema,
  multiplySchema,
  plusSchema,
  minusSchema,
  multiplyTotalSchema
} from './definitions'
