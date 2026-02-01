export { roll } from '../roll'

export { validateNotation } from '../validateNotation'
export { isDiceNotation, notation } from '../isDiceNotation'
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

export { analyze } from '../lib/probability'

export { PRESETS, resolvePreset, resolvePresetParam } from '../presets'

export { createGameRoll, createMultiRollGameRoll } from '../lib/gameRoll'
