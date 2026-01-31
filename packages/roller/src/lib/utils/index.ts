// ============================================================================
// Utils - Generic utility functions
// ============================================================================

export { isSuccess, isError, success, error } from './result'
export type { Result, SuccessResult, ErrorResult } from './result'

export {
  validateInteger,
  validateRange,
  validateNonNegative,
  validateFinite,
  validateGreaterThan,
  validateLessThan
} from './validation'
