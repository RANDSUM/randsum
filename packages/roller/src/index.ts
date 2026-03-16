// Re-export everything from subpaths for backward compatibility
export { roll } from './roll'

export * from './validate'
export * from './errors'
export type * from './types'

// Re-export notation functions for main barrel consumers
export { notationToOptions } from './notation/parse/notationToOptions'
export { listOfNotations } from './notation/parse/listOfNotations'
export { optionsToNotation } from './notation/transformers/optionsToNotation'
export { optionsToDescription } from './notation/transformers/optionsToDescription'
export { optionsToSidesFaces } from './notation/transformers/optionsToSidesFaces'
export {
  modifiersToNotation,
  modifiersToDescription
} from './notation/transformers/modifiersToStrings'
export { tokenize } from './notation/tokenize'
export type { Token, TokenType } from './notation/tokenize'
export { suggestNotationFix } from './notation/suggestions'
export { coreNotationPattern } from './notation/coreNotationPattern'
export { formatHumanList } from './notation/formatHumanList'
export { TTRPG_STANDARD_DIE_SET } from './notation/constants'
export {
  parseComparisonNotation,
  hasConditions,
  formatComparisonDescription,
  formatComparisonNotation
} from './notation/comparison'
