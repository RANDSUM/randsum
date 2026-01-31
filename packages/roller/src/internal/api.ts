// ============================================================================
// Internal API - All public functions exported from the package
// ============================================================================
// This module consolidates all public function exports.
// Refactoring internal paths does not affect this file.

// Core roll functions
export { roll, tryRoll } from '../roll'

// Validation
export { validateNotation } from '../validateNotation'
export { isDiceNotation, notation, tryNotation } from '../isDiceNotation'
export { validateRollOptions } from '../lib/optionsValidation'

// Transformers (options ↔ notation ↔ description)
export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from '../lib/transformers'

// Result utilities
export { isSuccess, isError, success, error } from '../lib/utils'

// Validation utilities
export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan
} from '../lib/utils'

// Error classes
export {
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationErrorClass,
  RollError
} from '../errors'

// Probability analysis
export { analyze } from '../lib/probability'

// Presets
export { PRESETS, resolvePreset, resolvePresetParam } from '../presets'

// Game roll factories
export { createGameRoll, createMultiRollGameRoll } from '../lib/gameRoll'
