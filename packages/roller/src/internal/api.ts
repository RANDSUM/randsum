export { roll } from '../roll'

export { validateNotation, isDiceNotation, notation } from '@randsum/notation'
export { validateRollOptions } from '../lib/optionsValidation'

export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from '../lib/transformers'

export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan
} from '../lib/utils'

export {
  ERROR_CODES,
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError
} from '../errors'

export { PRESETS, resolvePreset, resolvePresetParam } from '../presets'

export { createGameRoll, createMultiRollGameRoll } from '../lib/gameRoll'

export {
  matchesComparison,
  formatComparisonDescription,
  formatComparisonNotation,
  parseComparisonNotation,
  hasConditions
} from '../lib/comparison'

export { MODIFIER_PRIORITIES } from '../lib/modifiers/priorities'

export { formatResult, isFormattedError } from '../formatResult'
