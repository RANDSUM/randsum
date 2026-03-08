export { roll } from '../roll'

export { validateNotation } from '../validateNotation'
export { isDiceNotation, notation } from '@randsum/notation'
export { validateRollOptions } from '../lib/optionsValidation'

export { optionsToNotation, optionsToDescription, optionsToSidesFaces } from '../lib/transformers'

export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan
} from '../lib/utils'

export {
  ERROR_CODES,
  RandsumError,
  NotationParseError,
  ModifierError,
  ValidationError,
  RollError
} from '../errors'

export type { ErrorCode } from '../errors'

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
export type { ModifierPriorityName } from '../lib/modifiers/priorities'

export { normalize, equate } from '../lib/normalize'

export { d, DiceBuilder } from '../lib/builder'
